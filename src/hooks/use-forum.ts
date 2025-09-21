
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getDoc,
    getDocs,
    writeBatch,
    increment,
    deleteDoc,
} from 'firebase/firestore';
import { useToast } from './use-toast';
import type { ForumPost, ForumReply, ForumComment, ForumAuthor } from '@/lib/types';
import { addReplyAction } from '@/app/actions';


// Hook to fetch all forum posts
export function useForum() {
  const { toast } = useToast();
  const [posts, setPosts] = React.useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    const postsQuery = query(collection(db, 'forum'), orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost));
      setPosts(postsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching forum posts:", error);
      toast({
        title: "Forum Yüklenemedi",
        description: "Gönderiler yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  return { posts, isLoading };
}


// Hook to fetch a single post, its replies, and all comments for those replies
export function useForumPost(postId: string) {
    const { toast } = useToast();
    const [post, setPost] = React.useState<ForumPost | null>(null);
    const [replies, setReplies] = React.useState<ForumReply[]>([]);
    const [comments, setComments] = React.useState<Record<string, ForumComment[]>>({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);

    const forceRefresh = React.useCallback(() => {
        setRefreshTrigger(v => v + 1);
    }, []);

    React.useEffect(() => {
      if (!postId) {
          setIsLoading(false);
          return;
      };
      
      setIsLoading(true);
      const postDocRef = doc(db, 'forum', postId);

      const unsubscribePost = onSnapshot(postDocRef, (docSnap) => {
          if (docSnap.exists()) {
              setPost({ id: docSnap.id, ...docSnap.data() } as ForumPost);
          } else {
              setPost(null);
          }
      }, (error) => {
          console.error(`Error fetching post ${postId}:`, error);
          toast({ title: "Hata", description: "Gönderi yüklenemedi.", variant: "destructive" });
      });

      const repliesQuery = query(collection(db, `forum/${postId}/replies`), orderBy('date', 'asc'));
      const unsubscribeReplies = onSnapshot(repliesQuery, async (snapshot) => {
        const repliesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumReply));
        setReplies(repliesData);

        // Fetch comments for all replies
        const allComments: Record<string, ForumComment[]> = {};
        const commentPromises = repliesData.map(reply => {
            const commentsQuery = query(collection(db, `forum/${postId}/replies/${reply.id}/comments`), orderBy('date', 'asc'));
            return getDocs(commentsQuery).then(commentsSnapshot => {
                allComments[reply.id] = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumComment));
            });
        });
        await Promise.all(commentPromises);
        setComments(allComments);
        setIsLoading(false); // All data is loaded
      }, (error) => {
        console.error(`Error fetching replies for post ${postId}:`, error);
        toast({ title: "Hata", description: "Cevaplar yüklenemedi.", variant: "destructive" });
        setIsLoading(false);
      });
  
      return () => {
        unsubscribePost();
        unsubscribeReplies();
      };
    }, [postId, toast, refreshTrigger]);
  
    return { post, replies, comments, isLoading, forceRefresh };
}

async function deleteSubcollection(collectionPath: string) {
    const batch = writeBatch(db);
    const q = query(collection(db, collectionPath));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}


// Function to add a new post
export const addPost = async (postData: Omit<ForumPost, 'id' | 'date'>): Promise<string | null> => {
    try {
      const docRef = await addDoc(collection(db, 'forum'), {
        ...postData,
        date: new Date().toISOString(), // Use client-side ISO string
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding post:", error);
      return null;
    }
};

export const deletePost = async (postId: string) => {
    try {
        const batch = writeBatch(db);
        const postRef = doc(db, 'forum', postId);

        // Delete all replies and their sub-collections (comments)
        const repliesRef = collection(db, `forum/${postId}/replies`);
        const repliesSnapshot = await getDocs(repliesRef);
        for(const replyDoc of repliesSnapshot.docs) {
            // Delete comments subcollection for each reply
            await deleteSubcollection(`forum/${postId}/replies/${replyDoc.id}/comments`);
            // Delete the reply itself
            batch.delete(replyDoc.ref);
        }

        // Delete the main post
        batch.delete(postRef);

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error deleting post and its subcollections: ", error);
        return false;
    }
};

// Function to add a reply
export const addReply = async (postId: string, author: ForumAuthor, content: string) => {
    try {
        const result = await addReplyAction(postId, { author, content });
        if (!result.success) {
            throw new Error(result.error);
        }
        return true;
    } catch (error) {
        console.error("Error adding reply:", error);
        return false;
    }
};

export const deleteReply = async (postId: string, replyId: string) => {
    try {
        await deleteSubcollection(`forum/${postId}/replies/${replyId}/comments`);
        await deleteDoc(doc(db, `forum/${postId}/replies`, replyId));
        return true;
    } catch (error) {
        console.error("Error deleting reply: ", error);
        return false;
    }
}

// Function to add a comment to a reply using a subcollection
export const addCommentToReply = async (postId: string, replyId: string, author: ForumAuthor, content: string) => {
    const replyRef = doc(db, `forum/${postId}/replies`, replyId);
    const commentsColRef = collection(replyRef, 'comments');
    try {
        const newComment: Omit<ForumComment, 'id'> = {
            author,
            content,
            date: new Date().toISOString(),
        };
        const batch = writeBatch(db);
        
        // Add the new comment document
        const newCommentRef = doc(commentsColRef);
        batch.set(newCommentRef, newComment);

        // Increment the comment count on the parent reply
        batch.update(replyRef, {
            commentCount: increment(1)
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error adding comment to reply:", error);
        return false;
    }
};

export const deleteComment = async (postId: string, replyId: string, commentId: string) => {
    try {
        const batch = writeBatch(db);
        
        // Reference to the comment to be deleted
        const commentRef = doc(db, `forum/${postId}/replies/${replyId}/comments`, commentId);
        batch.delete(commentRef);
        
        // Reference to the parent reply to decrement commentCount
        const replyRef = doc(db, `forum/${postId}/replies`, replyId);
        batch.update(replyRef, {
            commentCount: increment(-1)
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error deleting comment:", error);
        return false;
    }
}


// Function to upvote/downvote a reply
export const toggleUpvote = async (postId: string, replyId: string, userId: string) => {
    const replyRef = doc(db, `forum/${postId}/replies`, replyId);
    try {
        const replySnap = await getDoc(replyRef);
        if(!replySnap.exists()) return;

        const upvotedBy = replySnap.data().upvotedBy || [];
        if(upvotedBy.includes(userId)){
            // User has upvoted, so remove upvote
            await updateDoc(replyRef, {
                upvotedBy: arrayRemove(userId)
            });
        } else {
            // User has not upvoted, so add upvote
            await updateDoc(replyRef, {
                upvotedBy: arrayUnion(userId)
            });
        }
    } catch (error) {
        console.error("Error toggling upvote:", error);
    }
}

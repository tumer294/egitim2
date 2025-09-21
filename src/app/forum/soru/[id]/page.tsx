
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/app-layout';
import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, User, Calendar, ThumbsUp, Send, Loader2, MessageSquare, Trash2, Bot, Sparkles, Copy } from 'lucide-react';
import type { ForumPost, ForumReply, ForumAuthor, ForumComment } from '@/lib/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useForumPost, addReply, toggleUpvote, addCommentToReply, deleteReply, deleteComment } from '@/hooks/use-forum';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { generateStandaloneAiAnswerAction } from '@/app/actions';

function ReplyCard({ reply, comments, user, post, profile, onCommentDeleted }: { reply: ForumReply, comments: ForumComment[], user: any, post: ForumPost, profile: any, onCommentDeleted: () => void }) {
    const { toast } = useToast();
    const [commentContent, setCommentContent] = React.useState('');
    const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
    
    const handleUpvote = async (replyId: string) => {
        if (!user || !post) return;
        await toggleUpvote(post.id, replyId, user.uid);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentContent.trim() || !user || !profile || !post) return;

        setIsSubmittingComment(true);
        const author: ForumAuthor = {
            uid: user.uid,
            name: profile.fullName,
            avatarUrl: profile.avatarUrl,
        };

        const success = await addCommentToReply(post.id, reply.id, author, commentContent);
        if (success) {
            setCommentContent('');
            toast({ title: 'Yorumunuz gönderildi!' });
        } else {
            toast({ title: 'Hata', description: 'Yorumunuz gönderilemedi.', variant: 'destructive' });
        }
        setIsSubmittingComment(false);
    };
    
    const handleDeleteReply = async () => {
        if(!post) return;
        const success = await deleteReply(post.id, reply.id);
        if (success) {
            toast({ title: 'Cevap Silindi', variant: 'destructive'});
        } else {
            toast({ title: 'Hata', description: 'Cevap silinemedi.', variant: 'destructive' });
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        if(!post) return;
        const success = await deleteComment(post.id, reply.id, commentId);
        if (success) {
            onCommentDeleted();
            toast({ title: 'Yorum Silindi', variant: 'destructive'});
        } else {
            toast({ title: 'Hata', description: 'Yorum silinemedi.', variant: 'destructive' });
        }
    }
    
    const canDeleteReply = profile?.role === 'admin' || reply.author.uid === user?.uid;
    const isAiReply = reply.author.uid === 'ai-assistant';
    
    return (
        <Card key={reply.id} className={cn("bg-muted/50", isAiReply && "border-primary/20 bg-primary/5")}>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar className='hidden sm:block mt-1'>
                        {isAiReply ? (
                             <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10">
                                <Bot className="h-5 w-5 text-primary" />
                             </div>
                        ) : (
                           <>
                            <AvatarImage src={reply.author.avatarUrl} data-ai-hint="teacher portrait" />
                            <AvatarFallback>{reply.author.name.charAt(0)}</AvatarFallback>
                           </>
                        )}
                    </Avatar>
                    <div className='flex-1'>
                        <div className="flex items-center justify-between">
                            <p className="font-semibold flex items-center gap-2">{reply.author.name} {isAiReply && <Badge variant="secondary">AI Asistan</Badge>}</p>
                            <div className='flex items-center gap-1'>
                                <p className="text-xs text-muted-foreground">{format(new Date(reply.date), 'dd.MM.yyyy HH:mm', { locale: tr })}</p>
                                {canDeleteReply && (
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant='ghost' size='icon' className='h-6 w-6 text-muted-foreground hover:text-destructive'>
                                                <Trash2 className='h-4 w-4'/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Cevabı Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
                                                <AlertDialogDescription>Bu işlem geri alınamaz. Bu cevap ve altındaki tüm yorumlar kalıcı olarak silinecektir.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteReply} className="bg-destructive hover:bg-destructive/90">Evet, Sil</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                        <p className="text-sm mt-2 whitespace-pre-wrap">{reply.content}</p>
                        <Collapsible>
                            <div className='mt-3 flex items-center gap-2'>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("flex items-center gap-2 text-muted-foreground", reply.upvotedBy.includes(user?.uid || '') && "text-primary")}
                                    onClick={() => handleUpvote(reply.id)}
                                    disabled={!user}
                                >
                                    <ThumbsUp className="h-4 w-4" />
                                    <span>{reply.upvotedBy.length > 0 ? reply.upvotedBy.length : ''}</span>
                                </Button>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{reply.commentCount > 0 ? reply.commentCount : ''}</span>
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="space-y-4 pt-4">
                                <div className="space-y-3">
                                    {comments?.map(comment => {
                                        const canDeleteComment = profile?.role === 'admin' || comment.author.uid === user?.uid;
                                        return (
                                        <div key={comment.id} className="group flex items-start gap-2 text-sm">
                                            <Avatar className='h-7 w-7'>
                                                <AvatarImage src={comment.author.avatarUrl} data-ai-hint="teacher portrait" />
                                                <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="bg-background rounded-lg px-3 py-2 flex-1 flex justify-between items-start">
                                                <div>
                                                    <span className="font-semibold">{comment.author.name}</span>
                                                    <p className="text-muted-foreground">{comment.content}</p>
                                                </div>
                                                 {canDeleteComment && (
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant='ghost' size='icon' className='h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive'>
                                                                <Trash2 className='h-3 w-3'/>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Yorumu Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
                                                                <AlertDialogDescription>Bu işlem geri alınamaz. Yorum kalıcı olarak silinecektir.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteComment(comment.id)} className="bg-destructive hover:bg-destructive/90">Evet, Sil</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                                <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                                    <Input
                                        placeholder="Yorum yaz..."
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        disabled={isSubmittingComment}
                                    />
                                    <Button type="submit" size="icon" disabled={!commentContent.trim() || isSubmittingComment}>
                                        {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                                    </Button>
                                </form>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function PostDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const { post, replies, comments, isLoading, forceRefresh } = useForumPost(postId);
  const { toast } = useToast();
  
  const [replyContent, setReplyContent] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAiAnswering, setIsAiAnswering] = React.useState(false);
  const [aiGeneratedAnswer, setAiGeneratedAnswer] = React.useState<string | null>(null);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user || !profile || !post) return;
    
    setIsSubmitting(true);
    const author: ForumAuthor = {
        uid: user.uid,
        name: profile.fullName,
        avatarUrl: profile.avatarUrl,
    };
    
    const success = await addReply(post.id, author, replyContent);
    if (success) {
        setReplyContent('');
        toast({ title: 'Cevabınız gönderildi!' });
    } else {
        toast({ title: 'Hata', description: 'Cevabınız gönderilemedi.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  }
  
  const handleDeletePost = async () => {
    if (!post) return;
    const success = await deleteReply(post.id, post.id); // This seems to be a bug, should be deletePost
    if(success) {
        toast({title: 'Gönderi Silindi', description: 'Gönderi ve tüm içeriği başarıyla silindi.', variant: 'destructive'});
        router.push('/forum');
    } else {
        toast({title: 'Hata', description: 'Gönderi silinirken bir hata oluştu.', variant: 'destructive'});
    }
  }

  const handleGenerateAiAnswer = async () => {
    if (!post) return;
    setIsAiAnswering(true);
    setAiGeneratedAnswer(null);
    const result = await generateStandaloneAiAnswerAction({ title: post.title, description: post.description });
    if (result.answer) {
        setAiGeneratedAnswer(result.answer);
    } else {
        toast({ title: 'Hata', description: result.error, variant: 'destructive' });
    }
    setIsAiAnswering(false);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Cevap Kopyalandı!", description: "Yapay zeka cevabını panoya kopyaladınız." });
  }

  if (isLoading) {
    return (
        <AppLayout>
             <main className="flex-1 p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </main>
        </AppLayout>
    );
  }

  if (!post) {
    return (
        <AppLayout>
             <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="text-center py-12">
                    <p className='text-lg font-medium'>Soru bulunamadı.</p>
                    <Link href="/forum">
                        <Button variant="link" className="mt-2">Foruma geri dön</Button>
                    </Link>
                </div>
            </main>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
         <div className='flex justify-between items-center'>
            <Link href="/forum" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Tüm Sorulara Geri Dön
            </Link>
            {profile?.role === 'admin' && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant='destructive'>
                            <Trash2 className='mr-2 h-4 w-4'/> Gönderiyi Sil
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Bu Gönderiyi Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>Bu işlem geri alınamaz. Bu gönderi, tüm cevapları ve yorumları ile birlikte kalıcı olarak silinecektir.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/90">Evet, Kalıcı Olarak Sil</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>

        <Card>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <Badge variant="default">{post.category}</Badge>
                </div>
                <CardTitle className="text-2xl md:text-3xl mt-2">{post.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-2">
                        <Avatar className='h-8 w-8'>
                            <AvatarImage src={post.author.avatarUrl} data-ai-hint="teacher portrait" />
                            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{post.author.name}</span>
                    </div>
                     <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{format(new Date(post.date), 'dd MMMM yyyy, HH:mm', { locale: tr })}</span>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{post.description}</p>
            </CardContent>
             {profile?.role === 'admin' && (
                <CardFooter>
                    <Button type="button" variant="outline" onClick={handleGenerateAiAnswer} disabled={isAiAnswering}>
                        {isAiAnswering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Yapay Zeka ile Cevapla
                    </Button>
                </CardFooter>
             )}
        </Card>

        {(isAiAnswering || aiGeneratedAnswer) && (
             <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="h-5 w-5 text-primary" />
                        EduBot AI Cevap Taslağı
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isAiAnswering ? (
                         <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        </div>
                    ) : (
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{aiGeneratedAnswer}</p>
                    )}
                </CardContent>
                {!isAiAnswering && aiGeneratedAnswer && (
                    <CardFooter>
                        <Button size="sm" onClick={() => copyToClipboard(aiGeneratedAnswer)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Cevabı Kopyala
                        </Button>
                    </CardFooter>
                )}
            </Card>
        )}

        <h3 className="text-2xl font-bold pt-4">{replies.length} Cevap</h3>
        <div className="space-y-4">
            {replies.sort((a,b) => b.upvotedBy.length - a.upvotedBy.length).map(reply => (
               <ReplyCard key={reply.id} reply={reply} comments={comments[reply.id] || []} user={user} post={post} profile={profile} onCommentDeleted={forceRefresh} />
            ))}
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Cevap Yaz</CardTitle>
            </CardHeader>
            <form onSubmit={handleReplySubmit}>
                <CardContent>
                    <Textarea 
                        placeholder="Değerli görüşlerinizi ve önerilerinizi buraya yazın..."
                        rows={5}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                    />
                </CardContent>
                <CardFooter className="flex-col sm:flex-row items-center justify-between gap-4">
                    <Button type="submit" disabled={!replyContent.trim() || isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Cevabı Gönder
                    </Button>
                </CardFooter>
            </form>
        </Card>

      </main>
    </AppLayout>
  );
}


export default function PostDetailPage() {
    return (
        <AuthGuard>
            <PostDetailPageContent />
        </AuthGuard>
    )
}

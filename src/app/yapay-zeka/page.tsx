
'use client';

import * as React from 'react';
import { Bot, Loader2, Send, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/components/app-layout';
import AuthGuard from '@/components/auth-guard';
import { useToast } from '@/hooks/use-toast';
import { assistantAction } from '@/app/actions';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useAssistantChat } from '@/hooks/use-assistant-chat';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


function YapayZekaPageContent() {
  const { user } = useAuth();
  const { messages, addMessage, clearChat, isLoading: isChatLoading } = useAssistantChat(user?.uid);
  const { toast } = useToast();
  
  const [input, setInput] = React.useState('');
  const [isResponding, setIsResponding] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isResponding) return;

    const userMessageContent = input;
    setInput('');
    
    // Add user message to Firestore
    await addMessage({ role: 'user', content: userMessageContent });
    
    // Create a temporary history for the AI action
    const currentHistory = [...messages, { id: 'temp', role: 'user', content: userMessageContent, timestamp: new Date().toISOString() }];

    setIsResponding(true);
    try {
      const result = await assistantAction({ history: currentHistory.map(({id, timestamp, ...rest}) => rest) });

      if (result.error) {
        toast({
          title: 'Hata',
          description: result.error,
          variant: 'destructive',
        });
        await addMessage({ role: 'model', content: 'Üzgünüm, bir hata oluştu.' });
      } else {
        await addMessage({ role: 'model', content: result.response });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Mesaj gönderilirken bir hata oluştu.',
        variant: 'destructive',
      });
      await addMessage({ role: 'model', content: 'Üzgünüm, bir hata oluştu.' });
    } finally {
      setIsResponding(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e as any);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChat();
      toast({
        title: 'Sohbet Temizlendi',
        description: 'Tüm konuşma geçmişi silindi.',
        variant: 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Sohbet geçmişi silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  }

  const isLoading = isChatLoading;

  return (
    <AppLayout>
      <main className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
                 <Bot className="h-6 w-6 text-primary" />
                 <h2 className="text-xl font-bold">EduBot Asistan</h2>
            </div>
            {messages.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sohbeti Temizle
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Sohbet Geçmişini Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>Bu işlem geri alınamaz. Tüm konuşmalar kalıcı olarak silinecektir.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearChat} className="bg-destructive hover:bg-destructive/90">Evet, Sil</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {isLoading ? (
             <div className="flex items-center justify-center h-full">
                 <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="mt-4 text-2xl font-bold">Nasıl Yardımcı Olabilirim?</h2>
              <p className="mt-2 text-muted-foreground">
                Ders planı fikirleri, sınıf yönetimi teknikleri veya herhangi bir konuda bana danışabilirsiniz.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-4',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'model' && (
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                     <Bot className="h-5 w-5" />
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-md rounded-xl p-3 shadow-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                     <User className="h-5 w-5" />
                  </Avatar>
                )}
              </div>
            ))
          )}
           {isResponding && (
              <div className="flex items-start gap-4 justify-start">
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                      <Bot className="h-5 w-5" />
                  </Avatar>
                  <div className="max-w-md rounded-xl p-3 shadow-sm bg-muted flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
              </div>
           )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t bg-background p-4">
          <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
            <Textarea
              placeholder="EduBot'a bir mesaj yazın..."
              className="min-h-[40px] w-full resize-none pr-16"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              disabled={isResponding || !input.trim()}
            >
              {isResponding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </main>
    </AppLayout>
  );
}

export default function YapayZekaPage() {
    return (
        <AuthGuard>
            <YapayZekaPageContent />
        </AuthGuard>
    )
}

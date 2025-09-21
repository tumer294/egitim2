
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/app-layout';
import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { addPost } from '@/hooks/use-forum';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { ForumAuthor } from '@/lib/types';

const categories = ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Eğitim Teknolojileri', 'Okul Öncesi', 'Rehberlik', 'Diğer'];

const formSchema = z.object({
  title: z.string().min(10, { message: 'Başlık en az 10 karakter olmalıdır.' }).max(150, { message: 'Başlık en fazla 150 karakter olabilir.' }),
  description: z.string().max(10000, { message: 'Açıklama en fazla 10000 karakter olabilir.' }).optional(),
  category: z.string({ required_error: 'Lütfen bir kategori seçin.' }),
});

function NewPostPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !profile) {
        toast({ title: 'Hata', description: 'Soru göndermek için giriş yapmalısınız.', variant: 'destructive'});
        return;
    }

    const author: ForumAuthor = {
        uid: user.uid,
        name: profile.fullName,
        avatarUrl: profile.avatarUrl,
    };
    
    const postData = { ...values, author };
    const newPostId = await addPost(postData);

    if (newPostId) {
        toast({
        title: 'Sorunuz Gönderildi!',
        description: 'Sorunuz foruma eklendi ve şimdi sizi gönderi sayfasına yönlendiriyoruz.',
        });
        router.push(`/forum/soru/${newPostId}`);
    } else {
        toast({
            title: 'Hata!',
            description: 'Sorunuz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
            variant: 'destructive',
        });
    }
  };

  return (
    <AppLayout>
      <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div>
            <Link href="/forum" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Foruma Geri Dön
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">Yeni Soru Sor</h2>
            <p className="text-muted-foreground mt-1">
                Meslektaşlarınızın yardımına veya fikrine ihtiyaç duyduğunuz konuyu paylaşın.
            </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent className="p-6 space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Soru Başlığı</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Kesirleri öğretirken kullanılabilecek interaktif materyaller nelerdir?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Kategori</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sorunuzun ilgili olduğu kategoriyi seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Açıklama (İsteğe Bağlı)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Sorunuzu daha detaylı açıklayabilirsiniz. Mevcut durumu, denediğiniz yöntemleri veya aradığınız çözümün özelliklerini belirtebilirsiniz." 
                          rows={8}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="border-t p-6">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                   {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Soruyu Gönder
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </main>
    </AppLayout>
  );
}

export default function NewPostPage() {
    return (
        <AuthGuard>
            <NewPostPageContent />
        </AuthGuard>
    )
}


'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

const formSchema = z.object({
  email: z.string().email({ message: 'Lütfen geçerli bir e-posta adresi girin.' }),
  password: z.string().min(1, { message: 'Şifre alanı boş bırakılamaz.' }),
});

const resetFormSchema = z.object({
    email: z.string().email({ message: 'Lütfen geçerli bir e-posta adresi girin.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { logIn, sendPasswordReset, error, loading, user } = useAuth();
  const [resetLoading, setResetLoading] = React.useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const resetForm = useForm<z.infer<typeof resetFormSchema>>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await logIn(values.email, values.password);
  };
  
  const handlePasswordReset = async (values: z.infer<typeof resetFormSchema>) => {
    setResetLoading(true);
    const success = await sendPasswordReset(values.email);
    if(success) {
        toast({
            title: 'E-posta Gönderildi',
            description: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.',
        });
        setIsResetDialogOpen(false);
        resetForm.reset();
    } else {
         toast({
            title: 'Hata',
            description: 'Şifre sıfırlama e-postası gönderilemedi. Lütfen e-posta adresini kontrol edin veya daha sonra tekrar deneyin.',
            variant: 'destructive',
        });
    }
    setResetLoading(false);
  }

  React.useEffect(() => {
    if (user) {
        toast({
            title: 'Giriş Başarılı!',
            description: 'Ana sayfaya yönlendiriliyorsunuz.',
        });
        router.push('/anasayfa');
    }
  }, [user, router, toast]);

  return (
    <>
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
            <div className='flex items-center justify-center gap-2 mb-4'>
                <GraduationCap className="h-8 w-8 text-primary" />
                <h1 className='text-2xl font-bold'>SınıfPlanım</h1>
            </div>
          <CardTitle className="text-2xl">Giriş Yap</CardTitle>
          <CardDescription>
            Devam etmek için e-posta ve şifrenizi girin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Giriş Hatası</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ornek@eposta.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Şifre</FormLabel>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setIsResetDialogOpen(true)}
                        className="ml-auto inline-block text-sm underline p-0 h-auto"
                      >
                        Şifrenizi mi unuttunuz?
                      </Button>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading || resetLoading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş Yapılıyor...
                  </>
                ) : (
                  'Giriş Yap'
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Hesabınız yok mu?{' '}
            <Link href="/kayit" className="underline">
              Kaydol
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Şifrenizi Sıfırlayın</DialogTitle>
                <DialogDescription>
                    Şifrenizi sıfırlamak için bir bağlantı almak üzere kayıtlı e-posta adresinizi girin.
                </DialogDescription>
            </DialogHeader>
            <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className='space-y-4 py-4'>
                    <FormField
                    control={resetForm.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>E-posta Adresi</FormLabel>
                        <FormControl>
                        <Input
                            type="email"
                            placeholder="ornek@eposta.com"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={resetLoading}>
                            İptal
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={resetLoading}>
                        {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sıfırlama Maili Gönder
                    </Button>
                </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
    </>
  );
}

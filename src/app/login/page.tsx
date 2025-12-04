
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
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  email: z.string().email({ message: 'Lütfen geçerli bir e-posta adresi girin.' }),
  password: z.string().min(1, { message: 'Şifre alanı boş bırakılamaz.' }),
});

const resetFormSchema = z.object({
    email: z.string().email({ message: 'Lütfen geçerli bir e-posta adresi girin.' }),
});

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.57,34.925,48,29.696,48,24C48,22.659,47.862,21.35,47.611,20.083z"></path>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { logIn, signInWithGoogle, sendPasswordReset, error, loading, user } = useAuth();
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
  
  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
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
    <div>
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-sky-200 via-orange-200 to-pink-300 p-4">
        <Card className="w-full max-w-sm bg-white/30 backdrop-blur-lg border-white/50 shadow-2xl">
          <CardHeader className="text-center text-white">
              <Link href="/" className='flex items-center justify-center gap-2 mb-4'>
                  <GraduationCap className="h-8 w-8 text-white" />
                  <h1 className='text-2xl font-bold'>SınıfPlanım</h1>
              </Link>
            <CardTitle className="text-2xl text-slate-800">Giriş Yap</CardTitle>
            <CardDescription className="text-slate-600">
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
                      <FormLabel className="text-slate-700">E-posta</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ornek@eposta.com"
                          className="bg-white/50"
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
                        <FormLabel className="text-slate-700">Şifre</FormLabel>
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => setIsResetDialogOpen(true)}
                          className="ml-auto inline-block text-sm underline p-0 h-auto text-pink-600 hover:text-pink-700"
                        >
                          Şifrenizi mi unuttunuz?
                        </Button>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="bg-white/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg" disabled={loading || resetLoading}>
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
             <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/30 px-2 text-slate-600">Veya</span>
                </div>
            </div>
            <Button variant="outline" className="w-full bg-white/50" onClick={handleGoogleSignIn} disabled={loading}>
              <GoogleIcon />
              Google ile Giriş Yap
            </Button>
            <Separator className="my-4" />
            <div className="text-center">
                <Link href="/ogrenci-giris" className="text-sm font-semibold text-slate-600 hover:text-pink-600">
                    Öğrenci misiniz? Buradan giriş yapın.
                </Link>
            </div>
            <div className="mt-4 text-center text-sm text-slate-600">
              Hesabınız yok mu?{' '}
              <Link href="/kayit" className="underline font-semibold text-pink-600 hover:text-pink-700">
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
    </div>
  );
}

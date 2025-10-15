
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

const formSchema = z.object({
  email: z.string().email({ message: 'Lütfen geçerli bir e-posta adresi girin.' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
});

export default function KayitPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signUp, error, loading, user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await signUp(values.email, values.password);
  };
  
  React.useEffect(() => {
    if (user) {
        toast({
            title: 'Kayıt Başarılı!',
            description: 'Ana sayfaya yönlendiriliyorsunuz.',
        });
        router.push('/anasayfa');
    }
  }, [user, router, toast]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-sky-200 via-orange-200 to-pink-300 p-4">
      <Card className="w-full max-w-sm bg-white/30 backdrop-blur-lg border-white/50 shadow-2xl">
        <CardHeader className="text-center text-white">
            <div className='flex items-center justify-center gap-2 mb-4'>
                <GraduationCap className="h-8 w-8 text-white" />
                <h1 className='text-2xl font-bold'>SınıfPlanım</h1>
            </div>
          <CardTitle className="text-2xl text-slate-800">Hesap Oluştur</CardTitle>
          <CardDescription className="text-slate-600">
            Devam etmek için bilgilerinizi girin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Kayıt Hatası</AlertTitle>
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
                    <FormLabel className="text-slate-700">Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="bg-white/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydolunuyor...
                  </>
                ) : (
                  'Kaydol'
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-slate-600">
            Zaten bir hesabınız var mı?{' '}
            <Link href="/login" className="underline font-semibold text-pink-600 hover:text-pink-700">
              Giriş Yap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
import { GraduationCap, Loader2, KeyRound, BookCopy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { studentLoginAction } from '@/app/actions/student-login';


const formSchema = z.object({
  classCode: z.string().min(1, { message: 'Sınıf kodu boş olamaz.' }),
  studentCode: z.string().min(1, { message: 'Öğrenci kodu boş olamaz.' }),
});


export default function OgrenciGirisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: teacherUser, logOut } = useAuth();
  
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classCode: '',
      studentCode: '',
    },
  });


  React.useEffect(() => {
    if (teacherUser) {
        logOut();
    }
  }, [teacherUser, logOut]);
  

 const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);

    const classCodeEntered = values.classCode.toUpperCase();
    const studentCodeEntered = values.studentCode.toUpperCase();

    try {
        const result = await studentLoginAction(classCodeEntered, studentCodeEntered);

        if (result.success && result.student && result.classId) {
             sessionStorage.setItem('studentAuth', JSON.stringify({ 
                studentId: result.student.id, 
                studentData: result.student, 
                classId: result.classId
            }));
            router.push(`/ogrenci/${result.student.id}`);
            toast({ title: 'Giriş Başarılı!', description: 'Öğrenci paneline yönlendiriliyorsunuz.' });
        } else {
            throw new Error(result.error || 'Giriş başarısız oldu.');
        }
        
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Bilinmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-green-200 via-blue-200 to-purple-300 p-4">
      <Card className="w-full max-w-md bg-white/30 backdrop-blur-lg border-white/50 shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className='flex items-center justify-center gap-2 mb-4'>
            <GraduationCap className="h-8 w-8 text-white" />
            <h1 className='text-2xl font-bold'>SınıfPlanım</h1>
          </Link>
          <CardTitle className="text-2xl text-slate-800">Öğrenci Girişi</CardTitle>
          <CardDescription className="text-slate-600">
            Öğretmeninin verdiği kodlar ile giriş yap.
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
                name="classCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Sınıf Kodu</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <BookCopy className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Sınıf Kodunu Gir"
                          className="bg-white/50 pl-10"
                           {...field}
                           onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studentCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Öğrenci Kodu (Şifre)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Öğrenci Kodunu Gir"
                          className="bg-white/50 pl-10"
                           {...field}
                           onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Giriş Yap'}
              </Button>
            </form>
          </Form>
          <Separator className="my-4" />
          <div className="text-center">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-pink-600">
                Öğretmen misiniz? Buradan giriş yapın.
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

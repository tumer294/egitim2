
'use client';

import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import DersProgrami from '@/components/ders-programi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, GraduationCap, Edit, ArrowRight, Loader2, Hourglass } from 'lucide-react';
import { format } from 'date-fns';
import React from 'react';
import { useAllRecords, useClassesAndStudents } from '@/hooks/use-daily-records';
import { useAuth } from '@/hooks/use-auth';
import AuthGuard from '@/components/auth-guard';
import { useUserProfile } from '@/hooks/use-user-profile';


function AnaSayfaPageContent() {
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const { classes, isLoading: isClassesLoading } = useClassesAndStudents(user?.uid);
  const { records, isLoading: isRecordsLoading } = useAllRecords(user?.uid);
  
  const [totalClasses, setTotalClasses] = React.useState(0);
  const [totalStudents, setTotalStudents] = React.useState(0);
  const [todaysRecords, setTodaysRecords] = React.useState(0);

  React.useEffect(() => {
    if (!isClassesLoading && classes) {
      setTotalClasses(classes.length);
      const studentCount = classes.reduce((acc, curr) => acc + curr.students.length, 0);
      setTotalStudents(studentCount);
    }
  }, [classes, isClassesLoading]);

  React.useEffect(() => {
    if (!isRecordsLoading && records) {
      const today = format(new Date(), 'yyyy-MM-dd');
      // Only count records for today that actually have events in them
      const todayRecordsCount = records.filter(r => r.date === today && r.events && r.events.length > 0).length;
      setTodaysRecords(todayRecordsCount);
    }
  }, [records, isRecordsLoading]);

  const isLoading = isClassesLoading || isRecordsLoading || isProfileLoading;

  if (isLoading) {
    return (
        <AppLayout>
            <main className="flex-1 p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </main>
        </AppLayout>
    )
  }

  if (profile?.role === 'beklemede') {
    return (
         <AppLayout>
            <main className="flex-1 p-4 md:p-8 pt-6">
                 <Card className="max-w-2xl mx-auto mt-10 text-center">
                    <CardHeader>
                        <Hourglass className="mx-auto h-12 w-12 text-primary" />
                        <CardTitle className="mt-4">Hesabınız Onay Bekliyor</CardTitle>
                        <CardDescription className='text-base'>
                            Hoş geldiniz! Platformumuzu kullanmaya başlamadan önce hesabınızın bir yönetici tarafından onaylanması gerekmektedir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Onay süreci tamamlandığında tüm özellikleri kullanabileceksiniz. Anlayışınız için teşekkür ederiz.
                        </p>
                    </CardContent>
                 </Card>
            </main>
        </AppLayout>
    )
  }

  return (
    <AppLayout>
       <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Hoş Geldiniz!</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Sınıf</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{totalClasses}</div>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Öğrenci</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{totalStudents}</div>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bugünkü Kayıtlar</CardTitle>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{todaysRecords}</div>}
                </CardContent>
            </Card>
             <Card className="col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                    <CardTitle className='text-base'>Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                   <Link href="/gunluk-takip">
                     <Button variant="outline" className="w-full justify-start">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Bugünkü Takibi Yap
                     </Button>
                   </Link>
                   <Link href="/raporlar">
                     <Button variant="outline" className="w-full justify-start">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Raporları Görüntüle
                     </Button>
                   </Link>
                </CardContent>
            </Card>
        </div>
        
        <DersProgrami />

      </main>
    </AppLayout>
  );
}

export default function AnaSayfaPage() {
    return (
        <AuthGuard>
            <AnaSayfaPageContent />
        </AuthGuard>
    )
}

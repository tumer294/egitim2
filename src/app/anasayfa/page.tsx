
'use client';

import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import DersProgrami from '@/components/ders-programi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, GraduationCap, Edit, ArrowRight, Loader2, Hourglass, ListChecks, MessageSquareText, ChevronDown } from 'lucide-react';
import React from 'react';
import { useClassesAndStudents, useAllRecords } from '@/hooks/use-daily-records';
import { useAuth } from '@/hooks/use-auth';
import AuthGuard from '@/components/auth-guard';
import { useUserProfile } from '@/hooks/use-user-profile';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { statusOptions, type DailyRecord, type Student, type ClassInfo } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from '@/components/ui/badge';


function GunlukOzet() {
    const { user } = useAuth();
    const { records, isLoading: isRecordsLoading } = useAllRecords(user?.uid);
    const { classes, isLoading: isClassesLoading } = useClassesAndStudents(user?.uid);
    const [isOpen, setIsOpen] = React.useState(false);

    const todaysRecords = React.useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return records.filter(r => r.date === todayStr);
    }, [records]);

    const studentMap = React.useMemo(() => {
        const map = new Map<string, Student>();
        classes.forEach(c => {
            c.students.forEach(s => {
                map.set(s.id, s);
            });
        });
        return map;
    }, [classes]);
    
    const classMap = React.useMemo(() => {
        const map = new Map<string, string>();
        classes.forEach(c => map.set(c.id, c.name));
        return map;
    }, [classes]);

    const groupedRecords = React.useMemo(() => {
        const groups: { [studentId: string]: DailyRecord[] } = {};
        todaysRecords.forEach(record => {
            if (record.classId) { // Ensure classId exists
                if (!groups[record.studentId]) {
                    groups[record.studentId] = [];
                }
                groups[record.studentId].push(record);
            }
        });
        return Object.values(groups).map(group => group[0]); // Just take the first record per student for summary
    }, [todaysRecords]);
    
    const isLoading = isRecordsLoading || isClassesLoading;

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bugün Değerlendirilen Öğrenci</CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{groupedRecords.length}</div>}
            </CardContent>
            {groupedRecords.length > 0 && (
                <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-auto">
                     <CollapsibleContent className="px-6 pb-4">
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {groupedRecords.map(record => {
                                    const student = studentMap.get(record.studentId);
                                    const className = record.classId ? classMap.get(record.classId) : 'Bilinmeyen Sınıf';
                                    if (!student) return null;

                                    const statusEvents = record.events.filter(e => e.type === 'status');
                                    const noteEvent = record.events.find(e => e.type === 'note');

                                    return (
                                        <div key={record.id} className="flex items-start gap-2 p-2 rounded-lg border bg-muted/20">
                                            <div className="flex-1">
                                                <p className="font-semibold text-xs">{student.firstName} {student.lastName}</p>
                                                <p className="text-xs text-muted-foreground">{className}</p>
                                                {noteEvent && (
                                                    <p className="text-xs italic text-muted-foreground mt-1 flex items-start gap-1.5">
                                                    <MessageSquareText className='h-3 w-3 mt-0.5 flex-shrink-0' /> <span>{String(noteEvent.value)}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {statusEvents.map(event => {
                                                    const option = statusOptions.find(o => o.value === event.value);
                                                    return option?.icon ? (
                                                        <div key={event.id} className={cn("h-5 w-5 rounded-full flex items-center justify-center", option.bgColor)}>
                                                            <option.icon className={cn("h-3 w-3", option.color)} />
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                    </CollapsibleContent>
                    <div className="border-t px-6 py-2">
                        <CollapsibleTrigger asChild>
                            <div className="flex justify-between items-center cursor-pointer text-xs text-muted-foreground">
                                <span>Detayları {isOpen ? 'Gizle' : 'Göster'}</span>
                                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                            </div>
                        </CollapsibleTrigger>
                    </div>
                 </Collapsible>
            )}
        </Card>
    );
}

function AnaSayfaPageContent() {
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const { classes, isLoading: isClassesLoading } = useClassesAndStudents(user?.uid);
  
  const [totalClasses, setTotalClasses] = React.useState(0);
  const [totalStudents, setTotalStudents] = React.useState(0);

  React.useEffect(() => {
    if (!isClassesLoading && classes) {
      setTotalClasses(classes.length);
      const studentCount = classes.reduce((acc, curr) => acc + curr.students.length, 0);
      setTotalStudents(studentCount);
    }
  }, [classes, isClassesLoading]);

  const isLoading = isClassesLoading || isProfileLoading;

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <div className='lg:col-span-1'>
                <GunlukOzet />
            </div>
             <Card className="col-span-1 lg:col-span-3">
                <CardHeader className="pb-2">
                    <CardTitle className='text-base'>Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                   <Link href="/gunluk-takip" className='flex-1'>
                     <Button variant="outline" className="w-full justify-start">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Bugünkü Takibi Yap
                     </Button>
                   </Link>
                   <Link href="/raporlar" className='flex-1'>
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


'use client';

import * as React from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, LogOut, Loader2, ListChecks, BrainCircuit, Briefcase, Shapes, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Student } from '@/lib/types';


export default function StudentDashboardPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const studentId = params.studentId as string;
    
    const [student, setStudent] = React.useState<Student | null>(null);
    const [classId, setClassId] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        setIsLoading(true);
        const authDataStr = sessionStorage.getItem('studentAuth');
        if (!authDataStr) {
            router.replace('/ogrenci-giris');
            return;
        }
        
        try {
            const authData = JSON.parse(authDataStr);
            if (authData.studentData.id !== studentId) {
                sessionStorage.removeItem('studentAuth');
                router.replace('/ogrenci-giris');
                return;
            }

            setStudent(authData.studentData);
            setClassId(authData.classId);
        } catch(error) {
            toast({ title: 'Oturum Hatası', description: 'Öğrenci oturum bilgileri okunamadı.', variant: 'destructive' });
            sessionStorage.removeItem('studentAuth');
            router.replace('/ogrenci-giris');
        } finally {
            setIsLoading(false);
        }

    }, [studentId, router, toast]);

    const handleLogout = () => {
        sessionStorage.removeItem('studentAuth');
        toast({ title: 'Çıkış Yapıldı' });
        router.push('/ogrenci-giris');
    };
    
    if (isLoading || !student || !classId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
                <Link href="#" className="flex items-center gap-2 font-semibold">
                    <GraduationCap className="h-6 w-6 text-primary" />
                    <span>Öğrenci Paneli</span>
                </Link>
                <div className='flex items-center gap-4'>
                    <span className='font-semibold'>{student.firstName} {student.lastName}</span>
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>
            <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <ListChecks className="h-8 w-8 text-primary"/>
                            Anketler
                        </h2>
                        <p className="text-muted-foreground">
                            Öğretmeninin senin için hazırladığı anketleri tamamla.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <div className='flex items-center gap-3'>
                                <BrainCircuit className="h-10 w-10 text-primary" />
                                <div>
                                    <CardTitle>Çoklu Zeka Kuramı Anketi</CardTitle>
                                    <CardDescription>Baskın zeka alanlarını keşfet.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter>
                            <Link href={`/anket/coklu-zeka-kurami?studentId=${student.id}&classId=${classId}`} className='w-full'>
                                <Button className='w-full'>
                                    Anketi Başlat <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div className='flex items-center gap-3'>
                                <Briefcase className="h-10 w-10 text-primary" />
                                <div>
                                    <CardTitle>Holland Meslek Envanteri</CardTitle>
                                    <CardDescription>Mesleki ilgi ve kişilik tiplerini belirle.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter>
                           <Link href={`/anket/holland-meslek-envanteri?studentId=${student.id}&classId=${classId}`} className='w-full'>
                                <Button className='w-full'>
                                    Envanteri Başlat <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                     <Card>
                        <CardHeader>
                            <div className='flex items-center gap-3'>
                                <Shapes className="h-10 w-10 text-primary" />
                                <div>
                                    <CardTitle>Öğrenme Stilleri Anketi</CardTitle>
                                    <CardDescription>Baskın öğrenme stilini belirle.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter>
                            <Link href={`/anket/ogrenme-stilleri?studentId=${student.id}&classId=${classId}`} className='w-full'>
                                <Button className='w-full'>
                                    Anketi Başlat <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}

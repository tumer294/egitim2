
'use client';

import * as React from 'react';
import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import AuthGuard from '@/components/auth-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Briefcase, ArrowRight, ClipboardEdit, Users, User, ListChecks, Shapes } from 'lucide-react';
import { useClassesAndStudents } from '@/hooks/use-daily-records';
import { useAuth } from '@/hooks/use-auth';
import type { Student } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

function AnketPageContent() {
  const { user } = useAuth();
  const { classes, isLoading } = useClassesAndStudents(user?.uid);
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [studentsInClass, setStudentsInClass] = React.useState<Student[]>([]);

  React.useEffect(() => {
    if (selectedClassId) {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      setStudentsInClass(selectedClass?.students || []);
      setSelectedStudent(null);
    } else {
      setStudentsInClass([]);
      setSelectedStudent(null);
    }
  }, [selectedClassId, classes]);

  const handleStudentSelect = (studentId: string) => {
      const student = studentsInClass.find(s => s.id === studentId);
      setSelectedStudent(student || null);
  }

  return (
    <AppLayout>
      <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <ListChecks className="h-8 w-8 text-primary"/>
                    Öğrenci Anketleri
                </h2>
                <p className="text-muted-foreground">
                    Öğrencilerinizin potansiyelini keşfetmek için standart pedagojik anketleri kullanın.
                </p>
            </div>
        </div>

        <Card className='max-w-2xl mx-auto'>
            <CardHeader>
                <CardTitle>Adım 1: Öğrenci Seçimi</CardTitle>
                <CardDescription>Anketi uygulamak istediğiniz öğrenciyi seçin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="class-select" className='flex items-center gap-2'><Users className='h-4 w-4'/>Sınıf</Label>
                    <Select onValueChange={setSelectedClassId} disabled={isLoading}>
                        <SelectTrigger id="class-select">
                            <SelectValue placeholder="Bir sınıf seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="student-select" className='flex items-center gap-2'><User className='h-4 w-4'/>Öğrenci</Label>
                    <Select onValueChange={handleStudentSelect} disabled={!selectedClassId || studentsInClass.length === 0}>
                        <SelectTrigger id="student-select">
                            <SelectValue placeholder={selectedClassId ? "Bir öğrenci seçin..." : "Önce sınıf seçin"} />
                        </SelectTrigger>
                        <SelectContent>
                            {studentsInClass.map(s => <SelectItem key={s.id} value={s.id}>{s.studentNumber} - {s.firstName} {s.lastName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        {selectedStudent && (
             <div className="mt-8">
                <h3 className='text-xl font-bold text-center mb-4'>Adım 2: Anket Seçimi</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <div className='flex items-center gap-3'>
                                <BrainCircuit className="h-10 w-10 text-primary" />
                                <div>
                                    <CardTitle>Çoklu Zeka Kuramı Anketi</CardTitle>
                                    <CardDescription>Öğrencilerin baskın zeka alanlarını keşfedin.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter>
                            <Link href={`/anket/coklu-zeka-kurami?studentId=${selectedStudent.id}&classId=${selectedClassId}`} className='w-full'>
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
                                    <CardDescription>Öğrencilerin mesleki ilgi ve kişilik tiplerini belirleyin.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter>
                            <Link href={`/anket/holland-meslek-envanteri?studentId=${selectedStudent.id}&classId=${selectedClassId}`} className='w-full'>
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
                                    <CardDescription>Öğrencinin baskın öğrenme stilini belirleyin.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter>
                            <Link href={`/anket/ogrenme-stilleri?studentId=${selectedStudent.id}&classId=${selectedClassId}`} className='w-full'>
                                <Button className='w-full'>
                                    Anketi Başlat <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        )}
      </main>
    </AppLayout>
  );
}

export default function AnketPage() {
    return (
        <AuthGuard>
            <AnketPageContent />
        </AuthGuard>
    )
}

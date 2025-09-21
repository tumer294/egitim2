
'use client';

import * as React from 'react';
import { Plus, Trash2, Pencil, Users, Loader2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import type { Student, ClassInfo } from '@/lib/types';
import { AddClassForm } from '@/components/add-class-form';
import { AddStudentForm } from '@/components/add-student-form';
import { EditStudentForm } from '@/components/edit-student-form';
import { ImportStudentsDialog } from '@/components/import-students-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useClassesAndStudents } from '@/hooks/use-daily-records';
import { EditClassForm } from '@/components/edit-class-form';
import { useAuth } from '@/hooks/use-auth';
import AuthGuard from '@/components/auth-guard';

function SiniflarimPageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { classes, addClass, addStudent, addMultipleStudents, updateStudent, deleteStudent, updateClass, deleteClass, isLoading, bulkAddClassesAndStudents } = useClassesAndStudents(user?.uid);
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);
  const [editingClass, setEditingClass] = React.useState<ClassInfo | null>(null);

  const sortedClasses = React.useMemo(() => {
    return [...classes].sort((a, b) => a.name.localeCompare(b.name));
  }, [classes]);

  const handleAddClass = async (className: string) => {
    if (!user?.uid) return;
    await addClass(user.uid, className);
  };
  
  const handleUpdateClass = async (classId: string, newName: string) => {
    if (!user?.uid) return;
    try {
        await updateClass(user.uid, classId, newName);
        toast({
            title: 'Başarılı!',
            description: 'Sınıf adı güncellendi.',
        });
        setEditingClass(null);
    } catch (error: any) {
        toast({ title: 'Hata', description: error.message, variant: 'destructive' });
    }
  };
  
  const handleDeleteClass = async (classId: string) => {
    if (!user?.uid) return;
    try {
        await deleteClass(user.uid, classId);
        toast({
          title: 'Sınıf Silindi',
          description: 'Sınıf ve içindeki tüm öğrenciler başarıyla silindi.',
          variant: 'destructive'
        });
    } catch (error: any) {
        toast({ title: 'Hata', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddStudent = async (classId: string, studentData: Omit<Student, 'id' | 'classId'>) => {
    if (!user?.uid) return;
    try {
        await addStudent(user.uid, classId, studentData);
         toast({
          title: 'Başarılı!',
          description: `Öğrenci "${studentData.firstName} ${studentData.lastName}" eklendi.`,
        });
    } catch (error: any) {
         toast({ title: 'Hata', description: error.message, variant: 'destructive'});
    }
  };
  
  const handleBulkAddStudents = async (classId: string, newStudents: Omit<Student, 'id' | 'classId'>[]) => {
    if (!user?.uid) return;
    try {
        await addMultipleStudents(user.uid, classId, newStudents);
        toast({
            title: "Öğrenciler Başarıyla Aktarıldı!",
            description: `${newStudents.length} öğrenci "${classes.find(c=>c.id === classId)?.name}" sınıfına eklendi.`
        })
    } catch (error: any) {
        toast({ title: 'Hata', description: error.message, variant: 'destructive'});
    }
  };
  
  const handleBulkImport = async (data: { className: string, students: Omit<Student, 'id'|'classId'>[] }[]) => {
    if (!user?.uid) return;
    try {
        const result = await bulkAddClassesAndStudents(user.uid, data);
        toast({
            title: 'Toplu Aktarım Başarılı!',
            description: `${result.classesAdded} yeni sınıf ve ${result.studentsAdded} yeni öğrenci eklendi. ${result.classesSkipped} sınıf ve ${result.studentsSkipped} öğrenci zaten mevcut olduğu için atlandı.`,
        });
    } catch (error: any) {
         toast({ title: 'Hata', description: error.message, variant: 'destructive'});
    }
  }

  const handleUpdateStudent = async (updatedStudent: Student) => {
    if (!user?.uid) return;
    try {
        await updateStudent(user.uid, updatedStudent.classId, updatedStudent);
        toast({
          title: 'Başarılı!',
          description: `Öğrenci "${updatedStudent.firstName} ${updatedStudent.lastName}" güncellendi.`,
        });
        setEditingStudent(null);
    } catch (error: any) {
        toast({ title: 'Hata', description: error.message, variant: 'destructive'});
    }
  };

  const handleStudentDelete = async (classId: string, studentId: string) => {
    if (!user?.uid) return;
    try {
        await deleteStudent(user.uid, classId, studentId);
        toast({
          title: 'Öğrenci Silindi',
          description: 'Öğrenci başarıyla listeden kaldırıldı.',
          variant: 'destructive'
        });
    } catch (error: any) {
         toast({ title: 'Hata', description: error.message, variant: 'destructive'});
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Sınıflarım</h2>
          <div className='flex items-center gap-2'>
            <AddClassForm onAddClass={handleAddClass} onBulkImport={handleBulkImport} existingClasses={classes} />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sortedClasses.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        {c.name}
                        <Button variant="ghost" size="icon" className='h-7 w-7' onClick={() => setEditingClass(c)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className='h-7 w-7'>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Sınıfı Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu işlem geri alınamaz. "{c.name}" sınıfını, içindeki tüm öğrencileri ve bu sınıfa ait tüm geçmiş kayıtları kalıcı olarak silecektir.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteClass(c.id)} className='bg-destructive hover:bg-destructive/90'>
                                        Evet, Sil
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardTitle>
                    <CardDescription>Sınıf Seviyesi: {c.name.split('/')[0]}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{c.students.length} Öğrenci</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Öğrenci Listesi</h4>
                  <div className="flex items-center gap-2">
                    <AddStudentForm classId={c.id} onAddStudent={handleAddStudent} existingStudents={c.students} />
                    <ImportStudentsDialog classId={c.id} onImport={handleBulkAddStudents} existingStudents={c.students} />
                  </div>
                </div>

                {c.students.length > 0 ? (
                  <div className="border rounded-md max-h-80 overflow-y-auto">
                    <ul className="divide-y divide-border">
                      {[...c.students].sort((a, b) => a.studentNumber - b.studentNumber).map(student => (
                          <li key={student.id} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-primary w-8 text-center">{student.studentNumber}</span>
                              <span className="font-medium">{student.firstName} {student.lastName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setEditingStudent({...student, classId: c.id})}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Bu işlem geri alınamaz. "{student.firstName} ${student.lastName}" adlı öğrenciyi kalıcı olarak silecektir.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleStudentDelete(c.id, student.id)} className='bg-destructive hover:bg-destructive/90'>
                                            Sil
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center p-6 text-muted-foreground border-2 border-dashed rounded-md">
                    <p>Bu sınıfa henüz öğrenci eklenmemiş.</p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <AddStudentForm classId={c.id} onAddStudent={handleAddStudent} isFirstStudent={true} existingStudents={[]} />
                        <ImportStudentsDialog classId={c.id} onImport={handleBulkAddStudents} isFirstImport={true} existingStudents={[]} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {editingStudent && (
          <EditStudentForm
            student={editingStudent}
            onUpdateStudent={handleUpdateStudent}
            onClose={() => setEditingStudent(null)}
            isOpen={!!editingStudent}
            existingStudents={classes.find(c => c.id === editingStudent.classId)?.students || []}
          />
        )}
        {editingClass && (
          <EditClassForm
            classInfo={editingClass}
            onUpdateClass={handleUpdateClass}
            onClose={() => setEditingClass(null)}
            isOpen={!!editingClass}
            existingClasses={classes}
          />
        )}
      </main>
    </AppLayout>
  );
}


export default function SiniflarimPage() {
  return (
    <AuthGuard>
      <SiniflarimPageContent />
    </AuthGuard>
  );
}

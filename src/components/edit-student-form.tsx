
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet';
import type { Student } from '@/lib/types';
import { useMediaQuery } from '@/hooks/use-media-query';

const formSchema = z.object({
  studentNumber: z.coerce.number().positive({ message: 'Okul numarası pozitif bir sayı olmalıdır.' }),
  firstName: z.string().min(2, { message: 'İsim en az 2 karakter olmalıdır.' }),
  lastName: z.string().min(2, { message: 'Soyisim en az 2 karakter olmalıdır.' }),
});

type EditStudentFormProps = {
  student: Student;
  onUpdateStudent: (student: Student) => void;
  onClose: () => void;
  isOpen: boolean;
  existingStudents: Pick<Student, 'id' | 'studentNumber'>[];
};

export function EditStudentForm({ student, onUpdateStudent, onClose, isOpen, existingStudents }: EditStudentFormProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const dynamicFormSchema = formSchema.refine(
    (data) => !existingStudents.some(s => s.id !== student.id && s.studentNumber === data.studentNumber),
    {
      message: 'Bu numaraya sahip bir öğrenci zaten mevcut.',
      path: ['studentNumber'],
    }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: {
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
    },
  });
  
  React.useEffect(() => {
    if(student){
        form.reset({
            studentNumber: student.studentNumber,
            firstName: student.firstName,
            lastName: student.lastName,
        })
    }
  }, [student, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    onUpdateStudent({
      ...student,
      ...values,
    });
  }

  const formContent = (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
            control={form.control}
            name="studentNumber"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Okul Numarası</FormLabel>
                <FormControl>
                <Input type="number" placeholder="Örn: 123" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Adı</FormLabel>
                <FormControl>
                <Input placeholder="Örn: Ahmet" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Soyadı</FormLabel>
                <FormControl>
                <Input placeholder="Örn: Yılmaz" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                    İptal
                </Button>
            </DialogClose>
            <Button type="submit">Değişiklikleri Kaydet</Button>
        </DialogFooter>
        </form>
    </Form>
  );

  if (isMobile) {
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="rounded-t-xl">
                 <SheetHeader>
                    <SheetTitle>Öğrenci Bilgilerini Düzenle</SheetTitle>
                    <SheetDescription>
                        Öğrencinin bilgilerini güncelleyin. Değişiklikleri kaydetmek için butona tıklayın.
                    </SheetDescription>
                </SheetHeader>
                {formContent}
            </SheetContent>
        </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Öğrenci Bilgilerini Düzenle</DialogTitle>
          <DialogDescription>
            Öğrencinin bilgilerini güncelleyin. Değişiklikleri kaydetmek için butona tıklayın.
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}

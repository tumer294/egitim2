
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/lib/types';

const formSchema = z.object({
  studentNumber: z.coerce.number().positive({ message: 'Okul numarası pozitif bir sayı olmalıdır.' }),
  firstName: z.string().min(2, { message: 'İsim en az 2 karakter olmalıdır.' }),
  lastName: z.string().min(2, { message: 'Soyisim en az 2 karakter olmalıdır.' }),
});

type AddStudentFormProps = {
  classId: string;
  onAddStudent: (classId: string, studentData: Omit<Student, 'id' | 'classId'>) => void;
  isFirstStudent?: boolean;
  existingStudents: Pick<Student, 'studentNumber'>[];
};

export function AddStudentForm({ onAddStudent, classId, isFirstStudent = false, existingStudents }: AddStudentFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  
  const dynamicFormSchema = formSchema.refine(
    (data) => !existingStudents.some(s => s.studentNumber === data.studentNumber),
    {
      message: 'Bu numaraya sahip bir öğrenci zaten mevcut.',
      path: ['studentNumber'],
    }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: {
      studentNumber: '' as any,
      firstName: '',
      lastName: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddStudent(classId, values);
    form.reset({ studentNumber: '' as any, firstName: '', lastName: '' });
    setOpen(false);
  }

  const triggerButton = isFirstStudent ? (
    <Button size="sm">
      <Plus className="h-4 w-4 mr-2" />
      İlk Öğrenciyi Ekle
    </Button>
  ) : (
    <Button variant="outline" size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Ekle
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Yeni Öğrenci Ekle</h4>
            <p className="text-sm text-muted-foreground">Eklenecek öğrencinin bilgilerini girin.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button type="submit" className="w-full">Öğrenciyi Ekle</Button>
            </form>
          </Form>
        </div>
      </PopoverContent>
    </Popover>
  );
}

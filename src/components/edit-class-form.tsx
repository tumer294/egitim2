
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
import type { ClassInfo } from '@/lib/types';

const formSchema = z.object({
  className: z.string().min(2, { message: 'Sınıf adı en az 2 karakter olmalıdır.' }),
});

type EditClassFormProps = {
  classInfo: ClassInfo;
  onUpdateClass: (classId: string, newName: string) => void;
  onClose: () => void;
  isOpen: boolean;
  existingClasses: ClassInfo[];
};

export function EditClassForm({ classInfo, onUpdateClass, onClose, isOpen, existingClasses }: EditClassFormProps) {
  
  const dynamicFormSchema = formSchema.refine(
    (data) => !existingClasses.some(c => c.id !== classInfo.id && c.name.toLowerCase() === data.className.toLowerCase()),
    {
      message: 'Bu isimde bir sınıf zaten mevcut.',
      path: ['className'],
    }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: {
      className: classInfo.name,
    },
  });
  
  React.useEffect(() => {
    if(classInfo){
        form.reset({
            className: classInfo.name,
        })
    }
  }, [classInfo, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    onUpdateClass(classInfo.id, values.className);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sınıf Adını Düzenle</DialogTitle>
          <DialogDescription>
            Sınıfın adını güncelleyin ve değişiklikleri kaydedin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="className"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sınıf Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: 8/C" {...field} />
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
      </DialogContent>
    </Dialog>
  );
}

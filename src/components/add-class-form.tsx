
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { ClassInfo, Student } from '@/lib/types';
import { ImportClassesAndStudentsDialog } from './import-classes-and-students-dialog';

const formSchema = z.object({
  className: z.string().min(2, { message: 'Sınıf adı en az 2 karakter olmalıdır.' }),
});

type AddClassFormProps = {
  onAddClass: (className: string) => Promise<void>;
  onBulkImport: (data: { className: string, students: Omit<Student, 'id'|'classId'>[] }[]) => void;
  existingClasses: ClassInfo[];
};

export function AddClassForm({ onAddClass, onBulkImport, existingClasses }: AddClassFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const dynamicFormSchema = formSchema.refine(
    (data) => !existingClasses.some(c => c.name.toLowerCase() === data.className.toLowerCase()),
    {
      message: 'Bu isimde bir sınıf zaten mevcut.',
      path: ['className'],
    }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: {
      className: '',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
        await onAddClass(values.className);
        toast({
          title: 'Başarılı!',
          description: `"${values.className}" sınıfı eklendi.`,
        });
        form.reset();
        setOpen(false);
    } catch (error: any) {
        console.error("Failed to add class:", error);
        toast({
          title: 'Hata!',
          description: error.message || 'Sınıf eklenirken bir sorun oluştu. Firestore kurallarınızı veya bağlantınızı kontrol edin.',
          variant: 'destructive',
        });
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Sınıf Ekle
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Yeni Sınıf Oluştur</h4>
            <p className="text-sm text-muted-foreground">Oluşturmak istediğiniz sınıfın adını girin.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ekleniyor...
                  </>
                ) : (
                  'Sınıfı Ekle'
                )}
              </Button>
            </form>
          </Form>
          
          <div className="relative my-2">
            <Separator />
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-popover px-2 text-muted-foreground">
                Veya
              </span>
            </div>
          </div>
          
           <ImportClassesAndStudentsDialog onImport={onBulkImport} />

        </div>
      </PopoverContent>
    </Popover>
  );
}

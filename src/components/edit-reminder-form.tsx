
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon as CalendarIconLucide } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Reminder } from '@/lib/types';

const formSchema = z.object({
    title: z.string().min(1, { message: 'Başlık boş olamaz.' }),
    dueDate: z.date({ required_error: 'Lütfen bir tarih seçin.' }),
    time: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type EditReminderFormProps = {
  reminder: Reminder;
  onUpdate: (reminderId: string, data: Partial<Omit<Reminder, 'id' | 'createdAt' | 'isCompleted'>>) => void;
  onClose: () => void;
  isOpen: boolean;
};

export function EditReminderForm({ reminder, onUpdate, onClose, isOpen }: EditReminderFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: reminder.title,
        dueDate: parseISO(reminder.dueDate),
        time: reminder.time || '',
    },
  });

  React.useEffect(() => {
    if (reminder) {
        form.reset({
            title: reminder.title,
            dueDate: parseISO(reminder.dueDate),
            time: reminder.time || '',
        });
    }
  }, [reminder, form]);

  function onSubmit(values: FormValues) {
    const reminderData = {
        title: values.title,
        dueDate: format(values.dueDate, 'yyyy-MM-dd'),
        time: values.time,
    };
    onUpdate(reminder.id, reminderData);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hatırlatıcıyı Düzenle</DialogTitle>
          <DialogDescription>
            Hatırlatıcının bilgilerini güncelleyin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Başlık</FormLabel>
                            <FormControl>
                                <Input placeholder="Örn: Veli toplantısı hazırla" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className='flex flex-col'>
                                <FormLabel>Tarih</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP", { locale: tr })
                                                ) : (
                                                    <span>Tarih seçin</span>
                                                )}
                                                <CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                            initialFocus
                                            locale={tr}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                        <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Saat (İsteğe Bağlı)</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">İptal</Button>
                    </DialogClose>
                    <Button type="submit">Değişiklikleri Kaydet</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Sparkles, CalendarClock, CheckCircle, Clock } from 'lucide-react';
import type { Reminder, Urgency } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format, isPast } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { CalendarIcon } from 'lucide-react';

type SmartReminderPopupProps = {
  reminder: Reminder | null;
  onClose: () => void;
  onUpdate: (reminderId: string, data: Partial<Reminder>) => Promise<void>;
  onMarkAsComplete: (reminderId: string, isCompleted: boolean) => Promise<void>;
};

const formSchema = z.object({
    dueDate: z.date({ required_error: 'Lütfen bir tarih seçin.' }),
    time: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SmartReminderPopup({ reminder, onClose, onUpdate, onMarkAsComplete }: SmartReminderPopupProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showReschedule, setShowReschedule] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        dueDate: reminder?.dueDate ? new Date(reminder.dueDate) : new Date(),
        time: reminder?.time,
    },
  });
  
  React.useEffect(() => {
    if (reminder) {
        form.reset({
            dueDate: new Date(reminder.dueDate),
            time: reminder.time,
        });
    }
    setShowReschedule(false); // Reset view on new reminder
  }, [reminder, form]);

  if (!reminder) {
    return null;
  }
  
  const handleUpdate = async (values: FormValues) => {
    setIsUpdating(true);
    const updatedData = {
        dueDate: format(values.dueDate, 'yyyy-MM-dd'),
        time: values.time,
    };
    await onUpdate(reminder.id, updatedData);
    setIsUpdating(false);
    onClose();
  };

  const handleMarkAsComplete = async () => {
    setIsUpdating(true);
    await onMarkAsComplete(reminder.id, true);
    setIsUpdating(false);
    onClose();
  };
  
  const isOverdue = isPast(new Date(reminder.dueDate + (reminder.time ? `T${reminder.time}` : 'T23:59:59')));

  return (
    <Dialog open={!!reminder} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
            <div className='flex items-center justify-center mb-4'>
                 <div className="p-3 bg-destructive/10 rounded-full text-destructive">
                    <CalendarClock className="h-8 w-8" />
                 </div>
            </div>
          <DialogTitle className="text-center">Vadesi Geçti!</DialogTitle>
          <DialogDescription className="text-center pt-2">
            "{reminder.title}" başlıklı hatırlatıcınızın zamanı geçti. Şimdi ne yapmak istersiniz?
          </DialogDescription>
        </DialogHeader>

        {showReschedule ? (
             <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4 py-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className='flex flex-col'>
                                    <FormLabel>Yeni Tarih</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                                                >
                                                    {field.value ? (format(field.value, "PPP", { locale: tr })) : (<span>Tarih seçin</span>)}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                                    <FormLabel>Yeni Saat (İsteğe Bağlı)</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                     <DialogFooter className="!mt-6">
                        <Button type="button" variant="ghost" onClick={() => setShowReschedule(false)} disabled={isUpdating}>Geri</Button>
                        <Button type="submit" disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yeniden Planla
                        </Button>
                     </DialogFooter>
                </form>
             </Form>
        ) : (
            <DialogFooter className="sm:justify-center gap-2 pt-4">
                 {isOverdue && (
                     <Button type="button" variant="secondary" onClick={() => setShowReschedule(true)} disabled={isUpdating}>
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Yeniden Planla
                    </Button>
                 )}
                <Button type="button" onClick={handleMarkAsComplete} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Tamamlandı Olarak İşaretle
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

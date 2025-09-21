
'use client';

import * as React from 'react';
import AppLayout from '@/components/app-layout';
import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Bell, Trash2, CalendarIcon as CalendarIconLucide, Loader2, Pencil } from 'lucide-react';
import { useReminders } from '@/hooks/use-reminders';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isPast, parseISO, differenceInHours } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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
import { EditReminderForm } from '@/components/edit-reminder-form';
import type { Reminder, Urgency } from '@/lib/types';


const formSchema = z.object({
    title: z.string().min(1, { message: 'Başlık boş olamaz.' }),
    dueDate: z.date({ required_error: 'Lütfen bir tarih seçin.' }),
    time: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function HatirlaticilarPageContent() {
    const { user } = useAuth();
    const { reminders, isLoading, addReminder, updateReminder, deleteReminder } = useReminders(user?.uid);
    const { toast } = useToast();
    const [editingReminder, setEditingReminder] = React.useState<Reminder | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            dueDate: undefined,
            time: '',
        },
    });


    const onSubmit = async (values: FormValues) => {
        const reminderData = {
            title: values.title,
            dueDate: format(values.dueDate, 'yyyy-MM-dd'),
            time: values.time,
        };
        await addReminder(reminderData);
        form.reset();
        toast({ title: 'Hatırlatıcı Eklendi!' });
    };
    
    const handleToggleComplete = async (reminderId: string, isCompleted: boolean) => {
        await updateReminder(reminderId, { isCompleted });
    };

    const handleUpdateReminder = async (reminderId: string, data: Partial<Omit<Reminder, 'id' | 'createdAt' | 'isCompleted'>>) => {
        await updateReminder(reminderId, data);
        toast({ title: 'Hatırlatıcı Güncellendi!' });
    }

    const sortedReminders = React.useMemo(() => {
        return [...reminders].sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) {
              return a.isCompleted ? 1 : -1;
            }
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            return dateA.getTime() - dateB.getTime();
          });
    }, [reminders]);

    const upcomingReminders = sortedReminders.filter(r => !r.isCompleted);
    const completedReminders = sortedReminders.filter(r => r.isCompleted);
    
    const getUrgency = (reminder: Reminder): Urgency => {
        const now = new Date();
        const dueDate = new Date(reminder.dueDate);
        if (reminder.time) {
            const [hours, minutes] = reminder.time.split(':');
            dueDate.setHours(parseInt(hours), parseInt(minutes));
        } else {
            dueDate.setHours(23, 59, 59, 999); // End of day if no time
        }

        if (isPast(dueDate)) return 'pastDue';
        
        const hoursUntilDue = differenceInHours(dueDate, now);
        
        if (hoursUntilDue < 24) return 'veryUrgent';
        if (hoursUntilDue < 48) return 'urgent';
        if (hoursUntilDue < 72) return 'info';
        
        return 'none';
    };

    const urgencyStyles: Record<Urgency, string> = {
        pastDue: 'border-destructive/50 bg-destructive/5',
        veryUrgent: 'border-destructive/50 bg-destructive/5',
        urgent: 'border-orange-500/50 bg-orange-500/5',
        info: 'border-yellow-400/50 bg-yellow-400/5',
        none: 'bg-card'
    };
    
    const urgencyTextStyles: Record<Urgency, string> = {
        pastDue: 'text-destructive font-semibold',
        veryUrgent: 'text-destructive font-semibold',
        urgent: 'text-orange-500 font-semibold',
        info: 'text-yellow-500',
        none: ''
    };

    return (
        <AppLayout>
            <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Bell className="h-8 w-8 text-primary" />
                        Hatırlatıcılar
                    </h2>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Yeni Hatırlatıcı Ekle</CardTitle>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-4">
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
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Plus className="mr-2 h-4 w-4" />}
                                    Ekle
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Aktif Hatırlatıcılar ({upcomingReminders.length})</h3>
                            <div className="space-y-3">
                                {upcomingReminders.length > 0 ? (
                                    upcomingReminders.map(reminder => {
                                        const urgency = getUrgency(reminder);
                                        return (
                                            <div key={reminder.id} className={cn("flex items-center space-x-4 p-4 rounded-lg border", urgencyStyles[urgency])}>
                                                <Checkbox
                                                    id={`reminder-${reminder.id}`}
                                                    checked={reminder.isCompleted}
                                                    onCheckedChange={(checked) => handleToggleComplete(reminder.id, !!checked)}
                                                />
                                                <div className="flex-1">
                                                    <label htmlFor={`reminder-${reminder.id}`} className="font-medium cursor-pointer">{reminder.title}</label>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                        <CalendarIconLucide className={cn("h-4 w-4", urgencyTextStyles[urgency])} />
                                                        <span className={cn(urgencyTextStyles[urgency])}>
                                                            {format(parseISO(reminder.dueDate), 'dd MMMM yyyy', { locale: tr })}
                                                            {reminder.time && `, ${reminder.time}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => setEditingReminder(reminder)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                            <AlertDialogDescription>Bu hatırlatıcı kalıcı olarak silinecektir. Bu işlem geri alınamaz.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteReminder(reminder.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">Aktif hatırlatıcınız bulunmuyor.</p>
                                )}
                            </div>
                        </div>

                        {completedReminders.length > 0 && (
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Tamamlananlar ({completedReminders.length})</h3>
                                <div className="space-y-3">
                                {completedReminders.map(reminder => (
                                    <div key={reminder.id} className="flex items-center space-x-4 p-4 rounded-lg bg-card border opacity-60">
                                        <Checkbox
                                            id={`reminder-${reminder.id}`}
                                            checked={reminder.isCompleted}
                                            onCheckedChange={(checked) => handleToggleComplete(reminder.id, !!checked)}
                                        />
                                        <div className="flex-1">
                                            <label htmlFor={`reminder-${reminder.id}`} className="font-medium line-through cursor-pointer">{reminder.title}</label>
                                        </div>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                    <AlertDialogDescription>Bu hatırlatıcı kalıcı olarak silinecektir. Bu işlem geri alınamaz.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteReminder(reminder.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {editingReminder && (
                <EditReminderForm 
                    isOpen={!!editingReminder}
                    onClose={() => setEditingReminder(null)}
                    reminder={editingReminder}
                    onUpdate={handleUpdateReminder}
                />
            )}
        </AppLayout>
    );
}

export default function HatirlaticilarPage() {
    return (
        <AuthGuard>
            <HatirlaticilarPageContent />
        </AuthGuard>
    )
}

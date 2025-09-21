
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
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
import { Day, Lesson, Plan } from '@/lib/types';
import { BookOpen, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import stringToColor from 'string-to-color';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

const gradeLevels = ["1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf", "5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf", "Okul Öncesi"];

const formSchema = z.object({
  subject: z.string().min(2, { message: 'Ders adı en az 2 karakter olmalıdır.' }),
  class: z.string().min(1, { message: 'Sınıf şubesi en az 1 karakter olmalıdır.' }),
  grade: z.string({ required_error: 'Lütfen bir sınıf seviyesi seçin.' }),
  planId: z.string().optional(),
});

type AddLessonFormProps = {
  isOpen: boolean;
  onClose: () => void;
  day: Day;
  lessonSlot: number;
  lesson: Lesson | null;
  onSave: (day: Day, lessonData: Omit<Lesson, 'id'|'lessonSlot'> | null, lessonSlot: number) => void;
  onClear: (day: Day, lessonSlot: number) => void;
  timeSlot: string;
  relatedPlan: Plan | null;
  onViewPlan: (plan: Plan) => void;
  availablePlans: Plan[];
  availableLessons: Omit<Lesson, 'id' | 'lessonSlot' | 'time'>[];
};

export function AddLessonForm({ isOpen, onClose, day, lessonSlot, lesson, onSave, onClear, timeSlot, relatedPlan, onViewPlan, availablePlans, availableLessons }: AddLessonFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: lesson?.subject || '',
      class: lesson?.class || '',
      grade: lesson?.grade || '',
      planId: lesson?.planId || 'no-plan',
    },
  });
  
  React.useEffect(() => {
    if(isOpen) {
        form.reset({
          subject: lesson?.subject || '',
          class: lesson?.class || '',
          grade: lesson?.grade || '',
          planId: lesson?.planId || 'no-plan',
        })
    }
  }, [lesson, form, isOpen]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const lessonData: Omit<Lesson, 'id'|'lessonSlot'|'time'> = {
      ...values,
      planId: values.planId === 'no-plan' ? undefined : values.planId,
    };
    onSave(day, lessonData, lessonSlot);
    onClose();
  }
  
  const handleQuickAdd = (l: Omit<Lesson, 'id' | 'lessonSlot' | 'time'>) => {
    form.reset({
        subject: l.subject,
        class: l.class,
        grade: l.grade,
        planId: l.planId || 'no-plan',
    });
  }

  const selectedGrade = form.watch('grade');
  const filteredPlans = availablePlans.filter(p => !selectedGrade || p.grade === selectedGrade);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>{lesson?.subject ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}</DialogTitle>
          <DialogDescription>
            {day} günü, {timeSlot} saati için bilgileri girin.
          </DialogDescription>
        </DialogHeader>
        
        {!lesson && availableLessons.length > 0 && (
            <>
                <div className='py-2'>
                    <h4 className='text-sm font-medium mb-2 text-center'>Hızlı Ekle</h4>
                    <div className='flex flex-wrap items-center justify-center gap-2'>
                        {availableLessons.map((l, i) => (
                            <Button 
                                key={i}
                                type="button"
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleQuickAdd(l)}
                                className='h-auto py-1 px-2 text-xs'
                            >
                                <div className='h-2 w-2 rounded-full mr-2' style={{backgroundColor: stringToColor(l.subject)}}></div>
                                {l.grade} - {l.class} {l.subject}
                            </Button>
                        ))}
                    </div>
                </div>
                <Separator/>
            </>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-w-xs mx-auto space-y-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ders Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: Matematik" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sınıf Seviyesi</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seviye seçin..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gradeLevels.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şube</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="planId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlgili Yıllık Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'no-plan'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Bir plan seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-plan">Plan Yok</SelectItem>
                          {filteredPlans.map(plan => (
                            <SelectItem key={plan.id} value={plan.id}>{plan.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                       <FormDescription>
                          Dersin sınıf seviyesini seçmek, ilgili planları listeler.
                       </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className='sm:justify-between pt-4'>
                <div className='flex items-center gap-2'>
                    {lesson && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive">
                                    <Trash2 className='mr-2 h-4 w-4' /> Dersi Temizle
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu işlem geri alınamaz. Bu ders programdan kalıcı olarak kaldırılacaktır.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => { onClear(day, lessonSlot); onClose(); }} className='bg-destructive hover:bg-destructive/90'>
                                        Evet, Sil
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {relatedPlan && (
                       <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button type='button' variant='outline' size="icon" onClick={() => onViewPlan(relatedPlan)}>
                                      <BookOpen className='h-4 w-4' />
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>Yıllık Planı Gör</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                    )}
                </div>
                <div className='flex items-center gap-2 mt-2 sm:mt-0'>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">İptal</Button>
                    </DialogClose>
                    <Button type="submit">Dersi Kaydet</Button>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

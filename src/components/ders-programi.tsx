

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Calendar, Settings, BookOpen, Trash2, Clock, BrainCircuit } from 'lucide-react';
import type { Lesson, Day, WeeklyScheduleItem, ScheduleSettings, Plan, LessonPlanEntry } from '@/lib/types';
import { useWeeklySchedule } from '@/hooks/use-weekly-schedule';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AddLessonForm } from './add-lesson-form';
import stringToColor from 'string-to-color';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn, getAcademicWeek } from '@/lib/utils';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Plus } from 'lucide-react';
import { usePlans } from '@/hooks/use-plans';
import { PlanViewer } from './plan-viewer';
import * as XLSX from 'xlsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const dayOrder: Day[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const dayShort: { [key in Day]: string } = {
    'Pazartesi': 'Pzt',
    'Salı': 'Sal',
    'Çarşamba': 'Çar',
    'Perşembe': 'Per',
    'Cuma': 'Cum',
    'Cumartesi': 'Cmt',
    'Pazar': 'Paz',
};

const dayColors: { [key in Day]: string } = {
    Pazartesi: "hsl(0, 72%, 61%)", // #ef4444 - red
    Salı: "hsl(25, 95%, 53%)", // #f97316 - orange
    Çarşamba: "hsl(48, 96%, 53%)", // #eab308 - yellow
    Perşembe: "hsl(142, 64%, 44%)", // #22c55e - green
    Cuma: "hsl(221, 83%, 53%)", // #3b82f6 - blue
    Cumartesi: "hsl(262, 70%, 57%)", // #8b5cf6 - violet
    Pazar: "hsl(322, 76%, 57%)", // #ec4899 - pink
};


const calculateEndTime = (startTime: string, duration: number): string => {
    if (!startTime || !duration) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
};

export default function DersProgrami() {
  const { user } = useAuth();
  const { schedule, isLoading, updateLesson, updateSettings, settings } = useWeeklySchedule(user?.uid);
  const { plans, isLoading: isLoadingPlans } = usePlans(user?.uid);
  const { toast } = useToast();
  
  const [editingLesson, setEditingLesson] = React.useState<{ day: Day, lessonSlot: number, lesson: Lesson | null } | null>(null);
  const [localSettings, setLocalSettings] = React.useState<ScheduleSettings>(settings);
  const [selectedDay, setSelectedDay] = React.useState<Day>('Pazartesi');

  const [viewingPlanContent, setViewingPlanContent] = React.useState<LessonPlanEntry[] | null>(null);
  const [viewingPlanTitle, setViewingPlanTitle] = React.useState<string>('');
  const [startWeekForPlan, setStartWeekForPlan] = React.useState<number>(1);


  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  React.useEffect(() => {
    const todayIndex = new Date().getDay(); // Sunday: 0, Monday: 1, ..., Saturday: 6
    // Adjust index to match our dayOrder array (Monday: 0, etc.)
    const adjustedIndex = todayIndex === 0 ? 6 : todayIndex - 1;

    if (adjustedIndex >= 0 && adjustedIndex < dayOrder.length) {
        setSelectedDay(dayOrder[adjustedIndex]);
    }
  }, []);

  const openEditLessonModal = (day: Day, lessonSlot: number, lesson: Lesson | null) => {
    setEditingLesson({ day, lessonSlot, lesson });
  };
  
    const dataURIToBlob = (dataURI: string): Blob | null => {
        try {
            const splitDataURI = dataURI.split(',');
            const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1]);
            const mimeString = splitDataURI[0].split(':')[1].split(';')[0];

            const ia = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++)
                ia[i] = byteString.charCodeAt(i);

            return new Blob([ia], { type: mimeString });
        } catch (error) {
            console.error("Error converting Data URI to Blob:", error);
            return null;
        }
    }

  const viewFile = async (plan: Plan, week: number) => {
    setViewingPlanTitle(plan.title);
    
    const blob = dataURIToBlob(plan.fileDataUrl);
    if (!blob) {
        toast({ title: 'Hata', description: 'Dosya verisi okunamadı.', variant: 'destructive' });
        return;
    }

    if (plan.fileType.includes('sheet') || plan.fileType.includes('excel')) {
        try {
            const data = await blob.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json<any>(worksheet, {
                header: ['month', 'week', 'hours', 'unit', 'topic', 'objective', 'objectiveExplanation', 'methods', 'assessment', 'specialDays', 'extracurricular']
            });
            const startIndex = json.findIndex(row => row.week && (row.week.toString().includes('Hafta') || /\d/.test(row.week.toString())));
            const planEntries = json.slice(startIndex >= 0 ? startIndex : 0).map((row, index) => ({
                id: `${plan.id}-${index}`,
                ...row
            } as LessonPlanEntry));
            
            setStartWeekForPlan(week);
            setViewingPlanContent(planEntries);
        } catch(e) {
             console.error("Error parsing excel file: ", e);
             toast({ title: 'Hata', description: 'Excel dosyası işlenirken bir hata oluştu.', variant: 'destructive' });
             setViewingPlanTitle('');
        }

    } else {
      // For other file types like PDF/Word, just show a message or download. For now, modal won't open.
      toast({ title: 'Plan Görüntülenemiyor', description: 'Bu plan türü için uygulama içi görüntüleyici mevcut değil. Planlarim sayfasından indirebilirsiniz.' });
    }
  };

  const closeViewer = () => {
    setViewingPlanContent(null);
    setViewingPlanTitle('');
  }

  const handleLessonSave = async (day: Day, lessonData: Omit<Lesson, 'id'|'lessonSlot'> | null, lessonSlot: number) => {
    if (!user) return;
    
    // Pass the full data object from the form to the update function
    await updateLesson(day, lessonData, lessonSlot);

    if (lessonData) {
        toast({ title: "Ders Kaydedildi!", description: `${lessonData.subject} dersi programa eklendi.` });
    }
    setEditingLesson(null);
  };
  
  const handleClearLesson = async (day: Day, lessonSlot: number) => {
     if (!user) return;
     await updateLesson(day, null, lessonSlot);
     toast({ title: "Ders Temizlendi!", variant: 'destructive' });
     setEditingLesson(null);
  }

  const handleSettingsChange = (field: keyof ScheduleSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const handleTimeSlotChange = (index: number, value: string) => {
      const newTimeSlots = [...localSettings.timeSlots];
      newTimeSlots[index] = value;
      setLocalSettings(prev => ({ ...prev, timeSlots: newTimeSlots }));
  };
  
  const handleAddNewTimeSlot = () => {
       const newTimeSlots = [...localSettings.timeSlots, '16:00'];
       handleSettingsBlur('timeSlots', newTimeSlots);
  }

  const handleRemoveTimeSlot = (indexToRemove: number) => {
      const newTimeSlots = localSettings.timeSlots.filter((_, index) => index !== indexToRemove);
      handleSettingsBlur('timeSlots', newTimeSlots);
  }

  const handleSettingsBlur = async (field: keyof ScheduleSettings, value?: any) => {
    if (!user) return;
    const valueToUpdate = value ?? localSettings[field];

    if (JSON.stringify(valueToUpdate) !== JSON.stringify(settings[field])) {
        await updateSettings({ [field]: valueToUpdate });
        toast({ title: 'Ayarlar Güncellendi' });
    }
  };
  
  const handleGenerateTimeSlots = () => {
    const { startTime, lessonDuration, breakDuration, lunchBreakAfter, lunchBreakDuration, numberOfLessons } = localSettings;
    const newTimeSlots: string[] = [];
    let currentTime = new Date(`1970-01-01T${startTime}:00`);
    
    for (let i = 0; i < numberOfLessons; i++) { 
        newTimeSlots.push(`${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`);
        
        currentTime = new Date(currentTime.getTime() + lessonDuration * 60000);

        if ((i + 1) === lunchBreakAfter) {
            currentTime = new Date(currentTime.getTime() + lunchBreakDuration * 60000);
        } else {
            currentTime = new Date(currentTime.getTime() + breakDuration * 60000);
        }
    }

    setLocalSettings(prev => ({...prev, timeSlots: newTimeSlots}));
    // Also save it immediately
    handleSettingsBlur('timeSlots', newTimeSlots);
    toast({ title: "Saatler Oluşturuldu", description: "Ders saatleri belirttiğiniz sürelere göre yeniden oluşturuldu." });
  };

  const getLessonForSlot = (day: Day, slot: number): Lesson | undefined => {
    const daySchedule = schedule.find(d => d.day === day);
    return daySchedule?.lessons.find(l => l.lessonSlot === slot);
  }
  
  const selectedDaySchedule = React.useMemo(() => {
      return schedule.find(d => d.day === selectedDay);
  }, [schedule, selectedDay]);
  
  const uniqueLessons = React.useMemo(() => {
    const lessonsMap = new Map<string, Omit<Lesson, 'id' | 'lessonSlot' | 'time'>>();
    schedule.forEach(day => {
        day.lessons.forEach(lesson => {
            const { id, lessonSlot, time, ...rest } = lesson;
            const key = `${rest.subject}-${rest.grade}-${rest.class}`;
            if (!lessonsMap.has(key)) {
                lessonsMap.set(key, rest);
            }
        });
    });
    return Array.from(lessonsMap.values());
  }, [schedule]);

  const findRelatedPlan = (lesson: Lesson | null): Plan | null => {
    if (!lesson) return null;
    // First, try to find a plan directly linked by planId
    if (lesson.planId) {
        const directPlan = plans.find(p => p.id === lesson.planId);
        if (directPlan) return directPlan;
    }
    // Fallback to finding a plan by grade, if no planId is set
    if (!lesson.grade) return null;
    return plans.find(p => p.grade === lesson.grade && p.type === 'annual') || null;
}

  const handleLessonClick = (day: Day, slotIndex: number, lesson: Lesson | null) => {
    openEditLessonModal(day, slotIndex, lesson);
  };

  if (isLoading || isLoadingPlans) {
    return (
      <Card className="w-full">
        <CardHeader><CardTitle>Haftalık Ders Programı</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <Card className="w-full overflow-hidden">
          <CardHeader className='pb-4'>
              <CardTitle className="flex items-center justify-between text-lg md:text-xl">
                 <div className='flex items-center gap-2'>
                    <Calendar className="h-5 w-5 text-primary" /> Haftalık Ders Programı
                 </div>
              </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <div className='flex items-center justify-center gap-1 md:gap-2 mb-4'>
                {dayOrder.map(day => {
                    const color = dayColors[day];
                    return (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={cn(
                                'flex-1 md:flex-none md:w-auto md:px-4 h-12 rounded-full text-sm md:text-base font-bold transition-all duration-300 flex items-center justify-center',
                                selectedDay === day 
                                    ? 'text-white shadow-lg' 
                                    : 'text-muted-foreground bg-muted hover:bg-muted/80'
                            )}
                            style={{ backgroundColor: selectedDay === day ? color : undefined }}
                        >
                            <span className='hidden md:inline'>{day}</span>
                            <span className='md:hidden'>{dayShort[day]}</span>
                        </button>
                    )
                })}
             </div>
             
             <Separator/>

            <div className='mt-4'>
                <div 
                    className='p-2 rounded-lg font-bold text-center text-lg text-white mb-4'
                    style={{ backgroundColor: dayColors[selectedDay] }}
                >
                    {selectedDay}
                </div>
                <div className='space-y-2'>
                    {localSettings.timeSlots.map((time, slotIndex) => {
                        const lesson = getLessonForSlot(selectedDay, slotIndex);
                        const lessonColor = lesson ? stringToColor(lesson.subject) : null;
                        
                        return(
                            <button
                                key={`slot-${slotIndex}`}
                                onClick={() => handleLessonClick(selectedDay, slotIndex, lesson || null)}
                                className={cn(
                                    'w-full p-3 rounded-lg flex items-center gap-4 transition-all duration-200 border text-left',
                                    lesson ? 'shadow-sm' : 'bg-muted/50 hover:bg-muted'
                                )}
                                style={{
                                    backgroundColor: lesson && lessonColor ? `${lessonColor}20` : undefined,
                                    borderColor: lesson && lessonColor ? `${lessonColor}40` : undefined
                                }}
                            >
                                <div className='flex flex-col items-center justify-center w-20'>
                                    <p className='font-semibold text-sm'>{time}</p>
                                    <p className='text-xs text-muted-foreground'>{calculateEndTime(time, settings.lessonDuration)}</p>
                                </div>
                                <div className='border-l h-8' style={{borderColor: lesson && lessonColor ? `${lessonColor}40` : undefined}}></div>
                                <div className='flex-1'>
                                    {lesson ? (
                                        <>
                                            <p className='font-bold text-sm'>{lesson.subject}</p>
                                            <p className='text-xs text-muted-foreground'>{lesson.grade} - {lesson.class}</p>
                                        </>
                                    ) : (
                                         <p className='text-sm text-muted-foreground'>Ders eklemek için tıklayın...</p>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
          </CardContent>
      </Card>
      
       <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border rounded-xl bg-card">
                <AccordionTrigger className="px-6 py-4">
                    <div className='flex flex-col items-start'>
                        <h3 className="font-semibold flex items-center gap-2">
                             <Settings className='h-4 w-4'/>
                             Program Ayarları
                        </h3>
                        <p className="text-sm text-muted-foreground font-normal">
                             Ders sürelerini ve başlangıç saatlerini buradan düzenleyebilirsiniz.
                        </p>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className='px-6 pb-6 space-y-6'>
                        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                            <div className='space-y-2'>
                                <Label htmlFor="numberOfLessons">Günlük Ders Sayısı</Label>
                                <Input id="numberOfLessons" type="number" value={localSettings.numberOfLessons}
                                    onChange={(e) => handleSettingsChange('numberOfLessons', parseInt(e.target.value) || 0)}
                                    onBlur={() => handleSettingsBlur('numberOfLessons')} />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor="startTime">Başlangıç Saati</Label>
                                <Input id="startTime" type="time" value={localSettings.startTime}
                                    onChange={(e) => handleSettingsChange('startTime', e.target.value)}
                                    onBlur={() => handleSettingsBlur('startTime')} />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor="lessonDuration">Ders Süresi (dk)</Label>
                                <Input id="lessonDuration" type="number" value={localSettings.lessonDuration}
                                    onChange={(e) => handleSettingsChange('lessonDuration', parseInt(e.target.value) || 0)}
                                    onBlur={() => handleSettingsBlur('lessonDuration')} />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor="breakDuration">Teneffüs Süresi (dk)</Label>
                                <Input id="breakDuration" type="number" value={localSettings.breakDuration}
                                    onChange={(e) => handleSettingsChange('breakDuration', parseInt(e.target.value) || 0)}
                                    onBlur={() => handleSettingsBlur('breakDuration')} />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor="lunchBreakAfter">Öğle Arası (.. ders sonrası)</Label>
                                <Input id="lunchBreakAfter" type="number" value={localSettings.lunchBreakAfter}
                                    onChange={(e) => handleSettingsChange('lunchBreakAfter', parseInt(e.target.value) || 0)}
                                    onBlur={() => handleSettingsBlur('lunchBreakAfter')} />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor="lunchBreakDuration">Öğle Arası Süresi (dk)</Label>
                                <Input id="lunchBreakDuration" type="number" value={localSettings.lunchBreakDuration}
                                    onChange={(e) => handleSettingsChange('lunchBreakDuration', parseInt(e.target.value) || 0)}
                                    onBlur={() => handleSettingsBlur('lunchBreakDuration')} />
                            </div>
                        </div>

                        <div className='flex justify-center'>
                            <Button onClick={handleGenerateTimeSlots}>
                                <BrainCircuit className="mr-2 h-4 w-4" />
                                Saatleri Otomatik Oluştur
                            </Button>
                        </div>
                        
                        <Separator/>

                        <div className='space-y-2'>
                            <Label className='flex items-center gap-2'><Clock className='h-4 w-4'/> Ders Saatleri (Manuel Düzenleme)</Label>
                            <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2'>
                            {localSettings.timeSlots.map((time, index) => (
                                <div key={index} className="flex items-center gap-1">
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => handleTimeSlotChange(index, e.target.value)}
                                        onBlur={() => handleSettingsBlur('timeSlots')}
                                        className="w-full"
                                    />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className='h-9 w-9 text-destructive/70 hover:text-destructive hover:bg-destructive/10 flex-shrink-0'>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Ders Saatini Sil</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Bu işlem geri alınamaz. "{time}" ders saatini ve bu saate ait tüm haftalık dersleri kalıcı olarak silecektir. Emin misiniz?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemoveTimeSlot(index)} className="bg-destructive hover:bg-destructive/90">
                                                    Evet, Sil
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))}
                            <Button variant='outline' onClick={handleAddNewTimeSlot} className='flex items-center gap-2'>
                                <Plus className='h-4 w-4'/> Yeni Ekle
                            </Button>
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
       </Accordion>

      {editingLesson && (
          <AddLessonForm
              isOpen={!!editingLesson}
              onClose={() => setEditingLesson(null)}
              day={editingLesson.day}
              lessonSlot={editingLesson.lessonSlot}
              lesson={editingLesson.lesson}
              onSave={handleLessonSave}
              onClear={handleClearLesson}
              timeSlot={`${settings.timeSlots[editingLesson.lessonSlot]} - ${calculateEndTime(settings.timeSlots[editingLesson.lessonSlot], settings.lessonDuration)}` || ''}
              relatedPlan={findRelatedPlan(editingLesson.lesson)}
              onViewPlan={(plan) => viewFile(plan, getAcademicWeek(new Date()))}
              availablePlans={plans.filter(p => p.type === 'annual')}
              availableLessons={uniqueLessons}
          />
      )}
       <PlanViewer 
            isOpen={!!viewingPlanContent}
            onClose={closeViewer}
            title={viewingPlanTitle}
            entries={viewingPlanContent || []}
            startWeek={startWeekForPlan}
        />
    </div>
  );
}

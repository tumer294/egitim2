
'use client';

import * as React from 'react';
import {
  FileText,
  Calendar as CalendarIcon,
  Loader2,
  MessageSquarePlus,
  Users,
  AlertTriangle,
  FilePenLine,
  Save,
  XCircle,
  Undo2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Student, DailyRecord, AttendanceStatus, ClassInfo, RecordEvent } from '@/lib/types';
import { statusOptions } from '@/lib/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useDailyRecords, useClassesAndStudents } from '@/hooks/use-daily-records';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import AuthGuard from '@/components/auth-guard';

function GunlukTakipPageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { classes, isLoading: isClassesLoading } = useClassesAndStudents(user?.uid);
  
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<ClassInfo | null>(null);
  const [recordDate, setRecordDate] = React.useState<Date | null>(new Date());
  
  const { 
      records: allRecords, 
      isLoading: isRecordsLoading, _bulkUpdateRecords, 
      bulkUpdateRecords
  } = useDailyRecords(user?.uid, selectedClass?.id);

  const [editingNoteFor, setEditingNoteFor] = React.useState<Student | null>(null);
  const [currentNote, setCurrentNote] = React.useState('');
  
  const [isBulkNoteOpen, setIsBulkNoteOpen] = React.useState(false);
  const [bulkNoteContent, setBulkNoteContent] = React.useState('');

  const [dailyRecords, setDailyRecords] = React.useState<DailyRecord[]>([]);
  const [isDirty, setIsDirty] = React.useState(false);

  const dateStr = recordDate ? format(recordDate, 'yyyy-MM-dd') : '';

  React.useEffect(() => {
    if (selectedClass && dateStr) {
      const recordsForDay = allRecords.filter(r => r.classId === selectedClass.id && r.date === dateStr);
      setDailyRecords(recordsForDay);
      setIsDirty(false); // Reset dirty state when date or class changes
    } else {
      setDailyRecords([]);
      setIsDirty(false);
    }
  }, [allRecords, selectedClass, dateStr]);

  
  const recordsByStudentId = React.useMemo(() => {
    return dailyRecords.reduce((acc, record) => {
        acc[record.studentId] = record;
        return acc;
    }, {} as Record<string, DailyRecord>)
  }, [dailyRecords]);


  // Fetch students when class changes
  React.useEffect(() => {
    if (!selectedClass) {
        setStudents([]);
        return;
    };
    
    const currentClass = classes.find(c => c.id === selectedClass.id);
    const sortedStudents = currentClass?.students.sort((a, b) => a.studentNumber - b.studentNumber) || [];
    setStudents(sortedStudents);

  }, [selectedClass, classes]);
  
  const updateLocalRecord = (studentId: string, updateFn: (record: DailyRecord) => DailyRecord) => {
      setDailyRecords(prev => {
          const recordIndex = prev.findIndex(r => r.studentId === studentId);
          const newRecords = [...prev];

          if (recordIndex > -1) {
              newRecords[recordIndex] = updateFn(newRecords[recordIndex]);
          } else {
              if(!selectedClass || !dateStr) return prev;
              const newRecord: DailyRecord = {
                  id: `${selectedClass.id}-${dateStr}-${studentId}-${Math.random()}`,
                  classId: selectedClass.id,
                  studentId,
                  date: dateStr,
                  events: []
              };
              newRecords.push(updateFn(newRecord));
          }
          setIsDirty(true);
          return newRecords;
      });
  };

  const handleStatusClick = (studentId: string, status: AttendanceStatus) => {
    const newEvent: RecordEvent = { id: new Date().toISOString(), type: 'status', value: status };
    updateLocalRecord(studentId, record => ({
        ...record,
        events: record.events.concat(newEvent)
    }));
  };

  const handleSetAllStatus = (status: AttendanceStatus) => {
    if (!selectedClass || !dateStr) return;
    
    setDailyRecords(prev => {
        const studentIds = students.map(s => s.id);
        const recordsMap = new Map(prev.map(r => [r.studentId, r]));

        studentIds.forEach(studentId => {
            const newEvent: RecordEvent = { id: new Date().toISOString() + studentId, type: 'status', value: status };
            const existingRecord = recordsMap.get(studentId);
            
            // Start with note events from the existing record, or an empty array
            const noteEvents = existingRecord ? existingRecord.events.filter(e => e.type === 'note') : [];
            
            // Create the updated record with only note events and the new status event
            const updatedRecord: DailyRecord = {
                id: existingRecord?.id || `${selectedClass.id}-${dateStr}-${studentId}`,
                classId: selectedClass.id,
                date: dateStr,
                studentId,
                events: [...noteEvents, newEvent]
            };
            recordsMap.set(studentId, updatedRecord);
        });

        return Array.from(recordsMap.values());
    });

    setIsDirty(true);
  };
  
  const handleRemoveEvent = (studentId: string, eventId: string) => {
    updateLocalRecord(studentId, record => ({
        ...record,
        events: record.events.filter(e => e.id !== eventId)
    }));
  }

  const openNoteEditor = (student: Student) => {
    setEditingNoteFor(student);
    const existingNote = recordsByStudentId[student.id]?.events.find(e => e.type === 'note');
    setCurrentNote(existingNote ? String(existingNote.value) : '');
  }

  const handleSaveNote = () => {
    if (!editingNoteFor || !selectedClass || !dateStr) return;
    
    updateLocalRecord(editingNoteFor.id, record => {
        // Remove existing note to enforce one note per day rule
        const otherEvents = record.events.filter(e => e.type !== 'note');
        if (currentNote.trim()) {
            return { ...record, events: [...otherEvents, { id: new Date().toISOString(), type: 'note', value: currentNote }] };
        }
        return { ...record, events: otherEvents }; // Return with note removed if new note is empty
    });

    setEditingNoteFor(null);
    setCurrentNote('');
  }

  const handleSetAllDescriptions = () => {
    if (!selectedClass || !dateStr || bulkNoteContent.trim() === '') return;

    setDailyRecords(prev => {
        const studentIds = students.map(s => s.id);
        const recordsMap = new Map(prev.map(r => [r.studentId, r]));

        studentIds.forEach(studentId => {
            const newEvent: RecordEvent = { id: new Date().toISOString() + studentId, type: 'note', value: bulkNoteContent };
            const existingRecord = recordsMap.get(studentId);
            const otherEvents = existingRecord ? existingRecord.events.filter(e => e.type !== 'note') : [];
            
            const updatedRecord: DailyRecord = {
                id: existingRecord?.id || `${selectedClass.id}-${dateStr}-${studentId}`,
                classId: selectedClass.id,
                date: dateStr,
                studentId,
                events: [...otherEvents, newEvent]
            };
            recordsMap.set(studentId, updatedRecord);
        });
        return Array.from(recordsMap.values());
    });
    
    setIsDirty(true);
    setIsBulkNoteOpen(false);
    setBulkNoteContent('');
  };

  const handleSaveChanges = async () => {
    if (!user?.uid || !selectedClass || !dateStr) return;
    await bulkUpdateRecords(user.uid, selectedClass.id, dateStr, dailyRecords);
    setIsDirty(false);
    toast({
      title: 'Değişiklikler Kaydedildi',
      description: 'Günlük değerlendirme çizelgesi başarıyla güncellendi.',
    });
  };

  const handleCancelChanges = () => {
    // Re-fetch original data from allRecords
    if (selectedClass && dateStr) {
      const recordsForDay = allRecords.filter(r => r.classId === selectedClass.id && r.date === dateStr);
      setDailyRecords(recordsForDay);
    }
    setIsDirty(false);
    toast({
        title: 'Değişiklikler İptal Edildi',
        variant: 'destructive',
    });
  };

  const isLoading = isClassesLoading || isRecordsLoading;

  if (isClassesLoading) {
    return (
      <AppLayout>
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className='flex flex-col'>
                <h2 className='text-2xl font-bold tracking-tight'>Günlük Değerlendirme Çizelgesi</h2>
                <p className='text-muted-foreground'>
                   {selectedClass?.name ? `${selectedClass.name} sınıfı için değerlendirmeleri girin.` : 'Lütfen bir sınıf seçin.'}
                </p>
            </div>

            <div className="flex w-full md:w-auto items-center justify-between md:justify-start space-x-2">
                <Select
                  value={selectedClass?.id}
                  onValueChange={(classId) => {
                    const newClass = classes.find(c => c.id === classId);
                    if (newClass) setSelectedClass(newClass);
                  }}
                  disabled={!classes || classes.length === 0}
                >
                  <SelectTrigger className="w-[120px] md:w-[180px]">
                    <SelectValue placeholder="Sınıf Seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-auto justify-start text-left font-normal"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recordDate ? format(recordDate, 'dd MMM yyyy', { locale: tr}) : <span>Tarih</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={recordDate || undefined}
                      onSelect={(date) => setRecordDate(date || null)}
                      initialFocus
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
          </div>
        </div>

        {isDirty && (
            <Card className='p-4 bg-primary/10 border-primary/20 sticky top-0 z-10'>
                <div className='flex items-center justify-end'>
                    <div className='flex items-center gap-2'>
                        <Button variant='ghost' onClick={handleCancelChanges}><Undo2 className='h-4 w-4 mr-2'/>İptal</Button>
                        <Button onClick={handleSaveChanges}><Save className='h-4 w-4 mr-2'/> Değişiklikleri Kaydet</Button>
                    </div>
                </div>
            </Card>
        )}

        <Card>
            <CardContent className="p-2 md:p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                <div className="space-y-1">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-2 py-2 font-medium text-muted-foreground border-b">
                       <div className='text-xs'>No</div>
                       <div className='text-xs'>Adı Soyadı</div>
                       <div className='text-center flex items-center justify-end gap-1'>
                            <span className='mr-2 hidden sm:inline text-xs'>Tümüne:</span>
                            {statusOptions.map(option => (
                               <AlertDialog key={`set-all-${option.value}`}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size='icon'
                                        className={cn('rounded-full w-7 h-7 transition-all hover:bg-muted')}
                                        disabled={!selectedClass}
                                    >
                                        {option.icon && <option.icon className="h-4 w-4" />}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className='flex items-center gap-2'>
                                            <AlertTriangle className='text-yellow-500'/>
                                            Tüm Sınıfa Durum Ata
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Bu işlem tüm öğrencilere birer adet <strong>"{option.label}"</strong> durumu ekleyecektir. Emin misiniz?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleSetAllStatus(option.value)}>Evet, Uygula</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            ))}
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full w-7 h-7"
                                onClick={() => setIsBulkNoteOpen(true)}
                                disabled={!selectedClass}
                            >
                                <FilePenLine className="h-4 w-4 text-muted-foreground" />
                            </Button>
                       </div>
                    </div>
                    {students.map(student => {
                        const record = recordsByStudentId[student.id];
                        const noteEvent = record?.events.find(e => e.type === 'note');
                        const statusEvents = record?.events.filter(e => e.type === 'status') || [];
                        const lastStatusEvent = statusEvents.length > 0 ? statusEvents[statusEvents.length - 1] : null;

                        return (
                            <div key={student.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-2 py-3 border-b last:border-none hover:bg-muted/50 rounded-md">
                                <div className="text-xs font-medium text-muted-foreground w-8 text-center">{student.studentNumber}</div>
                                <div className="flex flex-col min-w-0">
                                    <p className='font-semibold text-xs'>{student.firstName} {student.lastName}</p>
                                    <div className="flex items-center gap-1.5 mt-1 overflow-x-auto flex-nowrap pb-1 no-scrollbar">
                                        {statusEvents.map((event) => {
                                            const option = statusOptions.find(o => o.value === event.value);
                                            return(
                                            <TooltipProvider key={event.id} delayDuration={100}>
                                                <Tooltip>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <TooltipTrigger asChild>
                                                                <button className={cn("flex items-center justify-center h-6 w-6 rounded-full cursor-pointer flex-shrink-0", option?.bgColor)}>
                                                                    {option?.icon && <option.icon className="h-4 w-4" style={{ color: option.color }} />}
                                                                </button>
                                                            </TooltipTrigger>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Değerlendirmeyi Sil</AlertDialogTitle>
                                                                <AlertDialogDescription>Bu değerlendirmeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleRemoveEvent(student.id, event.id)}>Evet, Sil</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    <TooltipContent>
                                                        <p>Silmek için tıkla: {option?.label}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )})}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                     <div className="flex items-center border-l pl-1 ml-1 gap-1">
                                     {statusOptions.map(option => (
                                         <Button
                                            key={option.value}
                                            variant={lastStatusEvent?.value === option.value ? 'default' : 'outline'}
                                            size='icon'
                                            className='rounded-full w-7 h-7 transition-all'
                                            onClick={() => handleStatusClick(student.id, option.value as AttendanceStatus)}
                                         >
                                            {option.icon && <option.icon className="h-4 w-4" />}
                                         </Button>
                                     ))}
                                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground w-7 h-7 relative" onClick={() => openNoteEditor(student)}>
                                        <MessageSquarePlus className="h-4 w-4"/>
                                        {noteEvent && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}
                                    </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {!selectedClass && (
                        <div className="text-center p-10 text-muted-foreground">
                            Lütfen işlem yapmak için bir sınıf seçin.
                        </div>
                    )}
                </div>
                )}
            </CardContent>
        </Card>
      </main>

      <Dialog open={!!editingNoteFor} onOpenChange={(isOpen) => !isOpen && setEditingNoteFor(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Öğrenci Notu: {editingNoteFor?.firstName} {editingNoteFor?.lastName}</DialogTitle>
                <DialogDescription>
                    Bu öğrenci için {recordDate ? format(recordDate, 'dd MMMM yyyy', {locale: tr}) : ''} tarihine özel bir not ekleyin. Mevcut notun üzerine yazılacaktır.
                </DialogDescription>
            </DialogHeader>
            <Textarea 
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder='Öğrenci hakkında gözlemlerinizi yazın...'
                rows={5}
                className='my-4'
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="ghost">İptal</Button>
                </DialogClose>
                <Button onClick={handleSaveNote}>Notu Kaydet</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isBulkNoteOpen} onOpenChange={setIsBulkNoteOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Tüm Sınıfa Açıklama Ekle</DialogTitle>
                <DialogDescription>
                    Aşağıya yazdığınız açıklama, seçili sınıftaki tüm öğrencilere uygulanacaktır. Bu işlem mevcut açıklamaların üzerine yazacaktır.
                </DialogDescription>
            </DialogHeader>
            <Textarea 
                value={bulkNoteContent}
                onChange={(e) => setBulkNoteContent(e.target.value)}
                placeholder='Tüm sınıf için ortak bir açıklama yazın...'
                rows={5}
                className='my-4'
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="ghost">İptal</Button>
                </DialogClose>
                <Button onClick={handleSetAllDescriptions}>Tümüne Uygula</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
}

export default function GunlukTakipPage() {
    return (
      <AuthGuard>
        <GunlukTakipPageContent />
      </AuthGuard>
    );
  }

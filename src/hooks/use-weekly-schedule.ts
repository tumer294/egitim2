

'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import type { WeeklyScheduleItem, Day, Lesson, ScheduleSettings } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, getDoc, updateDoc, writeBatch } from 'firebase/firestore';

const dayOrder: Day[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const getDefaultSchedule = (): WeeklyScheduleItem[] => {
    return dayOrder.map(day => ({
        day,
        lessons: [],
    }));
};

const defaultSettings: ScheduleSettings = {
    startTime: '08:30',
    lessonDuration: 40,
    breakDuration: 10,
    lunchBreakAfter: 4,
    lunchBreakDuration: 45,
    numberOfLessons: 8,
    timeSlots: ['08:30', '09:20', '10:10', '11:00', '11:50', '13:30', '14:20', '15:10'],
};

export function useWeeklySchedule(userId?: string) {
  const { toast } = useToast();
  const [schedule, setScheduleState] = React.useState<WeeklyScheduleItem[]>(getDefaultSchedule());
  const [settings, setSettings] = React.useState<ScheduleSettings>(defaultSettings);
  const [isLoading, setIsLoading] = React.useState(true);
  const scheduleDocId = "weekly-lessons-schedule"; 

  React.useEffect(() => {
    if (!userId) {
        setScheduleState(getDefaultSchedule());
        setSettings(defaultSettings);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const scheduleDocRef = doc(db, `users/${userId}/schedules`, scheduleDocId);

    const unsubscribe = onSnapshot(scheduleDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            const scheduleData: WeeklyScheduleItem[] = dayOrder.map(day => ({
                day: day,
                lessons: data[day] || [],
            }));
            setScheduleState(scheduleData);

            const scheduleSettings: ScheduleSettings = {
                timeSlots: data.timeSlots || defaultSettings.timeSlots,
                lessonDuration: data.lessonDuration ?? defaultSettings.lessonDuration,
                startTime: data.startTime || defaultSettings.startTime,
                breakDuration: data.breakDuration ?? defaultSettings.breakDuration,
                lunchBreakAfter: data.lunchBreakAfter ?? defaultSettings.lunchBreakAfter,
                lunchBreakDuration: data.lunchBreakDuration ?? defaultSettings.lunchBreakDuration,
                numberOfLessons: data.numberOfLessons ?? defaultSettings.numberOfLessons,
            };
            setSettings(scheduleSettings);
        } else {
            const defaultScheduleData = dayOrder.reduce((acc, day) => {
                acc[day] = [];
                return acc;
            }, {} as { [key in Day]: Lesson[] });

            const initialData = { ...defaultScheduleData, ...defaultSettings };

             try {
                await setDoc(scheduleDocRef, initialData);
                setScheduleState(getDefaultSchedule());
                setSettings(defaultSettings);
             } catch (error) {
                console.error("Failed to create default schedule for user", error);
                toast({ title: "Hata!", description: "Varsayılan ders programı oluşturulamadı.", variant: "destructive" });
             }
        }
        setIsLoading(false);
    }, (error) => {
      console.error("Failed to load schedule from Firestore", error);
      toast({
        title: "Program Yüklenemedi",
        description: "Ders programı yüklenirken bir sorun oluştu.",
        variant: "destructive"
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);


  const updateLesson = async (day: Day, lessonData: Omit<Lesson, 'id' | 'lessonSlot'> | null, lessonSlot: number) => {
    if (!userId) return;

    const scheduleDocRef = doc(db, `users/${userId}/schedules`, scheduleDocId);

    try {
        const docSnap = await getDoc(scheduleDocRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const dayLessons: Lesson[] = currentData[day] || [];
        
        let updatedLessons: Lesson[];
        const existingLessonIndex = dayLessons.findIndex(l => l.lessonSlot === lessonSlot);

        if (lessonData) { // Add or update a lesson
            if (existingLessonIndex > -1) {
                // Update existing lesson: merge old data with new data from form
                const existingLesson = dayLessons[existingLessonIndex];
                const updatedLesson = {
                    ...existingLesson, // Keep old properties like id
                    ...lessonData,      // Overwrite with new form data
                    lessonSlot,
                    time: settings.timeSlots[lessonSlot] || '',
                };
                updatedLessons = [...dayLessons];
                updatedLessons[existingLessonIndex] = updatedLesson;
            } else {
                // Add new lesson
                const newLesson: Lesson = {
                    id: `${day}-${lessonSlot}-${new Date().getTime()}`,
                    lessonSlot,
                    time: settings.timeSlots[lessonSlot] || '',
                    ...lessonData,
                };
                updatedLessons = [...dayLessons, newLesson];
            }
        } else { // Clear a lesson
            if (existingLessonIndex > -1) {
                 updatedLessons = dayLessons.filter(l => l.lessonSlot !== lessonSlot);
            } else {
                return; // Nothing to clear
            }
        }

        await updateDoc(scheduleDocRef, { [day]: updatedLessons });

    } catch (error) {
         console.error("Error updating lesson:", error);
         toast({
            title: "Hata!",
            description: "Ders güncellenirken bir hata oluştu.",
            variant: "destructive"
        });
    }
  };

  const updateSettings = async (newSettings: Partial<ScheduleSettings>) => {
    if (!userId) return;
    const scheduleDocRef = doc(db, `users/${userId}/schedules`, scheduleDocId);
    
    try {
        const batch = writeBatch(db);

        // If timeSlots are changing, we need to clean up lessons
        if (newSettings.timeSlots) {
            const oldTimeSlots = settings.timeSlots;
            const newTimeSlots = newSettings.timeSlots;

            // Find removed slots
            const removedSlotsIndices = oldTimeSlots
                .map((_, index) => index)
                .filter(index => !newTimeSlots[index]);

            if (removedSlotsIndices.length > 0) {
                const docSnap = await getDoc(scheduleDocRef);
                if (docSnap.exists()) {
                    const currentData = docSnap.data();
                    const updates: { [key: string]: any } = {};

                    dayOrder.forEach(day => {
                        const dayLessons: Lesson[] = currentData[day] || [];
                        const cleanedLessons = dayLessons
                            .filter(l => l.lessonSlot < newTimeSlots.length)
                            .map((l, index) => ({ ...l, lessonSlot: index }));
                            
                        updates[day] = cleanedLessons;
                    });
                     batch.update(scheduleDocRef, updates);
                }
            }
        }
        
        // Update the settings
        batch.update(scheduleDocRef, newSettings);

        await batch.commit();

    } catch (error) {
         console.error("Error updating settings:", error);
         toast({
            title: "Hata!",
            description: "Ayarlar güncellenirken bir hata oluştu.",
            variant: "destructive"
        });
    }
  };

  const setSchedule = async (newSchedule: WeeklyScheduleItem[]) => {
    if (!userId) return;
    const scheduleDocRef = doc(db, `users/${userId}/schedules`, scheduleDocId);
    try {
        const scheduleDataForDb = newSchedule.reduce((acc, daySchedule) => {
            acc[daySchedule.day] = daySchedule.lessons;
            return acc;
        }, {} as { [key: string]: Lesson[] });
        
        await updateDoc(scheduleDocRef, scheduleDataForDb);
    } catch (error) {
        console.error("Error setting new schedule:", error);
        toast({
            title: "Hata!",
            description: "Ders programı aktarılırken bir hata oluştu.",
            variant: "destructive"
        });
    }
  };
  
  return { schedule, settings, isLoading, updateLesson, updateSettings, setSchedule };
}

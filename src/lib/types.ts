

import { type LucideIcon, UserX, CircleSlash, PlusCircle, MinusCircle, FileCheck, Pin, PinOff } from "lucide-react";

export type UserRole = 'admin' | 'teacher' | 'beklemede';

export type UserProfile = {
  fullName: string;
  title: string;
  email: string;
  branch: string;
  workplace: string;
  avatarUrl: string;
  hometown: string;
  role: UserRole;
  fcmTokens?: string[];
  readNotificationIds?: string[];
};

export type Student = {
  id: string;
  studentNumber: number;
  firstName: string;
  lastName: string;
  classId: string;
};

export type ClassInfo = {
  id: string;
  name: string;
  students: Student[];
};

export type AttendanceStatus = '+' | 'Y' | '-' | 'G' | 'D';
export type RecordEventType = 'status' | 'note';
export type RecordEventValue = AttendanceStatus | string;

export type RecordEvent = {
    id: string;
    type: RecordEventType;
    value: RecordEventValue;
}

export type DailyRecord = {
  id: string; // Firestore document ID
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  events: RecordEvent[];
};

export const statusOptions: { value: AttendanceStatus; label: string, icon?: LucideIcon, color?: string, bgColor?: string }[] = [
    { value: '+', label: 'Artı', icon: PlusCircle, color: 'hsl(142.1, 70.6%, 45.1%)', bgColor: 'hsl(142.1, 76.2%, 95.1%)' },
    { value: 'Y', label: 'Yarım', icon: CircleSlash, color: 'hsl(47.9, 95.8%, 53.1%)', bgColor: 'hsl(47.9, 95.8%, 95.1%)' },
    { value: '-', label: 'Eksi', icon: MinusCircle, color: 'hsl(0, 84.2%, 60.2%)', bgColor: 'hsl(0, 84.2%, 95.1%)' },
    { value: 'D', label: 'Yok', icon: UserX, color: 'hsl(222.2, 47.4%, 11.2%)', bgColor: 'hsl(222.2, 47.4%, 95.1%)' },
    { value: 'G', label: 'İzinli', icon: FileCheck, color: 'hsl(221, 83%, 53%)', bgColor: 'hsl(221, 83%, 95.1%)' },
];

export type NoteChecklistItem = {
  id: string;
  text: string;
  isChecked: boolean;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'checklist';
  items?: NoteChecklistItem[];
  date: string; // ISO string for proper date handling
  color: string;
  textColor: string;
  imageUrl?: string;
  isPinned?: boolean;
};

export type Plan = {
    id: string;
    title: string;
    type: 'annual' | 'weekly';
    fileDataUrl: string;
    uploadDate: string; // ISO string for ordering
    fileType: string;
    fileName: string;
    grade?: string; // e.g. "8. Sınıf"
    className?: string; // Optional: e.g. "8/A"
};

export type Lesson = {
  id: string;
  lessonSlot: number;
  subject: string;
  class: string;
  grade?: string; // e.g. "8. Sınıf"
  time: string;
  planId?: string;
}

export type Day = 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar';

export type DaySchedule = {
    lessons: Lesson[];
}

export type ScheduleSettings = {
    timeSlots: string[];
    lessonDuration: number;
    startTime: string;
    breakDuration: number;
    lunchBreakAfter: number;
    lunchBreakDuration: number;
    numberOfLessons: number;
}

export type WeeklyScheduleItem = {
  day: Day;
  lessons: Lesson[];
}

export type LessonPlanEntry = {
    id: string;
    month?: string;
    week?: string;
    hours?: number;
    unit?: string;
    topic?: string;
    objective?: string;
    objectiveExplanation?: string;
    methods?: string;
    assessment?: string;
    specialDays?: string;
    extracurricular?: string;
};

// Forum Types
export type ForumAuthor = {
    uid: string;
    name: string;
    avatarUrl?: string;
}

export type ForumComment = {
    id: string;
    author: ForumAuthor;
    date: string; // ISO String
    content: string;
};

export type ForumReply = {
    id: string;
    author: ForumAuthor;
    date: string; // ISO String
    content: string;
    upvotedBy: string[]; // Array of user UIDs
    commentCount: number;
};

export type ForumPost = {
    id: string;
    title: string;
    description: string;
    category: string;
    author: ForumAuthor;
    date: string; // ISO String
    replies?: ForumReply[]; // Subcollection, might not be loaded directly
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string; // ISO String
};

export type Reminder = {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  time?: string; // HH:mm
  isCompleted: boolean;
  createdAt: string; // ISO String
  notificationsSent?: ('1d' | '1h' | '0h')[];
};

export type Urgency = 'pastDue' | 'veryUrgent' | 'urgent' | 'info' | 'none';

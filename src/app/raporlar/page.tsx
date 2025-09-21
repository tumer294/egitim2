
'use client';
import * as React from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  BarChart2,
  Users,
  List,
  Loader2,
  FileSearch,
  ChevronDown,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "@/components/ui/collapsible"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { format, startOfMonth, isWithinInterval, eachDayOfInterval, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { statusOptions, AttendanceStatus } from '@/lib/types';
import type { Student, ClassInfo, DailyRecord, RecordEvent } from '@/lib/types';
import { useClassesAndStudents } from '@/hooks/use-daily-records';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import AuthGuard from '@/components/auth-guard';
import { generateIndividualReportAction, generateClassReportAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { IndividualStudentReportOutput } from '@/ai/flows/individual-student-report-flow';
import type { ClassReportOutput } from '@/ai/flows/class-report-flow.ts';
import { useMediaQuery } from '@/hooks/use-media-query';


const statusToTurkish: Record<string, string> = {
    '+': 'Arti',
    'Y': 'Yarim',
    '-': 'Eksi',
    'D': 'Yok',
    'G': 'Izinli',
    'note': 'Not',
};

type ChartConfig = {
    [key: string]: {
      label: string;
      color: string;
      icon?: React.ComponentType;
    };
  };
  
const chartConfig = {
  puan: {
    label: 'Performans Puani',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;


function RaporlarPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { classes, isLoading: isClassesLoading } = useClassesAndStudents(user?.uid);
  
  const [students, setStudents] = React.useState<Student[]>([]);
  const [filteredData, setFilteredData] = React.useState<DailyRecord[]>([]);

  const [selectedClassId, setSelectedClassId] = React.useState<string>('');
  const [selectedReportType, setSelectedReportType] = React.useState('bireysel');
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
      from: startOfMonth(new Date()),
      to: new Date(),
  });
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isAiReportLoading, setIsAiReportLoading] = React.useState(false);
  const [aiReport, setAiReport] = React.useState<IndividualStudentReportOutput | ClassReportOutput | null>(null);
  const [isAiReportOpen, setIsAiReportOpen] = React.useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");


  const normalizeTurkishChars = (str: string) => {
    if (!str) return '';
    const map: { [key: string]: string } = {
        'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U',
        'ş': 's', 'Ş': 'S', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
    };
    return str.replace(/[ıİğĞüÜşŞöÖçÇ]/g, (char) => map[char]);
  };
  
  // Set initial class
  React.useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  React.useEffect(() => {
    if (!selectedClassId) {
        setStudents([]);
        return;
    };
    const currentClass = classes.find(c => c.id === selectedClassId);
    const sortedStudents = currentClass?.students.sort((a,b) => a.studentNumber - b.studentNumber) || [];
    setStudents(sortedStudents);
    setSelectedStudentId(null);
    setFilteredData([]);
  }, [selectedClassId, classes]);

  const handleGenerateReport = React.useCallback(async () => {
    if (!user?.uid || !selectedClassId || !dateRange?.from || !dateRange?.to) return;
    
    setIsGenerating(true);
    setFilteredData([]);

    try {
        const q = query(collection(db, `users/${user.uid}/classes/${selectedClassId}/records`));
        const querySnapshot = await getDocs(q);
        const allRecords = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as DailyRecord);
        
        const recordsInRange = allRecords.filter(record => {
            const recordDate = parseISO(record.date);
            return isWithinInterval(recordDate, { start: dateRange.from!, end: dateRange.to! });
        });

        setFilteredData(recordsInRange);

    } catch (error) {
        console.error("Error generating report:", error);
    } finally {
        setIsGenerating(false);
    }
  }, [selectedClassId, dateRange, user?.uid]);


  const individualReportData = React.useMemo(() => {
    if (selectedReportType !== 'bireysel' || !selectedStudentId || !dateRange?.from) return null;

    const studentRecords = filteredData.filter(r => r.studentId === selectedStudentId);

    const summary: Record<AttendanceStatus, { count: number; label: string; icon: React.ComponentType | undefined }> = {
      '+': { count: 0, label: 'Artı', icon: statusOptions.find(o => o.value === '+')?.icon },
      'Y': { count: 0, label: 'Yarım', icon: statusOptions.find(o => o.value === 'Y')?.icon },
      '-': { count: 0, label: 'Eksi', icon: statusOptions.find(o => o.value === '-')?.icon },
      'D': { count: 0, label: 'Yok', icon: statusOptions.find(o => o.value === 'D')?.icon },
      'G': { count: 0, label: 'İzinli', icon: statusOptions.find(o => o.value === 'G')?.icon },
    };
    
    const eventsByDate: { [date: string]: { statuses: RecordEvent[], note: string } } = {};
    const scoresByDate: { [date: string]: number } = {};
    const scoreValues: { [key in AttendanceStatus]: number } = {
        '+': 10, 'Y': -5, '-': -10, 'D': 0, 'G': 0,
    };
    const notes: string[] = [];
    
    studentRecords.forEach(record => {
        if (!eventsByDate[record.date]) {
            eventsByDate[record.date] = { statuses: [], note: '' };
        }
        record.events.forEach(event => {
            if (event.type === 'status') {
                const status = event.value as AttendanceStatus;
                if (summary[status]) {
                    summary[status].count += 1;
                }
                const score = scoresByDate[record.date] || 0;
                scoresByDate[record.date] = score + scoreValues[status];
                eventsByDate[record.date].statuses.push(event);

            } else if (event.type === 'note' && typeof event.value === 'string' && event.value.trim() !== '') {
                eventsByDate[record.date].note = event.value;
                notes.push(event.value);
            }
        });
    });

    const intervalDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to || dateRange.from });
    let cumulativeScore = 0;
    const chartData = intervalDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        cumulativeScore += scoresByDate[dateStr] || 0;
        return {
            date: format(day, 'dd/MM'),
            puan: cumulativeScore,
        };
    });

    return { summary, eventsByDate, chartData, notes };
  }, [filteredData, selectedReportType, selectedStudentId, dateRange]);


  const classReportData = React.useMemo(() => {
    if (selectedReportType !== 'sinif') return null;

    const studentSummaries = students.map(student => {
      const studentRecords = filteredData.filter(r => r.studentId === student.id);
      const summary: Record<AttendanceStatus, number> = {
        '+': 0, 'Y': 0, '-': 0, 'D': 0, 'G': 0
      };
      const notes: {content: string, date: string}[] = [];
      
      studentRecords.forEach(record => {
        record.events.forEach(event => {
            if (event.type === 'status' && summary[event.value as AttendanceStatus] !== undefined) {
                summary[event.value as AttendanceStatus]++;
            }
            if (event.type === 'note' && typeof event.value === 'string' && event.value.trim() !== '') {
                notes.push({content: event.value, date: record.date});
            }
        });
      });
      
      const totalScore = summary['+'] * 10 + summary['Y'] * -5 + summary['-'] * -10;
      
      return {
        ...student,
        summary,
        totalScore,
        notes,
      };
    }).sort((a, b) => a.studentNumber - b.studentNumber);
    
    return { studentSummaries };
  }, [filteredData, selectedReportType, students]);

  const handleGenerateAiReport = async () => {
    setIsAiReportLoading(true);
    setAiReport(null);
    setIsAiReportOpen(true);
    
    try {
        if (selectedReportType === 'bireysel' && individualReportData && selectedStudentId) {
            const student = students.find(s => s.id === selectedStudentId);
            if (!student) throw new Error("Student not found");
            
            const input = {
                studentName: `${student.firstName} ${student.lastName}`,
                className: classes.find(c => c.id === selectedClassId)?.name || '',
                plusCount: individualReportData.summary['+'].count,
                minusCount: individualReportData.summary['-'].count,
                halfCount: individualReportData.summary['Y'].count,
                absentCount: individualReportData.summary['D'].count,
                permittedCount: individualReportData.summary['G'].count,
                notes: individualReportData.notes,
            };
            
            const result = await generateIndividualReportAction(input);
            if(result.report) setAiReport(result.report);
            else throw new Error(result.error);

        } else if (selectedReportType === 'sinif' && classReportData) {
            const input = {
                className: classes.find(c => c.id === selectedClassId)?.name || '',
                studentData: classReportData.studentSummaries.map(s => ({
                    studentName: `${s.firstName} ${s.lastName}`,
                    totalScore: s.totalScore,
                    plusCount: s.summary['+'],
                    minusCount: s.summary['-'],
                    halfCount: s.summary['Y'],
                    absentCount: s.summary['D'],
                    permittedCount: s.summary['G'],
                    notes: s.notes.map(n => n.content),
                }))
            };
            const result = await generateClassReportAction(input);
            if(result.report) setAiReport(result.report);
            else throw new Error(result.error);
        }
    } catch (e: any) {
        toast({ title: 'Rapor Oluşturulamadı', description: e.message || 'Yapay zeka raporu oluşturulurken bir hata oluştu.', variant: 'destructive'});
        setIsAiReportOpen(false);
    } finally {
        setIsAiReportLoading(false);
    }
  };


  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.addFont('PT Sans', 'normal', 'normal');
    doc.setFont('PT Sans', 'normal');
    
    const selectedClass = classes.find(c => c.id === selectedClassId);
    const dateTitle = dateRange?.from ? `${format(dateRange.from, "d MMMM yyyy", { locale: tr })} - ${dateRange.to ? format(dateRange.to, "d MMMM yyyy", { locale: tr }) : ''}` : '';
    
    const pageHeader = (data: any) => {
        if (data.pageNumber > 1) {
            return;
        }
        doc.setFont('PT Sans', 'normal');
        doc.setFontSize(18);
        doc.setTextColor(40);
        if (selectedReportType === 'sinif' && classReportData) {
            doc.text(normalizeTurkishChars(`Sinif Raporu: ${selectedClass?.name}`), data.settings.margin.left, 22);
        } else if (selectedReportType === 'bireysel' && individualReportData) {
            const selectedStudent = students.find(s => s.id === selectedStudentId);
            doc.text(normalizeTurkishChars(`Bireysel Rapor: ${selectedStudent?.firstName} ${selectedStudent?.lastName}`), data.settings.margin.left, 22);
        }
    };

    const pageFooter = (data: any) => {
        doc.setFont('PT Sans', 'normal');
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.setTextColor(150);
        const text = `Sayfa ${data.pageNumber} / ${pageCount}`;
        const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
        doc.text(text, doc.internal.pageSize.width - data.settings.margin.right - textWidth, doc.internal.pageSize.height - 10);
    };

    const tableStyles: any = {
        font: "PT Sans",
        fontStyle: 'normal',
    };

    if (selectedReportType === 'sinif' && classReportData) {
        const body = [];
        for (const s of classReportData.studentSummaries) {
            body.push([
                s.studentNumber,
                normalizeTurkishChars(`${s.firstName} ${s.lastName}`),
                s.summary['+'],
                s.summary['Y'],
                s.summary['-'],
                s.summary['D'],
                s.summary['G'],
                s.totalScore
            ]);
            if (s.notes.length > 0) {
                const notesText = s.notes.map(n => `  - ${format(parseISO(n.date), 'dd/MM/yy', { locale: tr })}: ${normalizeTurkishChars(n.content)}`).join('\n');
                body.push([{ content: normalizeTurkishChars(`Ogretmen Gorusleri:\n${notesText}`), colSpan: 8, styles: { font: "PT Sans", fontStyle: 'italic', textColor: 60, fontSize: 9 } }]);
            }
        }

        (doc as any).autoTable({
            head: [[normalizeTurkishChars('No'), normalizeTurkishChars('Adi Soyadi'), '+', normalizeTurkishChars('Yarim'), '-', normalizeTurkishChars('Yok'), normalizeTurkishChars('Izinli'), normalizeTurkishChars('Toplam Puan')]],
            body: body,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [33, 150, 243], textColor: 255, ...tableStyles },
            styles: tableStyles,
            alternateRowStyles: { fillColor: [240, 244, 255] },
            didDrawPage: (data: any) => {
                pageHeader(data);
                pageFooter(data);
            }
        });

        doc.save(normalizeTurkishChars(`sinif_raporu_${selectedClass?.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`));
    } else if (selectedReportType === 'bireysel' && individualReportData) {
        const selectedStudent = students.find(s => s.id === selectedStudentId);
        
        doc.setFont('PT Sans', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(normalizeTurkishChars(`Sinif: ${selectedClass?.name}`), 14, 32);
        doc.text(normalizeTurkishChars(`Rapor Tarih Araligi: ${dateTitle}`), 14, 38);
        
        const summaryText = Object.entries(individualReportData.summary)
            .map(([key, value]: [string, any]) => `${normalizeTurkishChars(value.label)}: ${value.count}`)
            .join(' | ');
        
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text(normalizeTurkishChars('Genel Durum Ozeti'), 14, 50);
        doc.setFont('PT Sans', 'normal');
        doc.setFontSize(10);
        doc.text(summaryText, 14, 56);
        
        const allEvents = Object.entries(individualReportData.eventsByDate).sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

        if (allEvents.length > 0) {
            (doc as any).autoTable({
                startY: 65,
                head: [[normalizeTurkishChars('Tarih'), normalizeTurkishChars('Durum'), normalizeTurkishChars('Gorus')]],
                body: allEvents.map(([date, data]) => {
                    const statusText = data.statuses.map(s => statusOptions.find(o => o.value === s.value)?.label || '').join(', ');

                    return [
                        normalizeTurkishChars(format(parseISO(date), 'd MMMM yyyy, cccc', { locale: tr })),
                        normalizeTurkishChars(statusText),
                        normalizeTurkishChars(data.note)
                    ];
                }),
                theme: 'striped',
                headStyles: { fillColor: [33, 150, 243], textColor: 255, ...tableStyles },
                styles: tableStyles,
                didDrawPage: (data: any) => {
                    pageHeader(data);
                    pageFooter(data);
                }
            });
        } else {
             pageHeader({ settings: { margin: { left: 14 } } });
             pageFooter({ pageNumber: 1, settings: { margin: { right: 14 } } });
        }
        
        doc.save(normalizeTurkishChars(`bireysel_rapor_${selectedStudent?.firstName}_${selectedStudent?.lastName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`));
    }
  };

  const isLoading = isClassesLoading || isGenerating;
  
  const renderReportContent = () => {
    if (isLoading) {
        return (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }
    
    if (filteredData.length === 0) {
        return (
            <div className="text-center py-10 px-4 text-muted-foreground">
                <FileSearch className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Rapor Bekleniyor</h3>
                <p className="mt-2 text-sm">Rapor oluşturmak için yukarıdaki filtreleri kullanın ve "Raporu Oluştur" düğmesine tıklayın.</p>
            </div>
        )
    }

    if (selectedReportType === 'bireysel' && !individualReportData) {
        return (
            <div className="text-center py-10 px-4 text-muted-foreground">
                <Users className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Öğrenci Seçin</h3>
                <p className="mt-2 text-sm">Bireysel raporu görüntülemek için lütfen bir öğrenci seçin.</p>
            </div>
        )
    }
    
    if(selectedReportType === 'bireysel' && individualReportData){
      const { summary, eventsByDate, chartData } = individualReportData;
      const selectedStudent = students.find(s => s.id === selectedStudentId);

      return (
        <Card>
            <CardHeader className='flex-col md:flex-row items-start md:items-center justify-between gap-4'>
                <div>
                    <CardTitle>Bireysel Rapor: {selectedStudent?.firstName} {selectedStudent?.lastName}</CardTitle>
                    <CardDescription>Aşağıda öğrencinin seçilen tarih aralığındaki performansını görebilirsiniz.</CardDescription>
                </div>
                 <div className='flex gap-2'>
                    <Button variant="outline" onClick={handleDownloadPdf}>
                        <Download className="mr-2 h-4 w-4" />
                        PDF İndir
                    </Button>
                    <Button onClick={handleGenerateAiReport}>
                        <Sparkles className='mr-2 h-4 w-4' />
                        AI Destekli Rapor
                    </Button>
                 </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
                    {Object.entries(summary).map(([key, value]) => (
                        <div key={key} className="border rounded-md p-4">
                            <div className="flex justify-center items-center mb-2">
                                {value.icon && <value.icon className={cn("h-6 w-6", statusOptions.find(o => o.value === key)?.color)} />}
                            </div>
                            <p className="text-2xl font-bold">{value.count}</p>
                            <p className="text-sm text-muted-foreground">{value.label}</p>
                        </div>
                    ))}
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Performans Grafiği</CardTitle>
                         <CardDescription>Öğrencinin seçilen tarih aralığındaki kümülatif performans puanı trendi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis domain={['auto', 'auto']} allowDecimals={false} />
                                    <RechartsTooltip 
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            borderColor: 'hsl(var(--border))'
                                        }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Line type="monotone" dataKey="puan" stroke="var(--color-puan)" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Olay Geçmişi</CardTitle>
                        <CardDescription>Seçilen tarih aralığındaki tüm değerlendirmeler ve notlar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='w-1/4'>Tarih</TableHead>
                                    <TableHead className='w-1/4'>Değerlendirme</TableHead>
                                    <TableHead>Öğretmen Görüşü</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.keys(eventsByDate).length > 0 ? (
                                    Object.entries(eventsByDate)
                                    .sort((a,b) => parseISO(b[0]).getTime() - parseISO(a[0]).getTime())
                                    .map(([date, data]) => (
                                    <TableRow key={date}>
                                        <TableCell className="font-medium align-top">
                                            {format(parseISO(date), 'd MMMM yyyy, EEEE', { locale: tr })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                {data.statuses.map(statusEvent => {
                                                    const option = statusOptions.find(o => o.value === statusEvent.value);
                                                    if (!option) return null;
                                                    return (
                                                        <span key={statusEvent.id} className="inline-flex items-center gap-1.5 p-1 rounded-md" style={{ backgroundColor: option.bgColor }}>
                                                            {React.createElement(option.icon!, { className: cn("h-4 w-4", option.color)})}
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {data.note}
                                        </TableCell>
                                    </TableRow>
                                ))) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                            Bu tarih aralığında kayıt bulunmuyor.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </CardContent>
        </Card>
      )
    }

    if(selectedReportType === 'sinif' && classReportData){
        return (
            <Card>
                <CardHeader className='flex-col md:flex-row items-start md:items-center justify-between gap-4'>
                    <div>
                        <CardTitle>Sınıf Geneli Performans Raporu</CardTitle>
                        <CardDescription>
                            Seçilen tarih aralığında öğrencilerin aldığı işaretler ve toplam puanları.
                        </CardDescription>
                    </div>
                     <div className='flex gap-2'>
                        <Button variant="outline" onClick={handleDownloadPdf}>
                            <Download className="mr-2 h-4 w-4" />
                            PDF İndir
                        </Button>
                        <Button onClick={handleGenerateAiReport}>
                            <Sparkles className='mr-2 h-4 w-4' />
                            AI Destekli Rapor
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto no-scrollbar">
                        <Table className='min-w-[800px]'>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">No</TableHead>
                                <TableHead>Adı Soyadı</TableHead>
                                {statusOptions.map(opt => (
                                    <TableHead key={opt.value} className="text-center">{opt.label}</TableHead>
                                ))}
                                <TableHead className="text-right w-[120px]">Toplam Puan</TableHead>
                                <TableHead className="w-[50px] text-center">Notlar</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {classReportData.studentSummaries.map(student => (
                                <Collapsible key={student.id} asChild>
                                    <React.Fragment>
                                        <TableRow>
                                            <TableCell className="font-medium">{student.studentNumber}</TableCell>
                                            <TableCell>{student.firstName} {student.lastName}</TableCell>
                                            {statusOptions.map(opt => (
                                                <TableCell key={opt.value} className="text-center">{student.summary[opt.value as AttendanceStatus]}</TableCell>
                                            ))}
                                            <TableCell className="text-right font-bold">{student.totalScore}</TableCell>
                                            <TableCell className="text-center">
                                                {student.notes.length > 0 ? (
                                                    <CollapsibleTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <ChevronDown className="h-4 w-4" />
                                                            <span className='ml-1'>{student.notes.length}</span>
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                        <CollapsibleContent asChild>
                                            <tr className='w-full'>
                                                <TableCell colSpan={9}>
                                                    <div className='p-4 bg-muted/50 rounded-md'>
                                                        <h4 className='font-semibold mb-2'>Öğretmen Görüşleri</h4>
                                                        <ul className='space-y-2 list-disc list-inside text-sm'>
                                                        {student.notes.map((note, idx) => (
                                                            <li key={idx}>
                                                                <span className='font-semibold'>{format(parseISO(note.date), 'dd MMM yyyy', {locale: tr})}:</span> {note.content}
                                                            </li>
                                                        ))}
                                                        </ul>
                                                    </div>
                                                </TableCell>
                                            </tr>
                                        </CollapsibleContent>
                                    </React.Fragment>
                                </Collapsible>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return null;
  }

  const AiReportContent = () => {
    if (isAiReportLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Yapay zeka raporunuzu hazırlıyor...</p>
        </div>
      );
    }
    if (!aiReport) {
      return (
        <div className="text-center py-8">
            <p>Rapor içeriği yüklenemedi.</p>
        </div>
      );
    }

    if ('generalEvaluation' in aiReport) { // Individual Report
      return (
        <div className="space-y-4">
            <div>
                <h3 className="font-bold">Genel Değerlendirme</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiReport.generalEvaluation}</p>
            </div>
            <div>
                <h3 className="font-bold">Güçlü Yönler</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiReport.strengths}</p>
            </div>
            <div>
                <h3 className="font-bold">Geliştirilmesi Gereken Yönler</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiReport.areasForImprovement}</p>
            </div>
            <div>
                <h3 className="font-bold">Öneriler</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiReport.recommendations}</p>
            </div>
        </div>
      );
    }

    if ('classOverview' in aiReport) { // Class Report
      return (
        <div className="space-y-4">
            <div>
                <h3 className="font-bold">Genel Değerlendirme</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiReport.classOverview}</p>
            </div>
            <div>
                <h3 className="font-bold">Ortak Güçlü Yönler</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiReport.commonStrengths}</p>
            </div>
            <div>
                <h3 className="font-bold">Geliştirilmesi Gereken Alanlar</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiReport.commonChallenges}</p>
            </div>
            <div>
                <h3 className="font-bold">Öne Çıkan Öğrenciler</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiReport.outstandingStudents}</p>
            </div>
            <div>
                <h3 className="font-bold">Desteğe İhtiyaç Duyan Öğrenciler</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiReport.studentsNeedingSupport}</p>
            </div>
            <div>
                <h3 className="font-bold">Genel Öneriler</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiReport.generalRecommendations}</p>
            </div>
        </div>
      );
    }
    
    return null;
  };

  const AiReportModal = () => {
    const ReportContentWrapper = isMobile ? SheetContent : DialogContent;
    const ReportWrapper = isMobile ? Sheet : Dialog;
    const ReportHeader = isMobile ? SheetHeader : DialogHeader;
    const ReportTitle = isMobile ? SheetTitle : DialogTitle;
    const ReportDescription = isMobile ? SheetDescription : DialogDescription;
    const ReportFooter = isMobile ? SheetFooter : DialogFooter;
    const ReportClose = isMobile ? SheetClose : DialogClose;
    
    return (
        <ReportWrapper open={isAiReportOpen} onOpenChange={setIsAiReportOpen}>
            <ReportContentWrapper 
                className={cn(isMobile ? "rounded-t-xl h-[85vh] flex flex-col" : "max-w-2xl h-[70vh] flex flex-col")}
                {...(isMobile && {side: 'bottom'})}
            >
                <ReportHeader>
                    <ReportTitle className="flex items-center gap-2">
                        <Sparkles className="text-primary h-5 w-5"/>
                        Yapay Zeka Destekli Rapor
                    </ReportTitle>
                    <ReportDescription>
                        Bu rapor, sağlanan verilere dayanarak yapay zeka tarafından oluşturulmuştur ve bir uzman görüşü niteliği taşımaz.
                    </ReportDescription>
                </ReportHeader>
                <div className='flex-1 min-h-0 overflow-y-auto pr-2 py-4'>
                    <AiReportContent />
                </div>
                <ReportFooter>
                    <ReportClose asChild>
                        <Button type="button" variant="secondary" className={cn(isMobile && 'w-full')}>
                            Kapat
                        </Button>
                    </ReportClose>
                </ReportFooter>
            </ReportContentWrapper>
        </ReportWrapper>
    );
  }
  
  return (
    <AppLayout>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Raporlar</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rapor Oluştur</CardTitle>
            <CardDescription>Rapor oluşturmak için aşağıdaki kriterleri seçin.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end flex-wrap">
              <div className="space-y-1">
                <Label htmlFor="class-select">Sınıf</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger id="class-select">
                    <SelectValue placeholder="Sınıf seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="report-type">Rapor Türü</Label>
                <Select value={selectedReportType} onValueChange={(value) => {
                    setSelectedReportType(value);
                    setFilteredData([]);
                }}>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Rapor türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bireysel">Bireysel Öğrenci Raporu</SelectItem>
                    <SelectItem value="sinif">Sınıf Raporu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1" style={{ display: selectedReportType === 'bireysel' ? 'block' : 'none' }}>
                <Label htmlFor="student-select">Öğrenci</Label>
                <Select value={selectedStudentId || ''} onValueChange={setSelectedStudentId} disabled={students.length === 0}>
                  <SelectTrigger id="student-select">
                    <SelectValue placeholder="Öğrenci seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.studentNumber} - {s.firstName} {s.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tarih Aralığı</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "dd MMMM yyyy", { locale: tr })} -{' '}
                            {format(dateRange.to, "dd MMMM yyyy", { locale: tr })}
                            </>
                        ) : (
                            format(dateRange.from, "dd MMMM yyyy", { locale: tr })
                        )
                        ) : (
                        <span>Tarih aralığı seçin</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={tr}
                    />
                    </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateReport} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
                Raporu Oluştur
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-6">
            {renderReportContent()}
        </div>
        
        <AiReportModal />
      </main>
    </AppLayout>
  );
}

export default function RaporlarPage() {
    return (
      <AuthGuard>
        <RaporlarPageContent />
      </AuthGuard>
    );
  }

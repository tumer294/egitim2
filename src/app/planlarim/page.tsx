
'use client';

import * as React from 'react';
import { Trash2, FileText, Plus, Loader2, Download, Sheet as ExcelIcon, File as WordIcon, Search } from 'lucide-react';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { UploadPlanForm } from '@/components/upload-plan-form';
import { Badge } from '@/components/ui/badge';
import type { Plan, Lesson, Day, WeeklyScheduleItem, LessonPlanEntry } from '@/lib/types';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import AuthGuard from '@/components/auth-guard';
import { useWeeklySchedule } from '@/hooks/use-weekly-schedule';
import * as XLSX from 'xlsx';
import { PlanViewer } from '@/components/plan-viewer';
import { usePlans } from '@/hooks/use-plans';
import { getAcademicWeek } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';


const PLANS_STORAGE_KEY_PREFIX = 'lesson-plans_';
const dayOrder: Day[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

function PlanlarimPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setSchedule } = useWeeklySchedule(user?.uid);
  const { plans, isLoading, addPlan, deletePlan } = usePlans(user?.uid);
  
  const [viewingPlan, setViewingPlan] = React.useState<Plan | null>(null);
  const [viewingPlanContent, setViewingPlanContent] = React.useState<LessonPlanEntry[] | null>(null);
  const [viewingPlanTitle, setViewingPlanTitle] = React.useState<string>('');
  const [startWeekForPlan, setStartWeekForPlan] = React.useState<number>(1);
  const [planTypeFilter, setPlanTypeFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');


  const processAndImportSchedule = async (file: File) => {
    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        const newSchedule: WeeklyScheduleItem[] = dayOrder.map(day => ({ day, lessons: [] }));
        
        for(let i = 1; i < json.length; i++) {
            const row = json[i];
            if(!row) continue;
            const [day, time, subject, className] = row;
            
            const targetDay = newSchedule.find(d => d.day === day);
            if (targetDay && time && subject && className) {
                targetDay.lessons.push({
                    id: new Date().toISOString() + Math.random(),
                    time,
                    subject,
                    class: className
                });
            }
        }
        
        await setSchedule(newSchedule);

        toast({
            title: 'Program Aktarıldı!',
            description: 'Ders programınız başarıyla takvime aktarıldı.',
        });

    } catch (error) {
        console.error("Error processing schedule file:", error);
        toast({
            title: "Program Aktarılamadı",
            description: "Excel dosyası işlenirken bir hata oluştu.",
            variant: "destructive"
        });
    }
  };

  const handleAddPlan = (planData: Omit<Plan, 'id' | 'uploadDate'>, importToSchedule: boolean, file?: File) => {
    const newPlanData = {
      ...planData,
      uploadDate: new Date().toISOString(),
    };
    addPlan(newPlanData);
    
    if (importToSchedule && file) {
      processAndImportSchedule(file);
    }
  };

  const handleDeletePlan = async (idToDelete: string) => {
    await deletePlan(idToDelete);
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-10 w-10 text-red-500" />;
    if (fileType.includes('word')) return <WordIcon className="h-10 w-10 text-blue-500" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <ExcelIcon className="h-10 w-10 text-green-500" />;
    return <FileText className="h-10 w-10 text-gray-500" />;
  };

  const getFriendlyFileType = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF Belgesi';
    if (fileType.includes('word')) return 'Word Belgesi';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'Excel Dosyası';
    return fileType;
  }

  const downloadFile = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewFile = async (plan: Plan) => {
    const week = getAcademicWeek(new Date());

    if (plan.fileType.includes('sheet') || plan.fileType.includes('excel')) {
        const blob = await (await fetch(plan.fileDataUrl)).blob();
        setViewingPlan(plan);
        setViewingPlanTitle(plan.title);
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
             setViewingPlan(null);
             setViewingPlanTitle('');
        }
    } else {
      // For PDF and Word files, open in a new tab.
      const blob = await (await fetch(plan.fileDataUrl)).blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url); // Clean up
    }
  };
  
  const closeViewer = () => {
    setViewingPlan(null);
    setViewingPlanContent(null);
    setViewingPlanTitle('');
  }

  const filteredPlans = React.useMemo(() => {
    return plans.filter(plan => {
      const matchesType = planTypeFilter === 'all' || plan.type === planTypeFilter;
      const matchesSearch = searchTerm === '' || plan.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [plans, planTypeFilter, searchTerm]);


  if (isLoading) {
    return (
      <AppLayout>
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 relative">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Planlarım</h2>
          <UploadPlanForm onAddPlan={handleAddPlan} />
        </div>

        <Card>
            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                 <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Plan başlığına göre ara..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
                    <SelectTrigger className="w-full md:w-[240px]">
                        <SelectValue placeholder="Plan Türüne Göre Filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Planlar</SelectItem>
                        <SelectItem value="annual">Yıllık Planlar</SelectItem>
                        <SelectItem value="weekly">Haftalık Planlar</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

        {filteredPlans.length === 0 ? (
          <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed min-h-[50vh]">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {plans.length === 0 ? 'Henüz plan oluşturulmadı' : 'Bu kriterlere uygun plan bulunamadı'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {plans.length === 0 ? 'Yeni bir ders planı yükleyerek başlayın.' : 'Filtreleri temizlemeyi veya yeni bir plan eklemeyi deneyin.'}
              </p>
              {plans.length === 0 && (
                 <div className="mt-6">
                    <UploadPlanForm onAddPlan={handleAddPlan} isFirstPlan={true} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader className="flex-row items-start justify-between p-4">
                    <div>
                        <CardTitle className="text-base mb-1 leading-tight">{plan.title}</CardTitle>
                        <Badge variant={plan.type === 'annual' ? 'default' : 'secondary'} className="mt-1">
                            {plan.type === 'annual' ? 'Yıllık Plan' : 'Haftalık Plan'}
                        </Badge>
                    </div>
                    {getFileIcon(plan.fileType)}
                </CardHeader>
                <CardContent className="flex-grow p-4 pt-0 text-xs text-muted-foreground space-y-1">
                    <p>
                        Yüklenme: {format(new Date(plan.uploadDate), 'dd.MM.yyyy')}
                    </p>
                    <p className="truncate">
                        Dosya: {getFriendlyFileType(plan.fileType)}
                    </p>
                </CardContent>
                <CardFooter className="p-2 border-t mt-auto">
                    <div className='flex justify-between w-full items-center'>
                        <div className='flex gap-2'>
                            <Button variant="outline" size="icon" onClick={() => viewFile(plan)}>
                                <FileText />
                            </Button>
                            <Button size="sm" onClick={() => downloadFile(plan.fileDataUrl, plan.fileName)}>
                                <Download /> İndir
                            </Button>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                    <Trash2 />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bu işlem geri alınamaz. "{plan.title}" adlı planı kalıcı olarak silecektir.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePlan(plan.id)} className="bg-destructive hover:bg-destructive/90">
                                    Sil
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <PlanViewer 
            isOpen={!!viewingPlanContent}
            onClose={closeViewer}
            title={viewingPlanTitle}
            entries={viewingPlanContent || []}
            startWeek={startWeekForPlan}
        />
        
      </main>
    </AppLayout>
  );
}

export default function PlanlarimPage() {
    return (
      <AuthGuard>
        <PlanlarimPageContent />
      </AuthGuard>
    );
  }

    





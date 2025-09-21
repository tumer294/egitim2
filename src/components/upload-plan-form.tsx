
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, Plus, Folder, Loader2, FileText, Sheet as ExcelIcon, File as WordIcon, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Plan } from '@/lib/types';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ACCEPTED_FILE_TYPES_DOC = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
const ACCEPTED_FILE_TYPES_SCHEDULE = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const gradeLevels = ["1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf", "5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf", "Okul Öncesi"];

const formSchema = z.object({
  title: z.string().min(3, { message: 'Plan başlığı en az 3 karakter olmalıdır.' }),
  grade: z.string().optional(),
  type: z.enum(['annual', 'weekly'], { required_error: 'Lütfen bir plan türü seçin.' }),
  importToSchedule: z.boolean().default(false),
  file: z
    .custom<FileList>()
    .refine((files) => files?.length > 0, 'Lütfen bir dosya seçin.'),
}).refine((data) => {
    if (!data.file || data.file.length === 0) return true; // Let the required check handle this
    const fileType = data.file[0].type;
    if (data.importToSchedule) {
      return ACCEPTED_FILE_TYPES_SCHEDULE.includes(fileType);
    }
    return ACCEPTED_FILE_TYPES_DOC.includes(fileType);
}, {
    message: 'Geçersiz dosya türü. PDF, Word veya Excel dosyası yükleyebilirsiniz. Program aktarımı için sadece Excel dosyaları desteklenir.',
    path: ['file'],
}).refine((data) => {
    if(!data.file || data.file.length === 0) return true;
    return data.file[0].size <= MAX_FILE_SIZE;
}, {
    message: `Maksimum dosya boyutu 1MB'dir.`,
    path: ['file'],
});


type FormValues = z.infer<typeof formSchema>;


type UploadPlanFormProps = {
  onAddPlan: (plan: Omit<Plan, 'id' | 'uploadDate'>, importToSchedule: boolean, file?: File) => void;
  isFirstPlan?: boolean;
};

export function UploadPlanForm({ onAddPlan, isFirstPlan = false }: UploadPlanFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      grade: '',
      type: 'annual',
      importToSchedule: false,
      file: undefined,
    },
  });
  
  const fileRef = form.register('file');

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    const file = values.file[0];
    try {
      const fileDataUrl = await readFileAsDataURL(file);
      const planToAdd = {
        title: values.title,
        grade: values.grade,
        type: values.type,
        fileDataUrl,
        fileType: file.type,
        fileName: file.name
      };
      
      onAddPlan(planToAdd, values.importToSchedule, file);

      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Plan Yükleme Hatası',
        description: 'Plan yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDownloadTemplate = () => {
    const headers = [
      "AY",
      "HAFTA",
      "SAAT",
      "ÜNİTE",
      "KONU (ALT ÖĞRENME ALANI)",
      "KAZANIM",
      "AÇIKLAMALAR",
      "YÖNTEM VE TEKNİKLER",
      "ÖLÇME VE DEĞERLENDİRME",
      "BELİRLİ GÜN VE HAFTALAR",
      "DİĞER"
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Yıllık Plan');
    XLSX.writeFile(wb, 'yillik_plan_sablonu.xlsx');
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const triggerButton = isFirstPlan ? (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      İlk Planını Yükle
    </Button>
  ) : (
    <Button>
      <Upload className="mr-2 h-4 w-4" />
      Plan Yükle
    </Button>
  );

  const selectedFile = form.watch('file');
  const importToSchedule = form.watch('importToSchedule');

  const getFileIcon = () => {
    if (!selectedFile || selectedFile.length === 0) return <Folder className="mr-2 h-4 w-4" />;
    const fileType = selectedFile[0].type;
    if (fileType.includes('pdf')) return <FileText className="mr-2 h-4 w-4 text-red-500" />;
    if (fileType.includes('word')) return <WordIcon className="mr-2 h-4 w-4 text-blue-500" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <ExcelIcon className="mr-2 h-4 w-4 text-green-500" />;
    return <Folder className="mr-2 h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        form.reset();
      }
      setOpen(isOpen);
    }}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Ders Planı Yükle</DialogTitle>
          <DialogDescriptionComponent>
            Planınız için bir başlık girin, türünü seçin ve dosyasını yükleyin.
          </DialogDescriptionComponent>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Başlığı</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: 8. Sınıf Matematik Yıllık Planı" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                   <FormDescription>
                     Bu planın hangi sınıf seviyesine ait olduğunu belirtin.
                   </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Plan Türü</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="annual" id="r1" />
                        </FormControl>
                        <FormLabel htmlFor="r1" className="font-normal">Yıllık Plan</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="weekly" id="r2" />
                        </FormControl>
                        <FormLabel htmlFor="r2" className="font-normal">Haftalık Plan</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <div className='flex justify-between items-center'>
                      <FormLabel>Dosya</FormLabel>
                      <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={handleDownloadTemplate}>
                        <FileDown className="mr-1 h-3 w-3"/>
                        Şablonu İndir
                      </Button>
                    </div>
                    <FormControl>
                      <div>
                        <label 
                          htmlFor="file-upload" 
                          className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                          {getFileIcon()}
                          <span>{selectedFile?.[0]?.name ?? 'Dosya Seç'}</span>
                        </label>
                        <Input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            {...fileRef}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
            <FormField
              control={form.control}
              name="importToSchedule"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && selectedFile && selectedFile.length > 0) {
                            const fileType = selectedFile[0].type;
                            if (!ACCEPTED_FILE_TYPES_SCHEDULE.includes(fileType)) {
                                form.resetField('file');
                                toast({
                                    title: "Dosya kaldırıldı",
                                    description: "Seçilen dosya türü bu işlem için uygun değil. Lütfen bir Excel dosyası seçin.",
                                    variant: "destructive"
                                });
                            }
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Ders Programını Takvime Aktar
                    </FormLabel>
                    <FormDescription>
                      Sadece Excel dosyaları (.xls, .xlsx) programa aktarılabilir.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isSubmitting}>
                  İptal
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Planı Yükle
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


'use client';

import * as React from 'react';
import { Upload, CheckCircle, Loader2, File, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { parseStudentListAction } from '@/app/actions';
import type { StudentListParserOutput } from '@/ai/flows/student-list-parser';

type ClassImportData = StudentListParserOutput['classes'][0];

type ImportClassesAndStudentsDialogProps = {
  onImport: (data: ClassImportData[]) => void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function ImportClassesAndStudentsDialog({ onImport }: ImportClassesAndStudentsDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<ClassImportData[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetState = () => {
    setIsLoading(false);
    setParsedData([]);
    setSelectedFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Geçersiz Dosya Türü',
        description: 'Lütfen sadece PDF veya Excel dosyası yükleyin.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Dosya Boyutu Çok Büyük',
        description: `Lütfen ${MAX_FILE_SIZE / 1024 / 1024}MB'den küçük bir dosya yükleyin.`,
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedFile(file);
    setIsLoading(true);
    setParsedData([]);

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUri = e.target?.result as string;
            const result = await parseStudentListAction({ fileDataUri: dataUri });

            if (result.error || !result.classes || result.classes.length === 0) {
                 toast({
                    title: 'Ayrıştırma Hatası',
                    description: result.error || 'Yapay zeka dosyadan geçerli bir sınıf veya öğrenci listesi çıkaramadı. Lütfen dosyanızı kontrol edin.',
                    variant: 'destructive',
                });
                resetState();
                return;
            }
            
            // Normalize class names (e.g., "5. Sınıf / D Şubesi Sınıf Listesi" -> "5/D")
            const normalizedClasses = result.classes.map(c => {
                const name = c.className.replace('Sınıf', '').replace('Şubesi', '').replace('Sınıf Listesi', '').replace(/\s+/g, '').replace('/', '/');
                return { ...c, className: name };
            });

            setParsedData(normalizedClasses);
            setIsLoading(false);
        };
        reader.readAsDataURL(file);
    } catch(err) {
        toast({
            title: 'Dosya Okuma Hatası',
            description: 'Dosya okunurken bir hata oluştu.',
            variant: 'destructive',
        });
        resetState();
    }
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: 'Veri Yok',
        description: 'Lütfen önce geçerli bir dosya yükleyip sistemin işlemesini bekleyin.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    await onImport(parsedData);
    setIsLoading(false);
    setOpen(false);
  };
  
  React.useEffect(() => {
    if (!open) {
      setTimeout(resetState, 300);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Toplu Sınıf/Öğrenci Aktar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sınıfları ve Öğrencileri Toplu Aktar</DialogTitle>
          <DialogDescription>
            E-Okul'dan indirdiğiniz PDF veya Excel formatındaki öğrenci listesi dosyasını yükleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div 
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {selectedFile ? selectedFile.name : "Dosya yüklemek için tıklayın veya sürükleyin"}
            </p>
            <p className="text-xs text-muted-foreground">PDF veya Excel (Max 5MB)</p>
            <input 
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={ACCEPTED_FILE_TYPES.join(',')}
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <p>Dosya analiz ediliyor, lütfen bekleyin...</p>
            </div>
          )}

          {!isLoading && parsedData.length > 0 && (
            <div className='space-y-2'>
              <h4 className='font-medium text-sm text-center'>Aktarım Özeti</h4>
              <div className="border rounded-md max-h-40 overflow-y-auto p-3 text-sm bg-background space-y-2">
                  <div className='flex items-center text-green-600 font-medium'>
                    <CheckCircle className='h-4 w-4 mr-2'/>
                    <p>Toplam {parsedData.length} sınıf ve {parsedData.reduce((acc, c) => acc + c.students.length, 0)} öğrenci bulundu.</p>
                  </div>
                  <ul className='list-disc list-inside pl-2 text-muted-foreground'>
                    {parsedData.map(c => (
                        <li key={c.className}>{c.className}: {c.students.length} öğrenci</li>
                    ))}
                  </ul>
                  <div className='flex items-center text-amber-600 font-medium text-xs pt-2'>
                    <AlertTriangle className='h-4 w-4 mr-2 flex-shrink-0'/>
                    <p>Mevcut sınıflar ve öğrenciler atlanacak, sadece yeniler eklenecektir.</p>
                  </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleConfirmImport} disabled={isLoading || parsedData.length === 0}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Aktarımı Onayla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

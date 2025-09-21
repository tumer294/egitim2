
'use client';

import * as React from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileDown, FileText, Loader2, CheckCircle, AlertTriangle, Users, ClipboardPaste } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/lib/types';
import { Textarea } from './ui/textarea';

type StudentImportData = Omit<Student, 'id' | 'classId'>;

type ImportStudentsDialogProps = {
  classId: string;
  onImport: (classId: string, students: StudentImportData[]) => void;
  isFirstImport?: boolean;
  existingStudents: Pick<Student, 'studentNumber'>[];
};

export function ImportStudentsDialog({ onImport, classId, isFirstImport = false, existingStudents }: ImportStudentsDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [importedStudents, setImportedStudents] = React.useState<StudentImportData[]>([]);
  const [skippedCount, setSkippedCount] = React.useState(0);
  const [pastedText, setPastedText] = React.useState('');
  const [activeTab, setActiveTab] = React.useState("paste");


  const resetState = () => {
    setIsLoading(false);
    setFileName(null);
    setImportedStudents([]);
    setSkippedCount(0);
    setPastedText('');
  };

  const handleDownloadTemplate = () => {
    const templateData = [['Okul Numarası', 'Adı', 'Soyadı']];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ogrenci Listesi');
    XLSX.writeFile(wb, 'ogrenci_sablonu.xlsx');
  };

  const processStudents = (students: any[], type: 'file' | 'paste') => {
      const existingNumbers = new Set(existingStudents.map(s => s.studentNumber));
      const numbersInSet = new Set<number>();
      let localSkippedCount = 0;
      
      const validStudents = students.filter(row => 
          row.studentNumber && row.firstName && row.lastName &&
          typeof row.studentNumber === 'number' &&
          typeof row.firstName === 'string' &&
          typeof row.lastName === 'string'
      ).filter(row => {
          if (existingNumbers.has(row.studentNumber) || numbersInSet.has(row.studentNumber)) {
              localSkippedCount++;
              return false;
          }
          numbersInSet.add(row.studentNumber);
          return true;
      }).map(row => ({
          studentNumber: row.studentNumber,
          firstName: row.firstName,
          lastName: row.lastName,
      }));

      setImportedStudents(validStudents);
      setSkippedCount(localSkippedCount);

      if (validStudents.length === 0 && students.length > 0) {
        toast({
            title: 'Veri Hatası',
            description: type === 'file' 
                ? 'Dosyadaki veriler şablonla uyumlu değil veya tüm öğrenciler zaten mevcut.'
                : 'Yapıştırılan metin formatı hatalı veya tüm öğrenciler zaten mevcut.',
            variant: 'destructive',
        });
      } else if (localSkippedCount > 0) {
           toast({
              title: 'Mükerrer Kayıtlar Atlandı',
              description: `${localSkippedCount} öğrenci, numarası zaten mevcut olduğu için atlandı.`,
              variant: 'default',
          });
      }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);
    setImportedStudents([]);
    setSkippedCount(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, {
        header: ['studentNumber', 'firstName', 'lastName'],
        range: 1, // Skip header row
      }) as any[];
      processStudents(json, 'file');
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Hata!',
        description: 'Dosya okunurken bir hata oluştu. Lütfen dosyanın bozuk olmadığından emin olun.',
        variant: 'destructive',
      });
      resetState();
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedText(text);

    if (text.trim() === '') {
        setImportedStudents([]);
        setSkippedCount(0);
        return;
    }
    
    const lines = text.split('\n').filter(line => line.trim() !== ''); // Boş satırları atla
    
    const studentsFromPaste = lines.map(line => {
        const trimmedLine = line.trim();
        const parts = trimmedLine.split(/\s+/);
        
        if (parts.length < 2) return null;

        const studentNumber = parseInt(parts[0], 10);
        if (isNaN(studentNumber)) return null;
        
        const nameParts = parts.slice(1);
        const lastName = nameParts.pop() || '';
        const firstName = nameParts.join(' ');
        
        if (!firstName || !lastName) return null;

        return { studentNumber, firstName, lastName };
    }).filter((student): student is StudentImportData => student !== null);

    processStudents(studentsFromPaste as any[], 'paste');
  }

  const handleConfirmImport = () => {
    if(importedStudents.length === 0) {
         toast({
            title: 'Aktarılacak Öğrenci Yok',
            description: 'Lütfen geçerli öğrenci verileri içeren bir dosya seçin veya metin yapıştırın.',
            variant: 'destructive',
        });
        return;
    }
    onImport(classId, importedStudents);
    setOpen(false);
  };
  
  React.useEffect(() => {
    if (!open) {
      setTimeout(resetState, 300);
    }
  }, [open]);

  const triggerButton = isFirstImport ? (
     <Button variant="outline" size="sm">
      <Upload className="h-4 w-4 mr-2" />
      Toplu Aktar
    </Button>
  ) : (
    <Button variant="outline" size="sm">
      <Upload className="h-4 w-4 mr-2" />
      İçe Aktar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Öğrencileri İçe Aktar</DialogTitle>
          <DialogDescription>
            Öğrencileri Excel dosyası veya E-Okul'dan kopyala-yapıştır ile ekleyin.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste"><ClipboardPaste className="mr-2 h-4 w-4"/>E-Okul'dan Yapıştır</TabsTrigger>
                <TabsTrigger value="file"><FileText className="mr-2 h-4 w-4"/>Dosya Yükle</TabsTrigger>
            </TabsList>
            <TabsContent value="paste" className="space-y-4 py-4">
                 <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      E-Okul'dan kopyaladığınız öğrenci listesini her satıra bir öğrenci gelecek şekilde yapıştırın. Format: 'Okul Numarası Adı Soyadı'
                    </p>
                    <Textarea 
                        placeholder={'123 Ali Yılmaz\n456 Ayşe Kaya\n789 Mehmet Demir'}
                        rows={6}
                        value={pastedText}
                        onChange={handlePasteChange}
                    />
                 </div>
            </TabsContent>
            <TabsContent value="file" className="space-y-4 py-4">
                 <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
                    <FileDown className="mr-2 h-4 w-4" />
                    Örnek Şablonu İndir (.xlsx)
                </Button>

                <div className="relative">
                    <Button asChild variant="outline" className="w-full">
                    <label htmlFor="file-upload" className="cursor-pointer">
                        {isLoading && activeTab === 'file' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Upload className="mr-2 h-4 w-4" />
                        )}
                        <span>Dosya Seç</span>
                    </label>
                    </Button>
                    <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                </div>
                 {fileName && (
                    <div className="p-3 rounded-md bg-muted text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                            <FileText className="h-5 w-5 flex-shrink-0" />
                            <span className='truncate'>{fileName}</span>
                        </div>
                        { !isLoading && importedStudents.length > 0 && <CheckCircle className='h-5 w-5 text-green-500' /> }
                        { !isLoading && (importedStudents.length === 0 || skippedCount > 0) && <AlertTriangle className='h-5 w-5 text-yellow-500' /> }
                    </div>
                )}
            </TabsContent>
        </Tabs>
        
        {importedStudents.length > 0 && (
        <div className='space-y-2'>
            <h4 className='font-medium flex items-center gap-2'><Users className='h-4 w-4'/>Aktarılacak Öğrenciler ({importedStudents.length})</h4>
            <div className="border rounded-md max-h-32 overflow-y-auto p-2 text-sm bg-background">
                <ul className='divide-y'>
                    {importedStudents.map((s, i) => (
                        <li key={i} className='p-1.5 flex justify-between'>
                            <span>{s.firstName} {s.lastName}</span>
                            <span className='text-muted-foreground'>No: {s.studentNumber}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        )}


        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleConfirmImport} disabled={isLoading || importedStudents.length === 0}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            {importedStudents.length > 0 ? `${importedStudents.length} Öğrenciyi Aktar` : 'Onayla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

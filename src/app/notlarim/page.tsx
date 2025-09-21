
'use client';

import * as React from 'react';
import AppLayout from '@/components/app-layout';
import { Plus, Trash2, StickyNote, Loader2, Mic, MicOff, Camera, X as CloseIcon, Pin, PinOff, Palette, CheckSquare, ClipboardPaste, Type as TypeIcon, Search, Image as ImageIcon, List as ListIcon, CaseSensitive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Note, NoteChecklistItem } from '@/lib/types';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import AuthGuard from '@/components/auth-guard';
import { useNotes } from '@/hooks/use-notes';
import { EditNoteDialog } from '@/components/edit-note-dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const noteColors = [
  'bg-card',
  'bg-rose-100 dark:bg-rose-900/30',
  'bg-orange-100 dark:bg-orange-900/30',
  'bg-yellow-100 dark:bg-yellow-900/30',
  'bg-lime-100 dark:bg-lime-900/30',
  'bg-teal-100 dark:bg-teal-900/30',
  'bg-sky-100 dark:bg-sky-900/30',
  'bg-blue-100 dark:bg-blue-900/30',
  'bg-violet-100 dark:bg-violet-900/30',
  'bg-pink-100 dark:bg-pink-900/30',
  'bg-stone-100 dark:bg-stone-900/30',
  'bg-slate-100 dark:bg-slate-900/30',
];
const textColors = ['#000000', '#FFFFFF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

const colorNames: { [key: string]: string } = {
    'bg-card': 'Varsayılan',
    'bg-rose-100 dark:bg-rose-900/30': 'Gül',
    'bg-orange-100 dark:bg-orange-900/30': 'Turuncu',
    'bg-yellow-100 dark:bg-yellow-900/30': 'Sarı',
    'bg-lime-100 dark:bg-lime-900/30': 'Misket Limonu',
    'bg-teal-100 dark:bg-teal-900/30': 'Cam Göbeği',
    'bg-sky-100 dark:bg-sky-900/30': 'Gök Mavisi',
    'bg-blue-100 dark:bg-blue-900/30': 'Mavi',
    'bg-violet-100 dark:bg-violet-900/30': 'Menekşe',
    'bg-pink-100 dark:bg-pink-900/30': 'Pembe',
    'bg-stone-100 dark:bg-stone-900/30': 'Taş',
    'bg-slate-100 dark:bg-slate-900/30': 'Kayrak',
};

function NotlarimPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    notes, 
    isLoading, 
    addNote, 
    deleteNote, 
    updateNote,
    isRecording,
    isTranscribing,
    handleToggleRecording 
  } = useNotes(user?.uid);
  
  const [newNoteTitle, setNewNoteTitle] = React.useState('');
  const [newNoteContent, setNewNoteContent] = React.useState('');
  const [newNoteImage, setNewNoteImage] = React.useState<string | null>(null);
  const [newNoteColor, setNewNoteColor] = React.useState(noteColors[0]);
  const [newNoteTextColor, setNewNoteTextColor] = React.useState(textColors[0]);
  const [newNoteType, setNewNoteType] = React.useState<'text' | 'checklist'>('text');
  const [newNoteItems, setNewNoteItems] = React.useState<NoteChecklistItem[]>([{ id: '1', text: '', isChecked: false }]);


  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [colorFilter, setColorFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');


  const filteredNotes = React.useMemo(() => {
    return notes.filter(note => {
      const searchMatch = (
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.items && note.items.some(item => item.text.toLowerCase().includes(searchTerm.toLowerCase())))
      );
      const colorMatch = colorFilter === 'all' || note.color === colorFilter;

      const typeMatch = typeFilter === 'all' ||
                        (typeFilter === 'text' && note.type === 'text' && !note.imageUrl) ||
                        (typeFilter === 'checklist' && note.type === 'checklist') ||
                        (typeFilter === 'image' && !!note.imageUrl);

      return searchMatch && colorMatch && typeMatch;
    });
  }, [notes, searchTerm, colorFilter, typeFilter]);

  React.useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Kamera Erişimi Reddedildi',
          description: 'Lütfen bu özelliği kullanmak için tarayıcı ayarlarından kamera izinlerini etkinleştirin.',
        });
      }
    };
    
    if (isCameraOpen) {
      getCameraPermission();
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [isCameraOpen, toast]);
  
  const resetForm = () => {
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteImage(null);
    setNewNoteColor(noteColors[0]);
    setNewNoteTextColor(textColors[0]);
    setNewNoteType('text');
    setNewNoteItems([{ id: '1', text: '', isChecked: false }]);
  };
  

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRecording) {
      await handleToggleRecording(() => {});
    }
    
    const isChecklistEmpty = newNoteItems.length === 0 || newNoteItems.every(item => item.text.trim() === '');
    if (newNoteTitle.trim() === '' && (newNoteType === 'text' ? newNoteContent.trim() === '' : isChecklistEmpty) && !newNoteImage) {
        toast({
            title: 'Boş Not',
            description: 'Lütfen bir başlık, içerik veya resim ekleyin.',
            variant: 'destructive',
        });
        return;
    }
    
    const newNoteData: Omit<Note, 'id'> = {
      title: newNoteTitle,
      content: newNoteType === 'text' ? newNoteContent : '',
      type: newNoteType,
      items: newNoteType === 'checklist' ? newNoteItems.filter(item => item.text.trim() !== '') : [],
      imageUrl: newNoteImage,
      color: newNoteColor,
      textColor: newNoteTextColor,
      isPinned: false,
      date: new Date().toISOString(),
    };
    
    await addNote(newNoteData);
    resetForm();
  };
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
    }
  };
  
  const handleUseImage = () => {
    if (capturedImage) {
        setNewNoteImage(capturedImage);
        setIsCameraOpen(false);
        setCapturedImage(null);
    }
  };

  const onVoiceNoteReceived = (noteText: string) => {
     if (newNoteType === 'text') {
        setNewNoteContent(prev => (prev ? prev + ' ' : '') + noteText);
    } else {
         setNewNoteItems(prevItems => {
            const lastItem = prevItems[prevItems.length - 1];
            if (lastItem && lastItem.text.trim() === '') {
                const updatedItems = [...prevItems];
                updatedItems[updatedItems.length - 1] = { ...lastItem, text: noteText.trim() };
                return updatedItems;
            } else {
                return [...prevItems, { id: Date.now().toString(), text: noteText.trim(), isChecked: false }];
            }
        });
    }
  }


  const handleUpdateNote = (noteId: string, data: Partial<Note>) => {
    updateNote(noteId, data);
    setEditingNote(null);
  }

  const handleTogglePin = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    updateNote(note.id, { isPinned: !note.isPinned });
  }

  const handleItemChange = (id: string, newText: string) => {
    setNewNoteItems(items => items.map(item => item.id === id ? { ...item, text: newText } : item));
  };
  
  const handleItemCheckedChange = (id: string, isChecked: boolean) => {
    setNewNoteItems(items => items.map(item => item.id === id ? { ...item, isChecked } : item));
  };

  const handleAddNewItem = () => {
    setNewNoteItems(items => [...items, { id: Date.now().toString(), text: '', isChecked: false }]);
  };
  
  const handleRemoveItem = (id: string) => {
      setNewNoteItems(items => items.filter(item => item.id !== id));
  }
  
  const handlePasteList = async () => {
    try {
        const text = await navigator.clipboard.readText();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const newItems: NoteChecklistItem[] = lines.map(line => ({
            id: Date.now().toString() + Math.random(),
            text: line,
            isChecked: false
        }));
        
        setNewNoteItems(prevItems => {
            const filteredOldItems = prevItems.filter(item => item.text.trim() !== '');
            return [...filteredOldItems, ...newItems];
        });

    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
        toast({ title: "Hata", description: "Pano içeriği okunamadı.", variant: "destructive" });
    }
  };


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
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        
        <Card className={cn("max-w-xl mx-auto shadow-lg transition-colors", newNoteColor)}>
          <form onSubmit={handleAddNote}>
            <CardContent className="p-2 space-y-2">
              {newNoteImage && (
                <div className="relative">
                    <img src={newNoteImage} alt="Eklenen resim" className="rounded-md w-full max-h-48 object-cover" />
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/30 hover:bg-black/50 text-white"
                        onClick={() => setNewNoteImage(null)}
                    >
                        <CloseIcon className="h-4 w-4" />
                    </Button>
                </div>
              )}
              <Input
                placeholder="Başlık"
                className={cn("text-base font-semibold border-0 focus-visible:ring-0 shadow-none px-4 bg-transparent placeholder:text-muted-foreground")}
                style={{ color: newNoteTextColor }}
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
              />
              {newNoteType === 'text' ? (
                <Textarea
                    placeholder="Bir not alın..."
                    className={cn("border-0 focus-visible:ring-0 shadow-none p-4 pt-0 bg-transparent placeholder:text-muted-foreground")}
                    style={{ color: newNoteTextColor }}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={newNoteImage || newNoteTitle ? 3 : 1}
                />
              ) : (
                <div className='p-4 pt-0 space-y-2'>
                    {newNoteItems.map(item => (
                        <div key={item.id} className="flex items-center gap-2 group">
                            <Checkbox 
                                id={`item-new-${item.id}`} 
                                checked={item.isChecked}
                                onCheckedChange={(checked) => handleItemCheckedChange(item.id, !!checked)}
                                style={{borderColor: newNoteTextColor}}
                            />
                            <Input 
                                value={item.text} 
                                onChange={(e) => handleItemChange(item.id, e.target.value)}
                                className={cn(
                                    "flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent px-1 placeholder:text-muted-foreground",
                                    item.isChecked && "line-through"
                                )}
                                style={{ 
                                    color: newNoteTextColor,
                                    textDecorationColor: newNoteTextColor
                                }}
                                placeholder='Liste öğesi'
                            />
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className={cn("h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/10")}
                                style={{color: newNoteTextColor}}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <div className='flex items-center gap-2 border-t pt-2' style={{borderColor: `${newNoteTextColor}40`}}>
                        <Button type="button" variant="ghost" onClick={handleAddNewItem} style={{color: newNoteTextColor}} className="opacity-70 hover:opacity-100 w-full justify-start">
                            <Plus className='mr-2 h-4 w-4'/> Öğe Ekle
                        </Button>
                         <Button type="button" variant="ghost" onClick={handlePasteList} style={{color: newNoteTextColor}} className="opacity-70 hover:opacity-100 w-full justify-start">
                            <ClipboardPaste className='mr-2 h-4 w-4'/> Yapıştır
                        </Button>
                    </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center p-2">
              <div className='flex items-center gap-1'>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => setNewNoteType(newNoteType === 'text' ? 'checklist' : 'text')}
                                    className={cn('text-muted-foreground hover:text-foreground rounded-full', newNoteType === 'checklist' && 'bg-primary/20 text-primary')}
                                >
                                    <CheckSquare/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Yapılacaklar Listesi</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => handleToggleRecording(onVoiceNoteReceived)}
                                    disabled={isTranscribing}
                                    className={cn('text-muted-foreground hover:text-foreground rounded-full', isRecording && "text-red-500 animate-pulse")}
                                >
                                    {isRecording ? <MicOff /> : isTranscribing ? <Loader2 className='animate-spin' /> : <Mic />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{isRecording ? 'Kaydı Durdur' : isTranscribing ? 'İşleniyor...' : 'Sesle Not Al'}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button type="button" variant="secondary" size="icon" onClick={() => setIsCameraOpen(true)} className='text-muted-foreground hover:text-foreground rounded-full' >
                                  <Camera />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Resim Ekle</p></TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                   <Popover>
                    <TooltipProvider>
                      <Tooltip>
                        <PopoverTrigger asChild>
                            <TooltipTrigger asChild>
                                <Button type="button" variant="secondary" size="icon" className='text-muted-foreground hover:text-foreground rounded-full'>
                                    <Palette />
                                </Button>
                            </TooltipTrigger>
                        </PopoverTrigger>
                          <TooltipContent><p>Arkaplan Rengi</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-7 gap-1">
                            {noteColors.map(color => (
                                <button key={color} type="button" onClick={() => setNewNoteColor(color)} className={cn("h-8 w-8 rounded-full border", color)} />
                            ))}
                        </div>
                      </PopoverContent>
                   </Popover>
                   <Popover>
                    <TooltipProvider>
                      <Tooltip>
                        <PopoverTrigger asChild>
                            <TooltipTrigger asChild>
                                <Button type="button" variant="secondary" size="icon" className='text-muted-foreground hover:text-foreground rounded-full'>
                                    <TypeIcon />
                                </Button>
                            </TooltipTrigger>
                        </PopoverTrigger>
                          <TooltipContent><p>Yazı Rengi</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-7 gap-1">
                            {textColors.map(color => (
                                <button key={color} type="button" onClick={() => setNewNoteTextColor(color)} className={cn("h-8 w-8 rounded-full border")} style={{backgroundColor: color}} />
                            ))}
                        </div>
                      </PopoverContent>
                   </Popover>
              </div>
              <Button type="submit" variant="ghost" style={{color: newNoteTextColor}}>Ekle</Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="mt-8">
            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                 <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Notlarda ara..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Türe Göre Filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Notlar</SelectItem>
                        <SelectItem value="text">
                           <div className='flex items-center gap-2'>
                             <CaseSensitive className='h-4 w-4' /> Metin
                           </div>
                        </SelectItem>
                         <SelectItem value="checklist">
                           <div className='flex items-center gap-2'>
                             <ListIcon className='h-4 w-4' /> Liste
                           </div>
                        </SelectItem>
                        <SelectItem value="image">
                            <div className='flex items-center gap-2'>
                             <ImageIcon className='h-4 w-4' /> Resimli
                           </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Select value={colorFilter} onValueChange={setColorFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Renge Göre Filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Renkler</SelectItem>
                        {noteColors.map((color) => (
                           <SelectItem key={color} value={color}>
                               <div className='flex items-center gap-2'>
                                   <div className={cn("h-4 w-4 rounded-full border", color)}></div>
                                   {colorNames[color] || 'Bilinmeyen'}
                               </div>
                           </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

        {filteredNotes.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 mt-8">
            {filteredNotes.map((note) => {
              const sortedItems = note.items ? [...note.items].sort((a, b) => a.isChecked === b.isChecked ? 0 : a.isChecked ? 1 : -1) : [];
              return (
              <Card
                key={note.id}
                onClick={() => setEditingNote(note)}
                className={cn('flex flex-col break-inside-avoid min-w-0 group cursor-pointer transition-shadow hover:shadow-lg', note.color)}
              >
                <CardHeader className="p-0">
                   {note.imageUrl && <img src={note.imageUrl} alt="Not resmi" className="rounded-t-lg w-full object-cover max-h-60" />}
                </CardHeader>
                <CardContent className={cn("p-4 flex-grow", !note.title && !note.content && (!note.items || note.items.length === 0) ? 'hidden' : 'block', note.imageUrl && "pt-4")} style={{color: note.textColor}}>
                  <div className="max-h-60 overflow-y-auto no-scrollbar">
                    {note.title && <h3 className='font-bold mb-2'>{note.title}</h3>}
                    
                    {note.type === 'checklist' && note.items && note.items.length > 0 ? (
                      <ul className='space-y-2'>
                          {sortedItems.map(item => (
                              <li key={item.id} className='flex items-start gap-3'>
                                  <Checkbox id={`item-${item.id}`} checked={item.isChecked} style={{borderColor: note.textColor}} />
                                  <label htmlFor={`item-${item.id}`} className={cn('flex-1 text-sm break-all', item.isChecked && 'line-through opacity-60')}>{item.text}</label>
                              </li>
                          ))}
                      </ul>
                    ) : (
                      <p className='text-sm whitespace-pre-wrap break-all'>{note.content}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center text-xs p-2 mt-auto" style={{color: note.textColor}}>
                  <span className='pl-2 opacity-70'>{format(new Date(note.date), 'dd MMM')}</span>
                  <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity'>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => handleTogglePin(e, note)} className="text-muted-foreground hover:text-foreground">
                                    {note.isPinned ? <PinOff className='h-4 w-4 text-primary'/> : <Pin className='h-4 w-4'/>}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{note.isPinned ? 'Sabitlemeyi Kaldır' : 'Başa Sabitle'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Notu silmek istediğinize emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu işlem geri alınamaz. Not kalıcı olarak silinecektir.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(note.id);
                              }}
                              className="bg-destructive hover:bg-destructive/90">
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            )}
            )}
          </div>
        ) : (
          <div className="text-center p-12 border-2 border-dashed rounded-lg mt-8 max-w-xl mx-auto">
            <StickyNote className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
                {notes.length === 0 ? 'Henüz notunuz yok' : 'Arama kriterlerine uygun not bulunamadı'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {notes.length === 0 ? 'Yukarıdaki alandan ilk notunuzu ekleyerek başlayın.' : 'Arama terimini veya filtreyi değiştirmeyi deneyin.'}
            </p>
          </div>
        )}
      </main>
      
      {editingNote && (
        <EditNoteDialog
            key={editingNote.id}
            note={editingNote}
            onUpdate={handleUpdateNote}
            onClose={() => setEditingNote(null)}
            isOpen={!!editingNote}
        />
      )}
      
      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kameradan Fotoğraf Ekle</DialogTitle>
            <DialogDescription>
                Notunuza eklemek için bir fotoğraf çekin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>Kamera İzni Gerekli</AlertTitle>
                  <AlertDescription>
                    Bu özelliği kullanmak için lütfen kamera erişimine izin verin.
                  </AlertDescription>
                </Alert>
            )}
            <div className="bg-black rounded-md overflow-hidden aspect-video flex items-center justify-center">
              {capturedImage ? (
                <img src={capturedImage} alt="Yakalanan Görüntü" className="w-full h-auto"/>
              ) : (
                 <video ref={videoRef} className="w-full h-auto" autoPlay muted playsInline />
              )}
               <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
          <DialogFooter>
            {capturedImage ? (
                <>
                    <Button variant="outline" onClick={() => setCapturedImage(null)}>Tekrar Çek</Button>
                    <Button onClick={handleUseImage}>Fotoğrafı Kullan</Button>
                </>
            ) : (
                <Button onClick={handleCapture} disabled={!hasCameraPermission}>Fotoğraf Çek</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export default function NotlarimPage() {
    return (
        <AuthGuard>
            <NotlarimPageContent />
        </AuthGuard>
    )
}

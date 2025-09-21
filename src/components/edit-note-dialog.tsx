
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Note, NoteChecklistItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Palette, Trash2, Plus, CheckSquare, ClipboardPaste, Type as TypeIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from './ui/checkbox';

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

const formSchema = z.object({
  title: z.string(),
  content: z.string().optional(),
  color: z.string(),
  textColor: z.string(),
  type: z.enum(['text', 'checklist']),
  items: z.array(z.object({
      id: z.string(),
      text: z.string(),
      isChecked: z.boolean(),
  })).optional()
});

type EditNoteFormValues = z.infer<typeof formSchema>;

type EditNoteDialogProps = {
  note: Note;
  onUpdate: (noteId: string, data: Partial<Note>) => void;
  onClose: () => void;
  isOpen: boolean;
};


export function EditNoteDialog({ note, onUpdate, onClose, isOpen }: EditNoteDialogProps) {
  const { toast } = useToast();

  const form = useForm<EditNoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: note.title,
      content: note.content,
      color: note.color,
      textColor: note.textColor || textColors[0],
      type: note.type,
      items: note.items || [],
    },
  });

  const watchColor = form.watch('color');
  const watchTextColor = form.watch('textColor');
  const watchType = form.watch('type');
  const watchItems = form.watch('items');

  React.useEffect(() => {
    if (note) {
      form.reset({
        title: note.title,
        content: note.content,
        color: note.color,
        textColor: note.textColor || textColors[0],
        type: note.type || 'text',
        items: note.items || []
      });
    }
  }, [note, form]);

  const handleSubmit = (values: EditNoteFormValues) => {
    // Clear content if it's a checklist, and items if it's text
    if (values.type === 'checklist') {
        values.content = '';
    } else {
        values.items = [];
    }
    
    if (values.type === 'text' && !values.title && !values.content) {
        toast({ title: "Boş Not", description: "Lütfen bir başlık veya içerik girin.", variant: "destructive" });
        return;
    }
    const isChecklistEmpty = !values.items || values.items.every(item => !item.text.trim());
    if (values.type === 'checklist' && !values.title && isChecklistEmpty) {
        toast({ title: "Boş Not", description: "Lütfen bir başlık veya en az bir liste öğesi girin.", variant: "destructive" });
        return;
    }

    onUpdate(note.id, values);
  };
  
  const handleItemChange = (id: string, newText: string) => {
    form.setValue('items', watchItems?.map(item => item.id === id ? { ...item, text: newText } : item), { shouldDirty: true });
  };
  
  const handleItemCheckedChange = (id: string, isChecked: boolean) => {
    form.setValue('items', watchItems?.map(item => item.id === id ? { ...item, isChecked } : item), { shouldDirty: true });
  };

  const handleAddNewItem = () => {
    form.setValue('items', [...(watchItems || []), { id: Date.now().toString(), text: '', isChecked: false }], { shouldDirty: true });
  };
  
  const handleRemoveItem = (id: string) => {
      form.setValue('items', watchItems?.filter(item => item.id !== id), { shouldDirty: true });
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
        
        form.setValue('items', [...(watchItems || []).filter(i => i.text.trim() !== ''), ...newItems], { shouldDirty: true });

    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
        toast({ title: "Hata", description: "Pano içeriği okunamadı.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-xl p-0", watchColor)}>
        <DialogHeader className="sr-only">
            <DialogTitle>Notu Düzenle</DialogTitle>
            <DialogDescription>Notun başlığını, içeriğini ve rengini düzenleyin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="p-6 space-y-4">
              <input
                {...form.register('title')}
                placeholder="Başlık"
                className={cn("w-full text-lg font-semibold border-0 shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground")}
                style={{ color: watchTextColor }}
              />
              {watchType === 'text' ? (
                <Textarea
                    {...form.register('content')}
                    placeholder="Bir not alın..."
                    rows={8}
                    className={cn("w-full border-0 shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground")}
                    style={{ color: watchTextColor }}
                />
              ) : (
                <div className='space-y-2'>
                    {(watchItems || []).map(item => (
                        <div key={item.id} className="flex items-center gap-2 group">
                            <Checkbox 
                                id={`item-edit-${item.id}`} 
                                checked={item.isChecked}
                                onCheckedChange={(checked) => handleItemCheckedChange(item.id, !!checked)}
                                style={{borderColor: watchTextColor}}
                            />
                            <Input 
                                value={item.text} 
                                onChange={(e) => handleItemChange(item.id, e.target.value)}
                                className={cn(
                                    "flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent px-1 placeholder:text-muted-foreground",
                                    item.isChecked && "line-through"
                                )}
                                style={{ 
                                    color: watchTextColor,
                                    textDecorationColor: watchTextColor
                                }}
                                placeholder='Liste öğesi'
                            />
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/10"
                                style={{color: watchTextColor}}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <div className='flex items-center gap-2 border-t pt-2' style={{borderColor: `${watchTextColor}40`}}>
                        <Button type="button" variant="ghost" onClick={handleAddNewItem} style={{color: watchTextColor}} className="opacity-70 hover:opacity-100 w-full justify-start">
                            <Plus className='mr-2 h-4 w-4'/> Öğe Ekle
                        </Button>
                        <Button type="button" variant="ghost" onClick={handlePasteList} style={{color: watchTextColor}} className="opacity-70 hover:opacity-100 w-full justify-start">
                            <ClipboardPaste className='mr-2 h-4 w-4'/> Yapıştır
                        </Button>
                    </div>
                </div>
              )}
            </div>
            <DialogFooter className="p-4 pt-0 mt-4 flex justify-between items-center bg-transparent">
                <div className='flex items-center gap-1'>
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() => form.setValue('type', watchType === 'text' ? 'checklist' : 'text')}
                        className={cn('text-muted-foreground hover:text-foreground rounded-full', watchType === 'checklist' && 'bg-primary/20 text-primary')}
                    >
                        <CheckSquare />
                    </Button>
                   <Popover>
                      <PopoverTrigger asChild>
                          <Button type="button" variant="secondary" size="icon" className='text-muted-foreground hover:text-foreground rounded-full'>
                              <Palette />
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-7 gap-1">
                            {noteColors.map(color => (
                                <button key={color} type="button" onClick={() => form.setValue('color', color)} className={cn("h-8 w-8 rounded-full border", color)} />
                            ))}
                        </div>
                      </PopoverContent>
                   </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                          <Button type="button" variant="secondary" size="icon" className='text-muted-foreground hover:text-foreground rounded-full'>
                              <TypeIcon />
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-7 gap-1">
                            {textColors.map(color => (
                                <button key={color} type="button" onClick={() => form.setValue('textColor', color)} className={cn("h-8 w-8 rounded-full border")} style={{backgroundColor: color}} />
                            ))}
                        </div>
                      </PopoverContent>
                   </Popover>
               </div>
               <div>
                  <Button type="button" variant="ghost" onClick={onClose} style={{color: watchTextColor}} className="opacity-70 hover:opacity-100">
                    Kapat
                  </Button>
                  <Button type="submit">Değişiklikleri Kaydet</Button>
               </div>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}



'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import type { LessonPlanEntry } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';


type PlanViewerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entries: LessonPlanEntry[];
  startWeek?: number;
};

type ViewMode = 'kazanim' | 'konu' | 'aciklamalar' | 'yontem-teknik' | 'olcme-degerlendirme';

export function PlanViewer({ isOpen, onClose, title, entries, startWeek = 1 }: PlanViewerProps) {
    const [currentWeekIndex, setCurrentWeekIndex] = React.useState(0);
    const [viewMode, setViewMode] = React.useState<ViewMode>('kazanim');
    const [activeTab, setActiveTab] = React.useState<string>('kazanim');

    React.useEffect(() => {
        if(isOpen && entries.length > 0) {
            // Find the index that corresponds to the startWeek.
            const initialIndex = entries.findIndex(entry => 
                entry.week && (
                    entry.week.toString() === startWeek.toString() ||
                    entry.week.toString().startsWith(`${startWeek}.`)
                )
            );
            
            setCurrentWeekIndex(initialIndex !== -1 ? initialIndex : Math.min(startWeek -1, entries.length -1));
            setViewMode('kazanim');
            setActiveTab('kazanim');
        }
    }, [isOpen, startWeek, entries]);

    if (!isOpen || !entries.length) return null;
    
    const currentEntry = entries[currentWeekIndex] || entries[0];

    const menuItems: { id: ViewMode, label: string, value: string | undefined | null }[] = [
        { id: 'aciklamalar', label: 'Açıklamalar', value: currentEntry.objectiveExplanation },
        { id: 'yontem-teknik', label: 'Yöntem ve Teknikler', value: currentEntry.methods },
        { id: 'olcme-degerlendirme', label: 'Ölçme ve Değerlendirme', value: currentEntry.assessment },
    ];
    
    const handleNextWeek = () => {
        setCurrentWeekIndex(prev => Math.min(prev + 1, entries.length - 1));
    };

    const handlePrevWeek = () => {
        setCurrentWeekIndex(prev => Math.max(0, prev - 1));
    };
    
    const handleMenuSelect = (mode: ViewMode) => {
        setViewMode(mode);
        setActiveTab('menu-item');
    }

    const handleTabChange = (value: string) => {
        setViewMode(value as ViewMode);
        setActiveTab(value);
    }
    
    const renderContent = () => {
        switch (viewMode) {
            case 'kazanim': return currentEntry.objective;
            case 'konu': return currentEntry.topic;
            case 'aciklamalar': return currentEntry.objectiveExplanation;
            case 'yontem-teknik': return currentEntry.methods;
            case 'olcme-degerlendirme': return currentEntry.assessment;
            default: return 'İçerik bulunmuyor.';
        }
    };
    
    const getActiveTitle = () => {
        switch (viewMode) {
            case 'kazanim': return 'Kazanım';
            case 'konu': return 'Konu (Alt Öğrenme Alanı)';
            default: return menuItems.find(item => item.id === viewMode)?.label || 'Detay';
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md w-full h-full md:h-auto md:max-h-[90vh] flex flex-col p-4 md:p-6">
                <DialogHeader>
                    <DialogTitle className='text-lg'>{title}</DialogTitle>
                    <DialogDescription>
                        {currentEntry.unit}
                    </DialogDescription>
                </DialogHeader>
                
                <div className='flex-1 overflow-y-auto pr-2 space-y-4'>
                    <div className='flex items-center justify-between'>
                         <Tabs value={activeTab} onValueChange={handleTabChange}>
                            <TabsList>
                                <TabsTrigger value="kazanim">Kazanım</TabsTrigger>
                                <TabsTrigger value="konu">Konu</TabsTrigger>
                                {activeTab === 'menu-item' && (
                                    <TabsTrigger value="menu-item" className="hidden data-[state=active]:flex">{getActiveTitle()}</TabsTrigger>
                                )}
                            </TabsList>
                         </Tabs>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <List className='h-5 w-5'/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {menuItems.map(item => (
                                    <DropdownMenuItem key={item.id} onSelect={() => handleMenuSelect(item.id)}>
                                        {item.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                         </DropdownMenu>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className='text-base'>{getActiveTitle()}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm whitespace-pre-wrap">{renderContent() || 'İçerik bulunmuyor.'}</p>
                        </CardContent>
                    </Card>
                </div>


                <DialogFooter className="pt-4 border-t flex flex-row items-center justify-center w-full">
                    <div className='flex items-center gap-2'>
                        <Button variant="outline" size="sm" onClick={handlePrevWeek} disabled={currentWeekIndex === 0}>
                            <ChevronLeft className="mr-1 h-4 w-4" /> Önceki
                        </Button>
                        <span className="font-semibold text-sm tabular-nums">
                           {currentEntry.week || `${currentWeekIndex + 1}. Hafta`}
                        </span>
                        <Button variant="outline" size="sm" onClick={handleNextWeek} disabled={currentWeekIndex === entries.length - 1}>
                           Sonraki <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


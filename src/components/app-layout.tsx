
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Users,
    BarChart,
    Calendar,
    GraduationCap,
    Settings,
    Home,
    LogOut,
    Menu,
    StickyNote,
    ShieldCheck,
    MessageSquare,
    Bot,
    Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useAuth } from '@/hooks/use-auth';
import { useFCM } from '@/hooks/use-fcm';
import { useReminders } from '@/hooks/use-reminders';
import { differenceInHours, isPast } from 'date-fns';
import { Badge } from './ui/badge';
import type { Urgency } from '@/lib/types';


const baseMenuItems = [
    { href: '/anasayfa', label: 'Ana Sayfa', icon: Home },
    { href: '/gunluk-takip', label: 'Günlük Takip', icon: Users },
    { href: '/siniflarim', label: 'Sınıflarım', icon: GraduationCap },
    { href: '/raporlar', label: 'Raporlar', icon: BarChart },
    { href: '/planlarim', label: 'Planlarım', icon: Calendar },
    { href: '/hatirlaticilar', label: 'Hatırlatıcılar', icon: Bell },
    { href: '/notlarim', label: 'Notlarım', icon: StickyNote },
    { href: '/forum', label: 'Forum', icon: MessageSquare },
    { href: '/yapay-zeka', label: 'Yapay Zeka', icon: Bot },
];

const NavContent = ({ onLinkClick, notificationCount, urgency }: { onLinkClick?: () => void, notificationCount: number, urgency: Urgency }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const { profile } = useUserProfile(user?.uid);
    const { logOut } = useAuth();
    const { toast } = useToast();
    
    const handleLogout = async () => {
        try {
            await logOut();
            toast({
                title: 'Çıkış Yapıldı',
                description: 'Giriş sayfasına yönlendiriliyorsunuz.',
            });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            toast({
                title: 'Hata',
                description: 'Çıkış yapılırken bir sorun oluştu.',
                variant: 'destructive',
            });
        }
    };
    
    const badgeVariant = {
        pastDue: 'destructive',
        veryUrgent: 'destructive',
        urgent: 'warning',
        info: 'info',
        none: 'destructive' // Should not happen if count > 0
    }[urgency] as "destructive" | "warning" | "info";


    return (
        <div className="flex h-full max-h-screen flex-col">
            <div className="flex h-[60px] items-center border-b px-6">
                <Link href="/anasayfa" className="flex items-center gap-2 font-semibold text-lg" onClick={onLinkClick}>
                    <GraduationCap className="h-6 w-6 text-primary" />
                    <span>SınıfPlanım</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
                <nav className="grid items-start px-4 py-4 text-sm font-medium">
                    {baseMenuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onLinkClick}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary',
                                pathname.startsWith(item.href) ? 'bg-primary/10 text-primary' : ''
                            )}
                        >
                            <div className='relative'>
                                <item.icon className="h-5 w-5" />
                                {item.icon === Bell && notificationCount > 0 && (
                                     <Badge variant={badgeVariant} className="absolute -top-1 -right-2 h-4 w-4 justify-center rounded-full p-0 text-[10px]">
                                        {notificationCount}
                                     </Badge>
                                )}
                            </div>
                            {item.label}
                        </Link>
                    ))}
                    {profile?.role === 'admin' && (
                         <Link
                            href="/admin"
                            onClick={onLinkClick}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive',
                                pathname.startsWith('/admin') ? 'bg-destructive/10 text-destructive' : ''
                            )}
                        >
                            <ShieldCheck className="h-5 w-5" />
                            Admin Paneli
                        </Link>
                    )}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t">
                 <nav className="grid items-start gap-2 px-2 text-sm font-medium">
                    <Link
                        href="/ayarlar"
                        onClick={onLinkClick}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary',
                            pathname.startsWith('/ayarlar') ? 'bg-primary/10 text-primary' : ''
                        )}
                        >
                        <Settings className="h-5 w-5" />
                        Ayarlar
                    </Link>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive')}>
                                <LogOut className="h-5 w-5" />
                                Çıkış Yap
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Çıkış Yapmak Üzere misiniz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Oturumu sonlandırmak istediğinizden emin misiniz? Tekrar giriş yapmanız gerekecektir.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
                                    Evet, Çıkış Yap
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </nav>
            </div>
        </div>
    );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { profile } = useUserProfile(user?.uid);
    const { reminders } = useReminders(user?.uid);
    const [notificationCount, setNotificationCount] = React.useState(0);
    const [urgency, setUrgency] = React.useState<Urgency>('none');
    const [open, setOpen] = React.useState(false);
    
    // Initialize FCM
    useFCM();

    React.useEffect(() => {
        const calculateNotifications = () => {
            const now = new Date();
            const upcomingReminders = reminders.filter(r => !r.isCompleted);
            
            let count = 0;
            let mostUrgent: Urgency = 'none';
            const urgencyOrder: Urgency[] = ['none', 'info', 'urgent', 'veryUrgent', 'pastDue'];

            for (const reminder of upcomingReminders) {
                const dueDate = new Date(reminder.dueDate);
                if (reminder.time) {
                    const [hours, minutes] = reminder.time.split(':');
                    dueDate.setHours(parseInt(hours), parseInt(minutes));
                } else {
                    dueDate.setHours(0, 0, 0, 0);
                }
                
                // Continue if the due date is more than 3 days away
                const hoursUntilDue = differenceInHours(dueDate, now);
                if (hoursUntilDue > 72) continue;

                let currentUrgency: Urgency = 'none';

                if (isPast(dueDate)) {
                    currentUrgency = 'pastDue';
                } else if (hoursUntilDue < 24) {
                    currentUrgency = 'veryUrgent'; // Less than 1 day
                } else if (hoursUntilDue < 48) {
                    currentUrgency = 'urgent'; // Less than 2 days
                } else if (hoursUntilDue < 72) {
                    currentUrgency = 'info'; // Less than 3 days
                }

                if (currentUrgency !== 'none') {
                    count++;
                    if (urgencyOrder.indexOf(currentUrgency) > urgencyOrder.indexOf(mostUrgent)) {
                        mostUrgent = currentUrgency;
                    }
                }
            }
            setNotificationCount(count);
            setUrgency(count > 0 ? mostUrgent : 'none');
        };

        calculateNotifications();
        const interval = setInterval(calculateNotifications, 60000);
        return () => clearInterval(interval);
    }, [reminders]);

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-card md:block">
                <NavContent notificationCount={notificationCount} urgency={urgency} />
            </div>
            <div className="flex flex-col">
                <header className="flex h-[60px] items-center gap-4 border-b bg-card px-6">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Menüyü aç/kapat</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0 w-full max-w-[280px]">
                            <SheetHeader className='sr-only'>
                                <SheetTitle>Ana Menü</SheetTitle>
                                <SheetDescription>
                                    Uygulama içinde gezinmek için bu menüyü kullanın.
                                </SheetDescription>
                            </SheetHeader>
                             <NavContent onLinkClick={() => setOpen(false)} notificationCount={notificationCount} urgency={urgency} />
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1" />
                    <Link href="/ayarlar">
                        <Avatar>
                            <AvatarImage src={profile?.avatarUrl} alt={profile?.fullName} data-ai-hint="teacher portrait" />
                            <AvatarFallback>{profile?.fullName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                    </Link>
                </header>
                <div className="flex-1 overflow-auto bg-background">
                    {children}
                </div>
            </div>
        </div>
    );
}

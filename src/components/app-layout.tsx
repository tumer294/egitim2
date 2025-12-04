
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
    Vote,
    BookOpen,
    FilePenLine,
    Library,
    Trophy,
    Code,
    Sparkles,
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
import type { Urgency, Reminder } from '@/lib/types';
import { Separator } from './ui/separator';
import { useTheme } from 'next-themes';
import { FirebaseErrorListener } from './FirebaseErrorListener';

const menuGroups = [
    {
        title: "Kütüphane",
        items: [
            { href: '/anasayfa', label: 'Ana Sayfa', icon: Home },
            { href: '/siniflarim', label: 'Sınıflarım', icon: GraduationCap },
            { href: '/gunluk-takip', label: 'Günlük Takip', icon: Users },
            { href: '/raporlar', label: 'Raporlar', icon: BarChart },
            { href: '/planlarim', label: 'Planlarım', icon: Calendar },
        ]
    },
    {
        title: "Yapay Zeka",
        items: [
             { href: '/yapay-zeka', label: 'Asistan', icon: Bot },
             { href: '/hatirlaticilar', label: 'Akıllı Hatırlatıcı', icon: Sparkles },
        ]
    },
    {
        title: "Öğretmen Kaynakları",
        items: [
            { href: '/notlarim', label: 'Notlarım', icon: StickyNote },
            { href: '/forum', label: 'Forum', icon: MessageSquare },
            { href: '/anket', label: 'Anketler', icon: Vote },
        ]
    },
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
        <div className="flex h-full max-h-screen flex-col bg-[var(--sidebar-background)] text-[var(--sidebar-foreground)]">
            <div className="flex h-14 items-center border-b px-4" style={{ borderColor: 'hsl(var(--border) / 0.5)'}}>
                <Link href="/anasayfa" className="flex items-center gap-2 font-semibold text-lg" onClick={onLinkClick}>
                    <GraduationCap className="h-6 w-6 text-[var(--sidebar-primary)]" />
                    <span className="font-bold">SınıfPlanım</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
                <nav className="grid items-start p-2 text-sm font-medium">
                    {menuGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="py-2">
                             {group.title && (
                                <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider">{group.title}</h3>
                            )}
                            {group.items.map((item) => {
                                const isActive = item.href === '/anasayfa' ? pathname === item.href : pathname.startsWith(item.href);
                                return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onLinkClick}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[var(--sidebar-foreground)] opacity-90 transition-all hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] hover:opacity-100',
                                        isActive && 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] opacity-100 hover:bg-[var(--sidebar-primary)]/90 hover:text-[var(--sidebar-primary-foreground)]'
                                    )}
                                >
                                    <div className='relative'>
                                        <item.icon className="h-5 w-5" />
                                        {item.href === '/hatirlaticilar' && notificationCount > 0 && (
                                            <Badge variant={badgeVariant} className="absolute -top-1 -right-2 h-4 w-4 justify-center rounded-full p-0 text-[10px]">
                                                {notificationCount}
                                            </Badge>
                                        )}
                                    </div>
                                    {item.label}
                                </Link>
                            )})}
                        </div>
                    ))}
                    {profile?.role === 'admin' && (
                        <div className='py-2'>
                             <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider">Yönetim</h3>
                             <Link
                                href="/admin"
                                onClick={onLinkClick}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-destructive/80 transition-all hover:bg-destructive/10 hover:text-destructive',
                                    pathname.startsWith('/admin') ? 'bg-destructive/10 text-destructive' : ''
                                )}
                            >
                                <ShieldCheck className="h-5 w-5" />
                                Admin Paneli
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t" style={{ borderColor: 'hsl(var(--border) / 0.5)'}}>
                 <nav className="grid items-start gap-1 px-2 text-sm font-medium">
                     <Link
                        href="/paketler"
                        onClick={onLinkClick}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[var(--sidebar-foreground)] opacity-90 transition-all hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] hover:opacity-100',
                             pathname.startsWith('/paketler') ? 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] opacity-100 hover:bg-[var(--sidebar-primary)]/90 hover:text-[var(--sidebar-primary-foreground)]' : ''
                        )}
                        >
                        <Trophy className="h-5 w-5" />
                        Paketler
                    </Link>
                    <Link
                        href="/ayarlar"
                        onClick={onLinkClick}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[var(--sidebar-foreground)] opacity-90 transition-all hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] hover:opacity-100',
                             pathname.startsWith('/ayarlar') ? 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] opacity-100 hover:bg-[var(--sidebar-primary)]/90 hover:text-[var(--sidebar-primary-foreground)]' : ''
                        )}
                        >
                        <Settings className="h-5 w-5" />
                        Ayarlar
                    </Link>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-destructive/80 transition-all hover:bg-destructive/10 hover:text-destructive')}>
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
    const { notificationCount, urgency } = useReminders(user?.uid);
    const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
    const { theme } = useTheme();

    // Initialize FCM
    useFCM();

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
            <FirebaseErrorListener />
            <div className="hidden border-r bg-sidebar md:block">
                <NavContent notificationCount={notificationCount} urgency={urgency} />
            </div>
            <div className="flex flex-col">
                <header className={cn(
                    "flex h-14 items-center gap-4 px-4 md:hidden",
                    theme === 'light'
                        ? 'bg-background border-b'
                        : 'bg-primary border-primary'
                )}>
                     <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn(
                                theme !== 'light' && 'text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground'
                            )}>
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0 w-full max-w-[280px]">
                             <SheetHeader className="sr-only">
                                <SheetTitle>Menü</SheetTitle>
                                <SheetDescription>Ana gezinme menüsü</SheetDescription>
                             </SheetHeader>
                             <NavContent onLinkClick={() => setIsMobileSheetOpen(false)} notificationCount={notificationCount} urgency={urgency} />
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
                <div className="flex-1 overflow-auto bg-muted/40 relative">
                    {children}
                </div>
            </div>
        </div>
    );
}


'use client';
import * as React from 'react';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, Sparkles, Trophy, UserCheck, X } from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';


const tiers = {
    free: { name: 'Temel', credits: 10, price: 'Ücretsiz', features: ['10 AI Kredisi/Yıl', 'Temel Raporlama'] },
    standard: { name: 'Standart', credits: 100, price: '199,99 TL / Yıllık', features: ['100 AI Kredisi/Yıl', 'Gelişmiş Raporlama', 'Öncelikli Destek'] },
    pro: { name: 'Pro', credits: 500, price: '399,99 TL / Yıllık', features: ['500 AI Kredisi/Yıl', 'Tüm Raporlama Özellikleri', 'Özelleştirilebilir Planlar', '7/24 Destek'] }
};

type TierKey = keyof typeof tiers;

function PaketlerPageContent() {
    const { user } = useAuth();
    const { profile, updateProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = React.useState(false);

    const handleUpgrade = async (newTier: UserRole) => {
        if (!profile) return;
        setIsUpdating(true);
        try {
            await updateProfile({ ...profile, tier: newTier });
            toast({
                title: 'İstek Gönderildi!',
                description: 'Paket yükseltme isteğiniz yönetici onayına gönderildi.',
            });
        } catch (error: any) {
            toast({
                title: 'Hata',
                description: 'Paket güncellenirken bir sorun oluştu: ' + error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUpdating(false);
        }
    };
    
    // Determine the currently *active* tier for quota calculation
    const activeTierKey = (profile?.tier && !profile.tier.startsWith('pending-') ? profile.tier : 'free') as TierKey;

    // Determine the tier name to display in the usage card
    const displayTierName = tiers[activeTierKey]?.name || 'Temel';
    
    const usage = profile?.aiUsageCount || 0;
    const limit = tiers[activeTierKey]?.credits || 10;
    const usagePercentage = limit > 0 ? (usage / limit) * 100 : 0;
    
    const isLoading = isProfileLoading || isUpdating;

    return (
        <AppLayout>
            <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Trophy className="h-8 w-8 text-primary" />
                            Abonelik Paketleri
                        </h2>
                        <p className="text-muted-foreground">
                            İhtiyaçlarınıza en uygun paketi seçin ve SınıfPlanım'ın tüm potansiyelini ortaya çıkarın.
                        </p>
                    </div>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Sparkles className='h-5 w-5'/>Yapay Zeka Kullanım Durumu</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex justify-between items-center mb-2">
                            <span className='text-sm text-muted-foreground'>
                                Mevcut Paket: <span className='font-bold text-primary'>{displayTierName}</span>
                            </span>
                            <span className='font-bold'>{usage} / {limit}</span>
                         </div>
                         <Progress value={usagePercentage} />
                         {profile?.tierStartDate && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Üyelik Başlangıcı: {format(parseISO(profile.tierStartDate), 'dd MMMM yyyy', { locale: tr })}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                    {Object.keys(tiers).map(tierKey => {
                        const tier = tiers[tierKey as TierKey];
                        const isCurrent = profile?.tier === tierKey;
                        const isPending = profile?.tier === `pending-${tierKey}`;
                        
                        return (
                             <Card key={tierKey} className={cn("flex flex-col border-2", isCurrent ? "border-primary shadow-lg" : "border-transparent")}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className='text-2xl'>{tier.name}</CardTitle>
                                        {isCurrent && <Badge variant="default" className="flex items-center gap-1.5"><UserCheck className='h-4 w-4'/>Mevcut Paket</Badge>}
                                        {isPending && <Badge variant="secondary">Onay Bekliyor</Badge>}
                                    </div>
                                    <CardDescription className='pt-2'>{tierKey === 'free' ? 'Platformu keşfetmek ve temel özellikleri denemek için harika bir başlangıç.' : tierKey === 'standard' ? 'Daha fazla özellik ve daha yüksek limitler.' : 'Tüm özelliklere sınırsız erişim.'}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="text-4xl font-bold">{tier.price}</div>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {tier.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    {isCurrent || isPending || tierKey === 'free' ? (
                                        <Button className="w-full" disabled>
                                            {isCurrent ? 'Mevcut Paketiniz' : isPending ? 'Onay Bekleniyor' : 'Temel Paket'}
                                        </Button>
                                    ) : (
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button className="w-full" variant={'default'} disabled={isLoading}>
                                                     {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin'/>}
                                                    Satın Al
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Paket Yükseltme ve Ödeme</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        "{tier.name}" paketine geçmek için lütfen aşağıdaki banka hesabına ödemeyi yapın ve ardından "Ödemeyi Yaptım, Onaya Gönder" butonuna tıklayın.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <div className='py-4 space-y-3 text-sm'>
                                                    <p><strong>Banka:</strong> Ziraat Bankası</p>
                                                    <p><strong>Alıcı:</strong> Rahmi Aksu</p>
                                                    <p><strong>IBAN:</strong> TR12 3456 7890 1234 5678 9012 34</p>
                                                    <p className='font-semibold'>Lütfen açıklama kısmına kayıtlı e-posta adresinizi yazmayı unutmayın.</p>
                                                </div>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleUpgrade(`pending-${tierKey}` as UserRole)}>
                                                        Ödemeyi Yaptım, Onaya Gönder
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </main>
        </AppLayout>
    );
}

export default function PaketlerPage() {
    return (
        <AuthGuard>
            <PaketlerPageContent />
        </AuthGuard>
    )
}

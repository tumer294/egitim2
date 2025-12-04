
'use client';

import * as React from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Book,
  MapPin,
  Camera,
  Loader2,
  Globe,
  Moon,
  Sun,
  Droplets,
  Trees,
  Sunset,
  Milestone,
  Binary,
  Sparkle,
  Gem,
  Palette,
  KeyRound,
  Copy,
  GlassWater,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EditProfileForm } from '@/components/edit-profile-form';
import { useToast } from '@/hooks/use-toast';
import { ChangePasswordForm } from '@/components/change-password-form';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { UserProfile } from '@/hooks/use-user-profile';
import { useAuth } from '@/hooks/use-auth';
import AuthGuard from '@/components/auth-guard';
import { useTheme } from 'next-themes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';


function AyarlarPageContent() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { profile, updateProfile, isLoading } = useUserProfile(user?.uid);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
  }, [profile?.theme, setTheme]);


  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    if (!user?.uid) return;
    updateProfile(updatedProfile);
    toast({
      title: 'Profil Güncellendi!',
      description: 'Bilgileriniz başarıyla kaydedildi.',
    });
    setIsEditing(false);
  };
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile || !user?.uid) return;

    // Simple check for image type
    if (!file.type.startsWith('image/')) {
        toast({
            title: "Geçersiz Dosya Türü",
            description: "Lütfen bir resim dosyası seçin.",
            variant: "destructive",
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        updateProfile({ ...profile, avatarUrl: dataUrl });
        toast({
            title: "Profil Resmi Güncellendi!",
            description: "Yeni resminiz başarıyla kaydedildi.",
        });
    };
    reader.onerror = () => {
        toast({
            title: "Hata",
            description: "Dosya okunurken bir hata oluştu.",
            variant: "destructive",
        });
    };
    reader.readAsDataURL(file);
  };
  
  const handlePasswordChange = () => {
    toast({
        title: "Şifre Başarıyla Değiştirildi!",
        description: "Giriş yaparken yeni şifrenizi kullanabilirsiniz.",
    });
    setIsChangePasswordOpen(false);
  }
  
  const handleThemeChange = (newTheme: string) => {
    if (profile) {
      setTheme(newTheme);
      updateProfile({ ...profile, theme: newTheme });
    }
  };

  const handleCopyCode = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    toast({
        title: 'Kod Kopyalandı!',
        description: 'Öğretmen kodunuz panoya kopyalandı.',
    });
  }

  if (isLoading || !profile) {
    return (
        <AppLayout>
            <main className="flex-1 space-y-4 p-8 pt-6 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </main>
        </AppLayout>
    )
  }

  return (
    <AppLayout>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Ayarlar</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            <div className='md:col-span-1 space-y-8'>
                 <Card>
                    <CardHeader>
                        <CardTitle>Profil</CardTitle>
                        <CardDescription>Temel hesap bilgileriniz.</CardDescription>
                    </CardHeader>
                    <CardContent className='text-center flex flex-col items-center gap-4'>
                        <div className="relative group">
                             <Avatar className="h-24 w-24">
                                <AvatarImage src={profile.avatarUrl} alt={profile.fullName} data-ai-hint="teacher portrait" />
                                <AvatarFallback>{profile.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleAvatarChange} 
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Camera className="h-8 w-8 text-white" />
                            </button>
                        </div>
                        <div className='text-center'>
                            <h2 className="text-xl font-semibold">{profile.fullName}</h2>
                            <p className="text-muted-foreground">{profile.title}</p>
                        </div>
                        <Button variant='outline' className='w-full' onClick={() => setIsEditing(true)}>Profili Düzenle</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Güvenlik</CardTitle>
                        <CardDescription>Şifre ve güvenlik ayarları.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant='outline' className='w-full' onClick={() => setIsChangePasswordOpen(true)}>Şifre Değiştir</Button>
                    </CardContent>
                </Card>
            </div>
          <div className="md:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Hesap Bilgileri</CardTitle>
                  <CardDescription>Kişisel bilgileriniz ve iletişim detaylarınız.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-sm">
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4"/> Ad Soyad</span>
                      <span className="font-medium">{profile.fullName}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4"/> E-posta</span>
                      <span className="font-medium">{profile.email}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground"><Book className="h-4 w-4"/> Branş</span>
                      <span className="font-medium">{profile.branch}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4"/> Görev Yeri</span>
                      <span className="font-medium">{profile.workplace}</span>
                    </li>
                     <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4"/> Memleket</span>
                      <span className="font-medium">{profile.hometown}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

                <Accordion type="single" collapsible>
                    <AccordionItem value="item-1" className='border-none'>
                        <Card>
                            <AccordionTrigger className='p-6 hover:no-underline'>
                                <div className='flex flex-col items-start text-left'>
                                    <CardTitle className='flex items-center gap-2'>
                                        <Palette className='h-5 w-5'/>
                                        Görünüm ve Tema Ayarları
                                    </CardTitle>
                                    <CardDescription className='mt-1'>Uygulamanın arayüzünü ve renk paletini kişiselleştirin.</CardDescription>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <CardContent>
                                    <p className="text-sm font-medium mb-4">Tema Seçimi</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div onClick={() => handleThemeChange('light')} className={cn('p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-800', theme === 'light' ? 'border-blue-500' : 'border-slate-200')}>
                                            <Sun className="h-8 w-8 text-yellow-500" />
                                            <h3 className="font-semibold text-sm text-center">Açık</h3>
                                        </div>
                                        <div onClick={() => handleThemeChange('dark')} className={cn('p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-slate-900 text-slate-50', theme === 'dark' ? 'border-cyan-400' : 'border-slate-700')}>
                                            <Moon className="h-8 w-8 text-cyan-400" />
                                            <h3 className="font-semibold text-sm text-center">Koyu</h3>
                                        </div>
                                        <div onClick={() => handleThemeChange('ocean')} className={cn('p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-cyan-50 text-cyan-900', theme === 'ocean' ? 'border-red-500' : 'border-cyan-200')}>
                                            <Droplets className="h-8 w-8 text-cyan-600" />
                                            <h3 className="font-semibold text-sm text-center">Okyanus</h3>
                                        </div>
                                        <div onClick={() => handleThemeChange('forest')} className={cn('p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-emerald-50 text-emerald-900', theme === 'forest' ? 'border-amber-600' : 'border-emerald-200')}>
                                            <Trees className="h-8 w-8 text-emerald-600" />
                                            <h3 className="font-semibold text-sm text-center">Orman</h3>
                                        </div>
                                        <div onClick={() => handleThemeChange('sunset')} className={cn('p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-orange-50 text-orange-900', theme === 'sunset' ? 'border-purple-600' : 'border-orange-200')}>
                                            <Sunset className="h-8 w-8 text-pink-500" />
                                            <h3 className="font-semibold text-sm text-center">Gün Batımı</h3>
                                        </div>
                                        <div onClick={() => handleThemeChange('mint')} className={cn('p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-teal-50 text-teal-900', theme === 'mint' ? 'border-cyan-500' : 'border-teal-200')}>
                                            <Milestone className="h-8 w-8 text-teal-500" />
                                            <h3 className="font-semibold text-sm text-center">Nane</h3>
                                        </div>
                                        <div onClick={() => handleThemeChange('matrix')} className={cn('p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-black text-green-400', theme === 'matrix' ? 'border-green-400' : 'border-green-900')}>
                                            <Binary className="h-8 w-8" />
                                            <h3 className="font-semibold text-sm text-center">Matrix</h3>
                                        </div>
                                        <div onClick={() => handleThemeChange('rose')} className={cn('p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-rose-50 text-rose-900', theme === 'rose' ? 'border-orange-500' : 'border-rose-200')}>
                                            <Sparkle className="h-8 w-8 text-rose-500" />
                                            <h3 className="font-semibold text-sm text-center">Gül</h3>
                                        </div>
                                        <div onClick={() => handleThemeChange('glass')} className={cn('p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-blue-50 text-blue-900', theme === 'glass' ? 'border-blue-500' : 'border-blue-200')}>
                                            <GlassWater className="h-8 w-8 text-blue-500" />
                                            <h3 className="font-semibold text-sm text-center">Cam</h3>
                                        </div>
                                        <div onClick={() => handleThemeChange('premium')} className={cn('relative p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-800', theme === 'premium' ? 'border-purple-500' : 'border-slate-300')}>
                                            <Badge variant="premium" className='absolute -top-2 -right-2'>Premium</Badge>
                                            <Gem className="h-8 w-8 text-purple-600" />
                                            <h3 className="font-semibold text-sm text-center">Premium</h3>
                                        </div>
                                        <div onClick={() => handleThemeChange('ultra')} className={cn('relative p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2 bg-gray-800 text-gray-50', theme === 'ultra' ? 'border-green-400' : 'border-gray-700')}>
                                            <Badge variant="premium" className='absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-green-500'>Ultra</Badge>
                                            <Gem className="h-8 w-8 text-purple-500" />
                                            <h3 className="font-semibold text-sm text-center">Ultra</h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                </Accordion>

              <Card>
                <CardHeader>
                  <CardTitle>Bildirimler</CardTitle>
                  <CardDescription>Hangi durumlarda bildirim almak istediğinizi seçin.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <Label htmlFor='notification-1'>E-posta Bildirimleri</Label>
                        <Switch id='notification-1' defaultChecked/>
                    </div>
                     <div className='flex items-center justify-between'>
                        <Label htmlFor='notification-2'>Anlık Bildirimler</Label>
                        <Switch id='notification-2' />
                    </div>
                </CardContent>
              </Card>
          </div>
        </div>
      </main>

      {profile && <EditProfileForm
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        user={profile}
        onUpdate={handleProfileUpdate}
      />}
      
      <ChangePasswordForm
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onPasswordChanged={handlePasswordChange}
       />
    </AppLayout>
  );
}

export default function AyarlarPage() {
    return (
      <AuthGuard>
        <AyarlarPageContent />
      </AuthGuard>
    );
  }

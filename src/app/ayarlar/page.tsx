
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
  Palette,
  Camera,
  Loader2,
  Globe,
  Moon,
  Sun,
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


function AyarlarPageContent() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { profile, updateProfile, isLoading } = useUserProfile(user?.uid);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL(file.type);
            
            if(profile && user?.uid){
                updateProfile({ ...profile, avatarUrl: dataUrl });
                toast({
                    title: "Profil Resmi Güncellendi!",
                    description: "Yeni resminiz başarıyla kaydedildi.",
                })
            }
        };
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const handlePasswordChange = () => {
    toast({
        title: "Şifre Başarıyla Değiştirildi!",
        description: "Yeni şifrenizle giriş yapabilirsiniz.",
    });
    setIsChangePasswordOpen(false);
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

              <Card>
                <CardHeader>
                  <CardTitle>Görünüm</CardTitle>
                  <CardDescription>Uygulamanın arayüzünü kişiselleştirin.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium mb-4">Tema Seçimi</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => setTheme('light')}
                      className={cn(
                        'p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2',
                        theme === 'light'
                          ? 'border-primary'
                          : 'border-border'
                      )}
                    >
                      <Sun className="h-8 w-8" />
                      <h3 className="font-semibold">Açık Tema</h3>
                    </div>
                    <div
                      onClick={() => setTheme('dark')}
                      className={cn(
                        'p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-2',
                        theme === 'dark'
                          ? 'border-primary'
                          : 'border-border'
                      )}
                    >
                      <Moon className="h-8 w-8" />
                      <h3 className="font-semibold">Koyu Tema</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
        onSave={handlePasswordChange}
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

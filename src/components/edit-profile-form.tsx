
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { UserProfile } from '@/hooks/use-user-profile';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera } from 'lucide-react';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Ad soyad en az 2 karakter olmalıdır.' }),
  title: z.string().min(2, { message: 'Unvan en az 2 karakter olmalıdır.' }),
  email: z.string().email({ message: 'Geçerli bir e-posta adresi girin.' }),
  branch: z.string().min(2, { message: 'Branş en az 2 karakter olmalıdır.' }),
  workplace: z.string().min(2, { message: 'Görev yeri en az 2 karakter olmalıdır.' }),
  hometown: z.string().min(2, { message: 'Memleket en az 2 karakter olmalıdır.' }),
  avatarUrl: z.string().url().or(z.string().startsWith('data:image/')),
});

type EditProfileFormValues = z.infer<typeof formSchema>;

type EditProfileFormProps = {
  user: UserProfile;
  onUpdate: (data: UserProfile) => void;
  onClose: () => void;
  isOpen: boolean;
};

export function EditProfileForm({ user, onUpdate, onClose, isOpen }: EditProfileFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: user,
  });

  React.useEffect(() => {
    if (user) {
      form.reset(user);
    }
  }, [user, form]);

  function onSubmit(values: EditProfileFormValues) {
    onUpdate({
        ...user,
        ...values
    });
  }
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('avatarUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profil Bilgilerini Düzenle</DialogTitle>
          <DialogDescription>
            Kişisel bilgilerinizi güncelleyin. Değişiklikleri kaydetmek için butona tıklayın.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className='flex justify-center'>
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                       <FormControl>
                        <div className="relative group">
                             <Avatar className="h-24 w-24 border-2 border-primary/10">
                                <AvatarImage src={field.value} alt={user.fullName} data-ai-hint="teacher portrait" />
                                <AvatarFallback>{user.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleAvatarChange} 
                            />
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Camera className="h-8 w-8 text-white" />
                            </button>
                        </div>
                       </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Soyad</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Ayşe Yılmaz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unvan</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Matematik Öğretmeni" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: ayse.yilmaz@ornek.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branş</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Matematik" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workplace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Görev Yeri</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Atatürk İlkokulu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="hometown"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memleket</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Ankara" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        İptal
                    </Button>
                </DialogClose>
                <Button type="submit">Değişiklikleri Kaydet</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

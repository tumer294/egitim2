
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Search, Plus, MoreHorizontal, Pencil, Trash2, UserPlus, ShieldCheck, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/app-layout';
import AuthGuard from '@/components/auth-guard';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type User = {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'teacher' | 'beklemede';
};

const userFormSchema = z.object({
  email: z.string().email('Lütfen geçerli bir e-posta adresi girin.'),
  role: z.enum(['admin', 'teacher', 'beklemede'], { required_error: 'Lütfen bir rol seçin.' }),
  fullName: z.string().optional(), // fullName is now optional as it will be set by the user upon registration
});

type UserFormValues = z.infer<typeof userFormSchema>;

function AdminPanelPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile(authUser?.uid);
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [selectedUserForSheet, setSelectedUserForSheet] = React.useState<User | null>(null);

  const isMobile = useMediaQuery("(max-width: 768px)");

  React.useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!authUser || profile?.role !== 'admin') {
        router.replace('/anasayfa');
      }
    }
  }, [authUser, profile, authLoading, profileLoading, router]);

  React.useEffect(() => {
    if (profile?.role !== 'admin') {
        setIsLoading(false);
        return;
    }
    const usersRef = collection(db, 'users');
    const q = query(usersRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users: ", error);
      toast({ title: "Hata", description: "Kullanıcı verileri çekilirken bir hata oluştu.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast, profile?.role]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
  });

  React.useEffect(() => {
    if (editingUser) {
      form.reset({
          email: editingUser.email,
          role: editingUser.role,
          fullName: editingUser.fullName,
      });
    } else {
      form.reset({ email: '', role: 'teacher', fullName: '' });
    }
  }, [editingUser, form]);

  const handleFormSubmit = async (values: UserFormValues) => {
    try {
      if (editingUser) {
        // Update user
        const userDoc = doc(db, 'users', editingUser.id);
        // When updating, we only update role and email. FullName is managed by the user.
        await updateDoc(userDoc, { email: values.email, role: values.role });
        toast({ title: 'Başarılı!', description: 'Kullanıcı bilgileri güncellendi.' });
      } else {
        // Add new user profile placeholder. User will complete registration.
        await addDoc(collection(db, 'users'), { 
            email: values.email, 
            role: values.role,
            fullName: "Yeni Kullanıcı", // Default name
            title: "Öğretmen", // Default title
            branch: "Belirtilmemiş", // Default branch
            avatarUrl: `https://placehold.co/96x96.png`, // Default avatar
            workplace: 'Okul Belirtilmemiş',
            hometown: 'Memleket Belirtilmemiş',
        });
        toast({ title: 'Başarılı!', description: 'Yeni kullanıcı profili oluşturuldu. Kullanıcı kendi şifresiyle kayıt olabilir.' });
      }
      setIsFormOpen(false);
      setEditingUser(null);
      setSelectedUserForSheet(null);
    } catch (error) {
      console.error("Error saving user: ", error);
      toast({ title: "Hata", description: "Kullanıcı kaydedilirken bir hata oluştu.", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Note: This only deletes the Firestore record. For full deletion, a Cloud Function for Auth is needed.
      await deleteDoc(doc(db, 'users', userId));
      toast({ title: 'Başarılı!', description: 'Kullanıcı silindi.', variant: 'destructive' });
      setSelectedUserForSheet(null);
    } catch (error) {
      console.error("Error deleting user: ", error);
      toast({ title: "Hata", description: "Kullanıcı silinirken bir hata oluştu.", variant: "destructive" });
    }
  };
  
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openFormForEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const openFormForNew = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };
  
  const totalLoading = isLoading || authLoading || profileLoading;

  if (totalLoading) {
    return (
      <AppLayout>
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </AppLayout>
    );
  }
  
  if (profile?.role !== 'admin') {
      return null;
  }
  
  const RoleBadge = ({ role }: { role: User['role'] }) => (
    <Badge
      variant="secondary"
      className={cn(
        'text-xs font-semibold',
        role === 'admin'
          ? 'bg-destructive/10 text-destructive'
          : role === 'teacher'
          ? 'bg-primary/10 text-primary'
          : 'bg-accent/20 text-amber-600'
      )}
    >
      {role}
    </Badge>
  );

  const renderDesktopTable = () => (
    <div className="border rounded-md">
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {totalLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                </TableRow>
                ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menüyü aç</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openFormForEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Düzenle</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive' onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Sil</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                    Arama kriterlerine uygun sonuç bulunamadı.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  );

  const renderMobileList = () => (
    <Sheet>
        <div className="space-y-2">
        {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
            <SheetTrigger asChild key={user.id} onClick={() => setSelectedUserForSheet(user)}>
                <Card className="hover:bg-muted/50 cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{user.fullName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                </Card>
            </SheetTrigger>
            ))
        ) : (
            <div className="text-center py-10">
                <p>Arama kriterlerine uygun sonuç bulunamadı.</p>
            </div>
        )}
        </div>
        <SheetContent>
            {selectedUserForSheet && (
                <>
                    <SheetHeader>
                        <SheetTitle>{selectedUserForSheet.fullName}</SheetTitle>
                        <SheetDescription>{selectedUserForSheet.email}</SheetDescription>
                        <div className='pt-2'>
                           <RoleBadge role={selectedUserForSheet.role} />
                        </div>
                    </SheetHeader>
                    <div className="py-8 flex flex-col gap-4">
                        <Button variant="outline" onClick={() => openFormForEdit(selectedUserForSheet)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Kullanıcıyı Düzenle
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Kullanıcıyı Sil
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Bu kullanıcıyı silmek istediğinize emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>Bu işlem geri alınamaz. Kullanıcı kalıcı olarak silinecektir.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(selectedUserForSheet.id)} className="bg-destructive hover:bg-destructive/90">
                                        Evet, Sil
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </>
            )}
        </SheetContent>
    </Sheet>
  );

  return (
    <AppLayout>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              Kullanıcı Yönetimi
            </h2>
            <p className="text-muted-foreground">
              Firestore'daki kullanıcı verilerini görüntüleyin ve yönetin.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Users className='h-5 w-5'/>
                    Kullanıcı Listesi
                </div>
                <Button onClick={openFormForNew}>
                    <UserPlus className="mr-2 h-4 w-4" /> Yeni Kullanıcı Ekle
                </Button>
            </CardTitle>
            <CardDescription>
              Sistemde kayıtlı {users.length} kullanıcı bulunmaktadır.
            </CardDescription>
             <div className="relative pt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı adı veya e-posta ile ara..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isMobile ? renderMobileList() : renderDesktopTable()}
          </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Kullanıcı Rolünü Düzenle' : 'Yeni Kullanıcı Profili Ekle'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Kullanıcının rolünü güncelleyin.' : 'Kullanıcı sisteme bu e-posta ile kayıt olduğunda, atadığınız rol geçerli olacaktır.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ornek@eposta.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Rol seçin..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="beklemede">Beklemede</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">İptal</Button>
                    </DialogClose>
                    <Button type="submit">Kaydet</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </main>
    </AppLayout>
  );
}

export default function AdminPanelPageContainer() {
    return (
        <AuthGuard>
            <AdminPanelPage/>
        </AuthGuard>
    )
}

'use client';

import { useEffect, useState } from 'react';
// import { useSession } from 'next-auth/react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Shield,
  User as UserIcon,
  // UserPlus,
  Loader2,
  Edit,
  Trash2,
  RotateCcw,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInitials, roleLabels } from '@/lib/utils';
import { usersApi, authApi } from '@/lib/api';
import type { User } from '@/lib/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createUserSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'En az bir büyük harf içermeli')
    .regex(/[a-z]/, 'En az bir küçük harf içermeli')
    .regex(/[0-9]/, 'En az bir rakam içermeli'),
  role: z.enum(['ADMIN', 'THERAPIST', 'RECEPTIONIST', 'CLIENT']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  // const { data: session } = useSession();
  // const userRole = (session?.user as any)?.role || 'CLIENT';

  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'CLIENT',
    },
  });

  useEffect(() => {
    fetchUsers();
    if (activeTab === 'deleted') {
      fetchDeletedUsers();
    }
  }, [activeTab]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const response = await usersApi.list({ limit: 100 });
      if (response.data?.success && response.data?.data) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDeletedUsers() {
    try {
      setDeletedLoading(true);
      const response = await usersApi.listDeleted({ limit: 100 });
      // Same format as fetchUsers - Axios wraps response, so response.data is the API response
      // Backend returns { success: true, data: UserDto[], meta: {...} }
      if (response.data?.success && response.data?.data) {
        setDeletedUsers(response.data.data);
      } else {
        // If no data or success is false, just set empty array (no error)
        setDeletedUsers([]);
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Failed to fetch deleted users:', error);
      // Only show error toast for real errors (not 404)
      // 404 means endpoint not found or no deleted users, which is fine - just show empty list
      const status = error.response?.status;
      if (status && status !== 404) {
        toast.error('Silinen kullanıcılar yüklenirken bir hata oluştu');
      }
      // Always set empty array on error to prevent UI issues
      setDeletedUsers([]);
    } finally {
      setDeletedLoading(false);
    }
  }

  const onSubmit = async (data: CreateUserForm) => {
    try {
      // Use authApi.register with role parameter
      // The API interceptor will automatically add the auth token
      await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        role: data.role,
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      toast.success('Kullanıcı başarıyla oluşturuldu');
      setCreateDialogOpen(false);
      form.reset();
      fetchUsers();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Failed to create user:', error);
      toast.error(error.message || 'Kullanıcı oluşturulurken bir hata oluştu');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

    try {
      await usersApi.delete(id);
      setUsers(users.filter((u) => u.id !== id));
      toast.success('Kullanıcı başarıyla silindi');
    } catch (error) {
      toast.error('Kullanıcı silinirken bir hata oluştu');
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('Bu kullanıcıyı geri yüklemek istediğinize emin misiniz?')) return;

    try {
      await usersApi.restore(id);
      setDeletedUsers(deletedUsers.filter((u) => u.id !== id));
      toast.success('Kullanıcı başarıyla geri yüklendi');
      // Refresh active users list
      fetchUsers();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Failed to restore user:', error);
      toast.error(error.message || 'Kullanıcı geri yüklenirken bir hata oluştu');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return <Shield className="h-4 w-4" />;
      case 'THERAPIST':
        return <UserIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="Kullanıcılar" description="Kullanıcı yönetimi ve yetkilendirme">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kullanıcı
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
              <DialogDescription>
                Sisteme yeni bir kullanıcı ekleyin. Terapist, Admin veya diğer rollerden birini seçebilirsiniz.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad</FormLabel>
                        <FormControl>
                          <Input placeholder="Ad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soyad</FormLabel>
                        <FormControl>
                          <Input placeholder="Soyad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ornek@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="05XX XXX XX XX" {...field} />
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
                            <SelectValue placeholder="Rol seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="THERAPIST">Terapist</SelectItem>
                          <SelectItem value="RECEPTIONIST">Resepsiyonist</SelectItem>
                          <SelectItem value="CLIENT">Danışan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Kullanıcının sistemdeki rolünü seçin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription>
                        En az 8 karakter, büyük harf, küçük harf ve rakam içermeli
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Oluştur
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </Header>

      <div className="flex-1 p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Aktif Kullanıcılar</TabsTrigger>
            <TabsTrigger value="deleted">Silinen Kullanıcılar</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="İsim veya e-posta ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="THERAPIST">Terapist</SelectItem>
                  <SelectItem value="RECEPTIONIST">Resepsiyonist</SelectItem>
                  <SelectItem value="CLIENT">Danışan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>İletişim</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Kayıt Tarihi</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-32 mb-1" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-28" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <p className="text-muted-foreground">
                            {searchQuery || roleFilter !== 'all'
                              ? 'Arama kriterlerine uygun kullanıcı bulunamadı'
                              : 'Henüz kullanıcı kaydı yok'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(`${user.firstName} ${user.lastName}`)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.firstName} {user.lastName}
                                </div>
                                <p className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                              {getRoleIcon(user.role)}
                              {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.status === 'ACTIVE' ? 'success' : 'secondary'}
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(user.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deleted" className="space-y-4">
            {/* Deleted Users Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>İletişim</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Silinme Tarihi</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-32 mb-1" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-28" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : deletedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <p className="text-muted-foreground">
                            Silinen kullanıcı bulunamadı
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      deletedUsers.map((user) => (
                        <TableRow key={user.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-muted text-muted-foreground">
                                  {getInitials(`${user.firstName} ${user.lastName}`)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.firstName} {user.lastName}
                                </div>
                                <p className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                              {getRoleIcon(user.role)}
                              {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() => handleRestore(user.id)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Geri Yükle
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


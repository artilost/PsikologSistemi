'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatPhoneNumber, getInitials } from '@/lib/utils';
import { clientsApi, usersApi, type Client, type CreateClientData } from '@/lib/api';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function ClientsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'CLIENT';
  const [clients, setClients] = useState<Client[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingClientId, setUpdatingClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [newClientEmail, setNewClientEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
    if (userRole !== 'CLIENT') {
      fetchTherapists();
    }
  }, [userRole]);

  async function fetchTherapists() {
    try {
      setLoadingTherapists(true);
      const response = await usersApi.getTherapists();
      if (response.data?.success && response.data?.data) {
        setTherapists(response.data.data);
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setLoadingTherapists(false);
    }
  }

  async function fetchClients() {
    try {
      setError(null);
      setLoading(true);
      // Fetch both active and inactive clients - same logic as users page
      const [activeResponse, inactiveResponse] = await Promise.all([
        clientsApi.list({ limit: 100 }),
        clientsApi.listDeleted({ limit: 100 }).catch((err: any) => {
          // Log the error to see what's happening
          console.error('Failed to fetch deleted clients:', err);
          const status = err.response?.status;
          if (status && status !== 404) {
            toast.error('Pasif danışanlar yüklenirken bir hata oluştu');
          }
          return { data: { success: true, data: [] } };
        }),
      ]);
      
      const activeClients = activeResponse.data?.success ? activeResponse.data.data : [];
      const inactiveClients = inactiveResponse.data?.success ? inactiveResponse.data.data : [];
      
      console.log('Active clients response:', activeResponse.data);
      console.log('Inactive clients response:', inactiveResponse.data);
      console.log('Active clients count:', activeClients.length);
      console.log('Inactive clients count:', inactiveClients.length);
      
      // Combine both lists - backend already sets isActive correctly
      // Active clients from list() have isActive: true
      // Inactive clients from listDeleted() have isActive: false
      const allClients = [...activeClients, ...inactiveClients];
      
      setClients(allClients);
    } catch (error: any) {
      const errorMessage = error.response?.status === 403
        ? 'Bu sayfaya erişim yetkiniz yok'
        : error.response?.status === 401
        ? 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın'
        : 'Danışanlar yüklenirken bir hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      searchQuery === '' ||
      client.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter: 'all' shows all, 'active' shows active (isActive === true), 'inactive' shows inactive (isActive !== true)
    // Note: isActive can be true, false, null, or undefined. We treat anything that's not explicitly true as inactive.
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && client.isActive === true) ||
      (statusFilter === 'inactive' && client.isActive !== true);

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Bu danışanı silmek istediğinize emin misiniz?')) return;

    try {
      await clientsApi.delete(id);
      // Refresh the clients list to show updated isActive status
      await fetchClients();
      toast.success('Danışan başarıyla silindi (pasif yapıldı)');
    } catch (error) {
      toast.error('Danışan silinirken bir hata oluştu');
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('Bu danışanı geri yüklemek istediğinize emin misiniz?')) return;

    try {
      await clientsApi.restore(id);
      toast.success('Danışan başarıyla geri yüklendi');
      // Refresh clients list
      await fetchClients();
    } catch (error: any) {
      console.error('Failed to restore client:', error);
      toast.error(error.message || 'Danışan geri yüklenirken bir hata oluştu');
    }
  };

  const handleTherapistChange = async (clientId: string, therapistId: string | null) => {
    try {
      setUpdatingClientId(clientId);
      
      // Find the therapist to get therapistProfileId
      // therapistId can be either user id or therapistProfileId
      let therapistProfileId: string | null = null;
      
      if (therapistId && therapistId !== 'none') {
        const therapist = therapists.find(t => t.id === therapistId || (t as any).therapistProfileId === therapistId);
        if (therapist) {
          // Use therapistProfileId if available, otherwise use therapistId (backend will convert it)
          therapistProfileId = (therapist as any).therapistProfileId || therapistId;
        } else {
          // If not found in list, assume it's already a therapistProfileId
          therapistProfileId = therapistId;
        }
      }
      
      // Update client with therapist assignment
      await clientsApi.update(clientId, {
        therapistProfileId: therapistProfileId || undefined,
      } as any);
      
      // Refresh clients list to get updated data
      await fetchClients();
      
          toast.success('Terapist ataması güncellendi');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Terapist ataması güncellenirken bir hata oluştu');
    } finally {
      setUpdatingClientId(null);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Danışanlar" description="Danışan listesi ve yönetimi" />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col">
        <Header title="Danışanlar" description="Danışan listesi ve yönetimi" />
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <p className="text-lg font-medium text-destructive mb-2">{error}</p>
                <Button onClick={fetchClients} variant="outline" className="mt-4">
                  Tekrar Dene
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleCreateClient = async (data: CreateClientData) => {
    try {
      setCreating(true);
      const response = await clientsApi.create(data);
      if (response.data.success) {
        // If password was generated, show it to the user
        if ((response.data as any).password) {
          setGeneratedPassword((response.data as any).password);
          setNewClientEmail(data.email);
          setPasswordDialogOpen(true);
        } else {
          toast.success('Danışan başarıyla oluşturuldu');
        }
        setCreateDialogOpen(false);
        await fetchClients();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Danışan oluşturulurken bir hata oluştu';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="Danışanlar" description="Danışan listesi ve yönetimi">
        {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'THERAPIST' || userRole === 'RECEPTIONIST') && (
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Danışan
          </Button>
        )}
      </Header>

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Danışan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktif Danışan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {clients.filter((c) => c.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Onay Bekleyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {clients.filter((c) => !c.consentSigned).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bu Ay Yeni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {
                  clients.filter((c) => {
                    const createdAt = new Date(c.createdAt);
                    const now = new Date();
                    return (
                      createdAt.getMonth() === now.getMonth() &&
                      createdAt.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Pasif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Danışan</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Terapist</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Onaylar</TableHead>
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
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <p className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Arama kriterlerine uygun danışan bulunamadı'
                          : 'Henüz danışan kaydı yok'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(
                                `${client.user.firstName} ${client.user.lastName}`
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/dashboard/clients/${client.id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {client.user.firstName} {client.user.lastName}
                            </Link>
                            {client.occupation && (
                              <p className="text-sm text-muted-foreground">
                                {client.occupation}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{client.user.email}</span>
                          </div>
                          {client.user.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{formatPhoneNumber(client.user.phone)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {userRole !== 'CLIENT' ? (
                          <Select
                            value={(() => {
                              // Get therapistProfileId from client
                              const clientTherapistProfileId = (client as any).therapistProfileId;
                              const clientTherapistProfileIdFromRelation = (client as any).therapistProfile?.id;
                              const therapistProfileId = clientTherapistProfileId || clientTherapistProfileIdFromRelation;
                              
                              if (!therapistProfileId) {
                                return 'none';
                              }
                              
                              // Find matching therapist in the list
                              // Match by therapistProfileId first
                              let matchingTherapist = therapists.find((t: any) => {
                                return t.therapistProfileId === therapistProfileId;
                              });
                              
                              // If not found and we have client's therapistProfile relation, try to match by user id
                              // therapistProfile.user.id contains the user id of the therapist
                              if (!matchingTherapist && (client as any).therapistProfile?.user?.id) {
                                const therapistUserId = (client as any).therapistProfile.user.id;
                                matchingTherapist = therapists.find((t: any) => {
                                  return t.id === therapistUserId;
                                });
                                if (matchingTherapist) {
                                  // Return the therapistProfileId if available, otherwise use user id
                                  return (matchingTherapist as any).therapistProfileId || matchingTherapist.id;
                                }
                              }
                              
                              // If not found, return 'none' instead of using the therapistProfileId
                              // This prevents showing an invalid selection
                              if (!matchingTherapist && therapists.length > 0) {
                                return 'none';
                              }
                              
                              // Return the value that matches a SelectItem
                              if (matchingTherapist) {
                                // Use therapistProfileId if available, otherwise use user id
                                const selectedValue = (matchingTherapist as any).therapistProfileId || matchingTherapist.id;
                                return selectedValue;
                              }
                              
                              // If therapistProfileId exists but not in list, return 'none' instead of using it
                              // This prevents showing an invalid selection that doesn't match any SelectItem
                              return 'none';
                            })()}
                            onValueChange={(value) => {
                              if (value === 'none') {
                                handleTherapistChange(client.id, null);
                                return;
                              }
                              // Find therapist by the selected value
                              const therapist = therapists.find((t: any) => {
                                const therapistValue = t.therapistProfileId || t.id;
                                return therapistValue === value;
                              });
                              const therapistProfileId = therapist 
                                ? (therapist.therapistProfileId || therapist.id)
                                : value;
                              handleTherapistChange(client.id, therapistProfileId);
                            }}
                            disabled={updatingClientId === client.id || loadingTherapists}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Terapist seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Terapist yok</SelectItem>
                              {therapists.map((therapist) => {
                                // Use therapistProfileId if available, otherwise use user id
                                // But if therapistProfileId is undefined, we need to use user id
                                // and then match it with client's therapistProfile.userId
                                const value = (therapist as any).therapistProfileId || therapist.id;
                                return (
                                  <SelectItem key={therapist.id} value={value}>
                                    {therapist.firstName} {therapist.lastName}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {(client as any).therapistProfile?.user?.firstName 
                              ? `${(client as any).therapistProfile.user.firstName} ${(client as any).therapistProfile.user.lastName}`
                              : 'Atanmamış'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={client.isActive ? 'success' : 'secondary'}
                        >
                          {client.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {client.consentSigned ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {client.consentSigned ? 'Onaylandı' : 'Bekliyor'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(client.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/clients/${client.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Görüntüle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/clients/${client.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Düzenle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {client.isActive ? (
                              <DropdownMenuItem
                                onClick={() => handleDelete(client.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Sil
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleRestore(client.id)}
                                className="text-green-600 focus:text-green-600"
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Geri Yükle
                              </DropdownMenuItem>
                            )}
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
      </div>

      {/* Create Client Dialog */}
      <CreateClientDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateClient}
        therapists={therapists}
        loading={creating}
      />

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Danışan Şifresi</DialogTitle>
            <DialogDescription>
              Yeni danışan için oluşturulan şifre. Lütfen bu şifreyi güvenli bir şekilde danışana iletin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>E-posta</Label>
              <Input value={newClientEmail || ''} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Şifre</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={generatedPassword || ''} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (generatedPassword) {
                      navigator.clipboard.writeText(generatedPassword);
                      toast.success('Şifre kopyalandı');
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Bu şifre sadece bir kez gösterilecektir. Lütfen şifreyi kaydedin veya danışana iletin.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>Tamam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Client Dialog Component
function CreateClientDialog({
  open,
  onOpenChange,
  onSubmit,
  therapists,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateClientData) => Promise<void>;
  therapists: any[];
  loading: boolean;
}) {
  const [formData, setFormData] = useState<CreateClientData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    address: '',
    occupation: '',
    emergencyContact: '',
    emergencyPhone: '',
    therapistProfileId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Ad, soyad ve e-posta alanları zorunludur');
      return;
    }

    await onSubmit({
      ...formData,
      therapistProfileId: formData.therapistProfileId && formData.therapistProfileId !== "none" ? formData.therapistProfileId : undefined,
    });
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: '',
      address: '',
      occupation: '',
      emergencyContact: '',
      emergencyPhone: '',
      therapistProfileId: '',
    });
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Danışan Ekle</DialogTitle>
          <DialogDescription>
            Sisteme yeni bir danışan ekleyin. Zorunlu alanlar * ile işaretlenmiştir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Ad *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Danışan adı"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Soyad *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Danışan soyadı"
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-posta *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="ornek@email.com"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+90 5XX XXX XX XX"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Cinsiyet</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Erkek</SelectItem>
                  <SelectItem value="FEMALE">Kadın</SelectItem>
                  <SelectItem value="OTHER">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="occupation">Meslek</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                placeholder="Meslek"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Adres"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContact">Acil Durum Kişisi</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                placeholder="Ad Soyad"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Acil Durum Telefonu</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                placeholder="+90 5XX XXX XX XX"
                className="mt-1"
              />
            </div>
          </div>

          {therapists.length > 0 && (
            <div>
              <Label htmlFor="therapist">Terapist</Label>
              <Select
                value={formData.therapistProfileId || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, therapistProfileId: value === "none" ? "" : value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Terapist seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Atanmamış</SelectItem>
                  {therapists.map((therapist) => (
                    <SelectItem key={therapist.id} value={therapist.therapistProfileId || therapist.id}>
                      {therapist.firstName} {therapist.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Danışan Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


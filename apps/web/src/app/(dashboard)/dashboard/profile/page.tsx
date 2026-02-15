'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Edit,
  Loader2,
  Camera,
  Check,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { authApi, usersApi } from '@/lib/api';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Süper Admin',
  ADMIN: 'Admin',
  THERAPIST: 'Terapist',
  RECEPTIONIST: 'Resepsiyonist',
  ACCOUNTANT: 'Muhasebeci',
  CLIENT: 'Danışan',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  ADMIN: 'bg-purple-100 text-purple-800',
  THERAPIST: 'bg-blue-100 text-blue-800',
  RECEPTIONIST: 'bg-green-100 text-green-800',
  ACCOUNTANT: 'bg-yellow-100 text-yellow-800',
  CLIENT: 'bg-gray-100 text-gray-800',
};

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    // Client Profile Fields
    dateOfBirth: '',
    gender: '',
    occupation: '',
    address: '',
    // Therapist Profile Fields
    licenseNumber: '',
    specialization: '',
    biography: '',
  });

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true);
        const response = await authApi.me();
        if (response.data.success && response.data.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userData = response.data.data as any;
          setUser(userData);

          // Populate form
          setEditForm({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || '',
            // Client
            dateOfBirth: userData.clientProfile?.dateOfBirth ? new Date(userData.clientProfile.dateOfBirth).toISOString().split('T')[0] : '',
            gender: userData.clientProfile?.gender || '',
            occupation: userData.clientProfile?.occupation || '',
            address: userData.clientProfile?.address || '',
            // Therapist
            licenseNumber: userData.therapistProfile?.licenseNumber || '',
            specialization: userData.therapistProfile?.specialization?.join(', ') || '',
            biography: userData.therapistProfile?.biography || '',
          });
        }
      } catch (error) {
        toast.error('Profil bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // 1. Update basic user info
      await usersApi.update(user.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
      });

      // 2. Update role-specific profile
      if (user.role === 'CLIENT') {
        await usersApi.updateClientProfile({
          dateOfBirth: editForm.dateOfBirth,
          gender: editForm.gender,
          occupation: editForm.occupation,
          address: editForm.address,
          // Required fields that might be missing in edit form but needed for DTO
          emergContact: user.clientProfile?.emergContact || 'Belirtilmedi',
          emergPhone: user.clientProfile?.emergPhone || 'Belirtilmedi',
        });
      } else if (user.role === 'THERAPIST') {
        await usersApi.updateTherapistProfile({
          licenseNumber: editForm.licenseNumber,
          specialization: editForm.specialization.split(',').map((s: string) => s.trim()),
          biography: editForm.biography,
        });
      }

      // Update local state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser((prev: any) => ({
        ...prev,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        clientProfile: prev.clientProfile ? {
          ...prev.clientProfile,
          dateOfBirth: editForm.dateOfBirth,
          gender: editForm.gender,
          occupation: editForm.occupation,
          address: editForm.address,
        } : prev.clientProfile,
        therapistProfile: prev.therapistProfile ? {
          ...prev.therapistProfile,
          licenseNumber: editForm.licenseNumber,
          specialization: editForm.specialization.split(',').map((s: string) => s.trim()),
          biography: editForm.biography,
        } : prev.therapistProfile,
      }));

      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: `${editForm.firstName} ${editForm.lastName}`,
        },
      });

      toast.success('Profil güncellendi');
      setEditDialogOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await usersApi.uploadAvatar(file);
      if (response.data.success) {
        toast.success("Avatar başarıyla güncellendi");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setUser((prev: any) => ({ ...prev, avatar: response.data.data.avatar }));
      }
    } catch (error) {
      toast.error("Avatar yüklenirken bir hata oluştu");
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header title="Profil" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header title="Profil" />

      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.avatar} alt={user?.firstName} />
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  <Label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    <Input
                      id="avatar-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </Label>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="mt-2">
                    <Badge className={roleColors[user?.role] || ''}>
                      {roleLabels[user?.role] || user?.role}
                    </Badge>
                  </div>
                </div>
                <Button onClick={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle>Kişisel Bilgiler</CardTitle>
              <CardDescription>Hesap bilgileriniz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ad Soyad</p>
                    <p className="font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-posta</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium">{user?.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kayıt Tarihi</p>
                    <p className="font-medium">
                      {user?.createdAt
                        ? format(new Date(user.createdAt), 'd MMMM yyyy', { locale: tr })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Therapist Profile */}
          {user?.therapistProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Terapist Profili</CardTitle>
                <CardDescription>Uzmanlık bilgileriniz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Uzmanlık Alanları</p>
                      <p className="font-medium">
                        {user.therapistProfile.specialization?.join(', ') || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                      #
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lisans Numarası</p>
                      <p className="font-medium">
                        {user.therapistProfile.licenseNumber || '-'}
                      </p>
                    </div>
                  </div>
                </div>
                {user.therapistProfile.biography && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Biyografi</p>
                    <p className="p-3 bg-muted rounded-lg">
                      {user.therapistProfile.biography}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Client Profile */}
          {user?.clientProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Danışan Profili</CardTitle>
                <CardDescription>Kişisel bilgileriniz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.clientProfile.dateOfBirth && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Doğum Tarihi</p>
                        <p className="font-medium">
                          {format(new Date(user.clientProfile.dateOfBirth), 'd MMMM yyyy', {
                            locale: tr,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {user.clientProfile.occupation && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Meslek</p>
                        <p className="font-medium">{user.clientProfile.occupation}</p>
                      </div>
                    </div>
                  )}
                  {user.clientProfile.address && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg md:col-span-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Adres</p>
                        <p className="font-medium">{user.clientProfile.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profili Düzenle</DialogTitle>
            <DialogDescription>Profil bilgilerinizi güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Ad</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Soyad</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+90 5XX XXX XX XX"
                className="mt-2"
              />
            </div>

            {/* Client Specific Fields */}
            {user?.role === 'CLIENT' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Doğum Tarihi</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Cinsiyet</Label>
                    <select
                      id="gender"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                      value={editForm.gender}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="">Seçiniz</option>
                      <option value="male">Erkek</option>
                      <option value="female">Kadın</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="occupation">Meslek</Label>
                  <Input
                    id="occupation"
                    value={editForm.occupation}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, occupation: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {/* Therapist Specific Fields */}
            {user?.role === 'THERAPIST' && (
              <>
                <div>
                  <Label htmlFor="licenseNumber">Lisans Numarası</Label>
                  <Input
                    id="licenseNumber"
                    value={editForm.licenseNumber}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">Uzmanlık Alanları (Virgülle ayırın)</Label>
                  <Input
                    id="specialization"
                    value={editForm.specialization}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, specialization: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="biography">Biyografi</Label>
                  <Input
                    id="biography"
                    value={editForm.biography}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, biography: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </>
            )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Kaydet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


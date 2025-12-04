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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
  const [user, setUser] = useState<any>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true);
        const response = await authApi.me();
        if (response.data.success && response.data.data) {
          setUser(response.data.data);
          setEditForm({
            firstName: response.data.data.firstName || '',
            lastName: response.data.data.lastName || '',
            phone: response.data.data.phone || '',
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
      await usersApi.update(user.id, editForm);
      
      // Update local state
      setUser((prev: any) => ({
        ...prev,
        ...editForm,
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
    } catch (error: any) {
      toast.error(error.message || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
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
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Profili Düzenle</DialogTitle>
            <DialogDescription>Profil bilgilerinizi güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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


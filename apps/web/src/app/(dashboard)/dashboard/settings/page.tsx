'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Settings,
  Bell,
  Lock,
  Palette,
  Globe,
  Shield,
  Loader2,
  Check,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    marketingEmails: false,

    // Privacy
    showProfile: true,
    allowMessages: true,

    // Appearance
    theme: 'system',
    language: 'tr',

    // Security
    twoFactorEnabled: false,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, save settings to backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header title="Ayarlar" />

      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Ayarlar</h1>
            <p className="text-muted-foreground">
              Hesap ve uygulama ayarlarınızı yönetin
            </p>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Bildirimler</CardTitle>
              </div>
              <CardDescription>Bildirim tercihlerinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">E-posta Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Önemli güncellemeler için e-posta alın
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsNotifications">SMS Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Randevu hatırlatmaları için SMS alın
                  </p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="appointmentReminders">Randevu Hatırlatmaları</Label>
                  <p className="text-sm text-muted-foreground">
                    Randevularınız için hatırlatma alın
                  </p>
                </div>
                <Switch
                  id="appointmentReminders"
                  checked={settings.appointmentReminders}
                  onCheckedChange={(checked) => updateSetting('appointmentReminders', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketingEmails">Pazarlama E-postaları</Label>
                  <p className="text-sm text-muted-foreground">
                    Kampanya ve duyurulardan haberdar olun
                  </p>
                </div>
                <Switch
                  id="marketingEmails"
                  checked={settings.marketingEmails}
                  onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Gizlilik</CardTitle>
              </div>
              <CardDescription>Gizlilik tercihlerinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showProfile">Profili Göster</Label>
                  <p className="text-sm text-muted-foreground">
                    Profilinizin başkaları tarafından görülmesine izin verin
                  </p>
                </div>
                <Switch
                  id="showProfile"
                  checked={settings.showProfile}
                  onCheckedChange={(checked) => updateSetting('showProfile', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowMessages">Mesajlara İzin Ver</Label>
                  <p className="text-sm text-muted-foreground">
                    Diğer kullanıcıların size mesaj göndermesine izin verin
                  </p>
                </div>
                <Switch
                  id="allowMessages"
                  checked={settings.allowMessages}
                  onCheckedChange={(checked) => updateSetting('allowMessages', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Görünüm</CardTitle>
              </div>
              <CardDescription>Uygulama görünümünü özelleştirin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => updateSetting('theme', value)}
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Açık</SelectItem>
                    <SelectItem value="dark">Koyu</SelectItem>
                    <SelectItem value="system">Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Dil</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => updateSetting('language', value)}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Güvenlik</CardTitle>
              </div>
              <CardDescription>Hesap güvenliğinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twoFactor">İki Faktörlü Doğrulama</Label>
                  <p className="text-sm text-muted-foreground">
                    Hesabınıza ekstra güvenlik katmanı ekleyin
                  </p>
                </div>
                <Switch
                  id="twoFactor"
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(checked) => updateSetting('twoFactorEnabled', checked)}
                />
              </div>
              <Separator />
              <div>
                <Button variant="outline" className="w-full">
                  Şifre Değiştir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
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
          </div>
        </div>
      </main>
    </div>
  );
}


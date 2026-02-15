'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { WeeklyScheduleEditor, type WeeklySchedule, type DaySchedule } from '@/components/availability/weekly-schedule-editor';
import { toast } from 'sonner';
import { usersApi, authApi } from '@/lib/api';
import { Loader2, Save } from 'lucide-react';

const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  enabled: false,
  slots: [],
};

const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
  tuesday: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
  wednesday: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
  thursday: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
  friday: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
  saturday: DEFAULT_DAY_SCHEDULE,
  sunday: DEFAULT_DAY_SCHEDULE,
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // Availability settings
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(DEFAULT_WEEKLY_SCHEDULE);
  const [sessionDuration, setSessionDuration] = useState(50);
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(true);
  const [autoConfirmAppointment, setAutoConfirmAppointment] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const response = await authApi.me();

        if (response.data.success && response.data.data) {
          const userData = response.data.data as any;
          setUserRole(userData.role);

          // Only for therapists
          if (userData.role === 'THERAPIST' && userData.therapistProfile) {
            const profile = userData.therapistProfile;

            // Load working hours
            if (profile.workingHours) {
              try {
                const workingHours = typeof profile.workingHours === 'string'
                  ? JSON.parse(profile.workingHours)
                  : profile.workingHours;

                // Convert backend format to component format
                const schedule: WeeklySchedule = {
                  monday: workingHours.monday || DEFAULT_DAY_SCHEDULE,
                  tuesday: workingHours.tuesday || DEFAULT_DAY_SCHEDULE,
                  wednesday: workingHours.wednesday || DEFAULT_DAY_SCHEDULE,
                  thursday: workingHours.thursday || DEFAULT_DAY_SCHEDULE,
                  friday: workingHours.friday || DEFAULT_DAY_SCHEDULE,
                  saturday: workingHours.saturday || DEFAULT_DAY_SCHEDULE,
                  sunday: workingHours.sunday || DEFAULT_DAY_SCHEDULE,
                };
                setWeeklySchedule(schedule);
              } catch (e) {
                console.error('Error parsing working hours:', e);
              }
            }

            setSessionDuration(profile.sessionDuration || 50);
            setAllowOnlineBooking(profile.allowOnlineBooking ?? true);
            setAutoConfirmAppointment(profile.autoConfirmAppointment ?? false);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Ayarlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status]);

  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      await usersApi.updateTherapistProfile({
        workingHours: weeklySchedule,
        sessionDuration,
        allowOnlineBooking,
        autoConfirmAppointment,
      });

      toast.success('Müsaitlik ayarları kaydedildi');
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toast.error(error.response?.data?.message || 'Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only therapists can access availability settings
  if (userRole !== 'THERAPIST') {
    return (
      <div className="flex flex-col h-full">
        <Header title="Ayarlar" description="Sistem ayarlarınızı yönetin" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Erişim Yok</CardTitle>
              <CardDescription>
                Bu sayfa sadece terapistler için erişilebilir.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Ayarlar" description="Müsaitlik ve randevu ayarlarınızı yönetin" />

      <div className="flex-1 p-6 overflow-auto">
        <Tabs defaultValue="availability" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="availability">Müsaitlik</TabsTrigger>
            <TabsTrigger value="preferences">Tercihler</TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="space-y-6 mt-6">
            <WeeklyScheduleEditor
              value={weeklySchedule}
              onChange={setWeeklySchedule}
              sessionDuration={sessionDuration}
            />

            <div className="flex justify-end">
              <Button onClick={handleSaveAvailability} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Değişiklikleri Kaydet
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Randevu Tercihleri</CardTitle>
                <CardDescription>
                  Randevu yönetimi ve onay süreçlerini yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="session-duration">Seans Süresi (dakika)</Label>
                      <p className="text-sm text-muted-foreground">
                        Varsayılan seans süresi
                      </p>
                    </div>
                    <Input
                      id="session-duration"
                      type="number"
                      min="15"
                      max="180"
                      step="5"
                      value={sessionDuration}
                      onChange={(e) => setSessionDuration(parseInt(e.target.value))}
                      className="w-24"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="online-booking">Online Randevu</Label>
                      <p className="text-sm text-muted-foreground">
                        Danışanlar online randevu alabilsin
                      </p>
                    </div>
                    <Switch
                      id="online-booking"
                      checked={allowOnlineBooking}
                      onCheckedChange={setAllowOnlineBooking}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-confirm">Otomatik Onay</Label>
                      <p className="text-sm text-muted-foreground">
                        Randevular otomatik olarak onaylansın
                      </p>
                    </div>
                    <Switch
                      id="auto-confirm"
                      checked={autoConfirmAppointment}
                      onCheckedChange={setAutoConfirmAppointment}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveAvailability} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Değişiklikleri Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

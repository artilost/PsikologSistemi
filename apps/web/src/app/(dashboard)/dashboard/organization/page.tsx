'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeeklyScheduleEditor, type WeeklySchedule, type DaySchedule } from '@/components/availability/weekly-schedule-editor';
import { toast } from 'sonner';
import { Loader2, Save, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { organizationApi } from '@/lib/api';

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

export default function OrganizationSettingsPage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState<string>('');

    // Organization info
    const [orgName, setOrgName] = useState('');
    const [orgDescription, setOrgDescription] = useState('');

    // Default schedule
    const [defaultSchedule, setDefaultSchedule] = useState<WeeklySchedule>(DEFAULT_WEEKLY_SCHEDULE);
    const [defaultSessionDuration, setDefaultSessionDuration] = useState(50);

    useEffect(() => {
        async function fetchSettings() {
            try {
                setLoading(true);
                const response = await organizationApi.getSettings();

                if (response.data.success && response.data.data) {
                    const orgData = response.data.data;
                    setUserRole(session?.user?.role || '');
                    setOrgName(orgData.name || '');
                    setOrgDescription(orgData.description || '');

                    // Parse organization settings
                    const settings = orgData.settings as any;
                    if (settings) {
                        if (settings.defaultTherapistSchedule) {
                            setDefaultSchedule(settings.defaultTherapistSchedule);
                        }
                        if (settings.defaultSessionDuration) {
                            setDefaultSessionDuration(settings.defaultSessionDuration);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                toast.error('Ayarlar yüklenirken bir hata oluştu');
                setUserRole(session?.user?.role || '');
            } finally {
                setLoading(false);
            }
        }

        if (status === 'authenticated') {
            fetchSettings();
        }
    }, [status, session]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await organizationApi.updateSettings({
                defaultTherapistSchedule: defaultSchedule,
                defaultSessionDuration,
            });

            toast.success('Organization ayarları kaydedildi');
        } catch (error: any) {
            console.error('Error saving settings:', error);
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

    // Only admins can access organization settings
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return (
            <div className="flex flex-col h-full">
                <Header title="Organization Ayarları" description="Klinik geneli ayarlarını yönetin" />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="max-w-md">
                        <CardHeader>
                            <CardTitle>Erişim Yok</CardTitle>
                            <CardDescription>
                                Bu sayfa sadece adminler için erişilebilir.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <Header title="Organization Ayarları" description="Klinik geneli ayarlarını yönetin" />

            <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-4xl space-y-6">
                    {/* Organization Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                <CardTitle>Klinik Bilgileri</CardTitle>
                            </div>
                            <CardDescription>
                                Klinik hakkında genel bilgiler
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="org-name">Klinik Adı</Label>
                                <Input
                                    id="org-name"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    className="mt-2"
                                    disabled
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Bu alan şu anda düzenlenemez
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="org-description">Açıklama</Label>
                                <Input
                                    id="org-description"
                                    value={orgDescription}
                                    onChange={(e) => setOrgDescription(e.target.value)}
                                    className="mt-2"
                                    disabled
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Default Therapist Schedule */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Varsayılan Terapist Programı</CardTitle>
                            <CardDescription>
                                Yeni oluşturulan terapistlere otomatik olarak atanacak varsayılan çalışma programı
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="default-session-duration">Varsayılan Seans Süresi (dakika)</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Tüm yeni terapistler için varsayılan seans süresi
                                        </p>
                                    </div>
                                    <Input
                                        id="default-session-duration"
                                        type="number"
                                        min="15"
                                        max="180"
                                        step="5"
                                        value={defaultSessionDuration}
                                        onChange={(e) => setDefaultSessionDuration(parseInt(e.target.value))}
                                        className="w-24"
                                    />
                                </div>

                                <Separator />

                                <WeeklyScheduleEditor
                                    value={defaultSchedule}
                                    onChange={setDefaultSchedule}
                                    sessionDuration={defaultSessionDuration}
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Varsayılan Programı Kaydet
                                </Button>
                            </div>

                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Not:</strong> Bu varsayılan program sadece yeni oluşturulan terapistlere uygulanır.
                                    Mevcut terapistlerin programları değişmez. Her terapist kendi Settings sayfasından
                                    programını özelleştirebilir.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

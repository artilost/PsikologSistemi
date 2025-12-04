'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  FileText,
  Bell,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatTime, getInitials, statusLabels } from '@/lib/utils';
import { reportsApi, appointmentsApi, authApi, type DashboardStats } from '@/lib/api';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

function StatCard({ title, value, description, icon, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-lift">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={`flex items-center text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent activities removed - will be added when API endpoint is ready

// Client Dashboard Component
function ClientDashboard({ userName, userId }: { userName: string; userId: string }) {
  const [loading, setLoading] = useState(true);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClientProfile() {
      try {
        setLoading(true);
        // Get user profile to find client profile ID
        const profileResponse = await authApi.me();
        if (profileResponse.data.success && profileResponse.data.data) {
          const user = profileResponse.data.data as any;
          // Client profile ID is in user.clientProfile.id
          if (user.clientProfile?.id) {
            setClientProfileId(user.clientProfile.id);
          } else {
            // Client profile should exist for CLIENT role users
            // If it doesn't exist, it means the profile wasn't created during registration
            // We'll show an error message to the user
            setError('Profil bilgileriniz eksik. Lütfen yönetici ile iletişime geçin.');
            setLoading(false);
          }
        }
      } catch (err: any) {
        // If 401 Unauthorized, logout user
        if (err?.response?.status === 401 || err?.message?.includes('401')) {
          if (typeof window !== 'undefined') {
            const { signOut } = await import('next-auth/react');
            signOut({ callbackUrl: '/login', redirect: true });
          }
          return;
        }
        // On other errors, still try with userId
        setClientProfileId(userId);
      }
    }

    if (userId) {
      fetchClientProfile();
    } else {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    async function fetchMyData() {
      if (!clientProfileId) {
        setLoading(false);
        setError('Profil bilgileri yüklenemedi. Lütfen sayfayı yenileyin.');
        return;
      }

      try {
        setError(null);
        setLoading(true);
        // Get upcoming appointments (future dates only)
        const now = new Date();
        const response = await appointmentsApi.list({ 
          clientId: clientProfileId,
          limit: 5,
          startDate: now.toISOString(), // Only future appointments
        });
        
        if (response.data.success && response.data.data) {
          // Transform appointments to include therapist info if available
          const appointments = response.data.data.map((apt: any) => ({
            id: apt.id,
            therapistId: apt.therapistId,
            therapistName: apt.therapist?.user?.firstName 
              ? `${apt.therapist.user.firstName} ${apt.therapist.user.lastName || ''}`.trim()
              : 'Terapist',
            startTime: apt.startTime,
            endTime: apt.endTime,
            status: apt.status,
            type: apt.type || 'Bireysel Terapi',
          }));
          
          setMyAppointments(appointments);
        } else {
          setMyAppointments([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch appointments:', err);
        const errorMessage = err.response?.status === 404 
          ? 'Randevu bulunamadı'
          : err.response?.status === 403
          ? 'Bu işlem için yetkiniz yok'
          : 'Randevular yüklenirken bir hata oluştu';
        setError(errorMessage);
        setMyAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    if (clientProfileId) {
      fetchMyData();
    }
  }, [clientProfileId]);

  return (
    <div className="flex flex-col">
      <Header 
        title={`Hoş Geldiniz, ${userName}!`} 
        description="Randevularınızı ve bilgilerinizi buradan takip edebilirsiniz" 
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/appointments">
            <Card className="hover-lift cursor-pointer border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Randevu Al</h3>
                  <p className="text-sm text-muted-foreground">Yeni randevu oluşturun</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover-lift cursor-pointer border-primary/20 hover:border-primary/50 transition-colors">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Seans Notları</h3>
                <p className="text-sm text-muted-foreground">Geçmiş seanslarınız</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift cursor-pointer border-primary/20 hover:border-primary/50 transition-colors">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">Ödemeler</h3>
                <p className="text-sm text-muted-foreground">Ödeme geçmişiniz</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Yaklaşan Randevularınız
            </CardTitle>
            <CardDescription>
              Planlanmış randevularınızı görüntüleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
              </div>
            )}
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : myAppointments.length > 0 ? (
              <div className="space-y-4">
                {myAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.therapistName || 'Terapist'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(appointment.startTime).toLocaleDateString('tr-TR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {appointment.type}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={appointment.status === 'CONFIRMED' ? 'success' : 'secondary'}
                    >
                      {statusLabels[appointment.status] || appointment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Yaklaşan randevunuz bulunmuyor</p>
                <p className="text-sm mt-1">Yeni randevu almak için tıklayın</p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/appointments">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Randevu Al
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Bildirimler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Hoş geldiniz!</p>
                  <p className="text-xs text-muted-foreground">
                    Psikoloji Yönetim Sistemine başarıyla giriş yaptınız.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Admin/Therapist Dashboard Component
function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await reportsApi.getDashboard();
        if (response.data.success && response.data.data) {
          // Map backend response to frontend format
          setStats({
            totalClients: response.data.data.totalClients || 0,
            totalAppointments: response.data.data.totalAppointments || 0,
            todayAppointments: response.data.data.todayAppointments || 0,
            totalRevenue: 0, // Backend doesn't return this in dashboard stats
            pendingPayments: response.data.data.pendingPayments || 0,
          });
        }
      } catch (err: any) {
        // Only log error, don't show mock data
        console.error('Failed to fetch dashboard stats:', err);
        if (err.response?.status !== 403) {
          // Only set empty stats if it's not a permission error
          setStats({
            totalClients: 0,
            totalAppointments: 0,
            todayAppointments: 0,
            totalRevenue: 0,
            pendingPayments: 0,
          });
        }
      } finally {
        setLoading(false);
      }
    }

    async function fetchTodayAppointments() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const response = await appointmentsApi.list({
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString(),
          limit: 10,
        });

        if (response.data.success && response.data.data) {
          const appointments = response.data.data.map((apt: any) => ({
            id: apt.id,
            clientName: apt.client?.user?.firstName 
              ? `${apt.client.user.firstName} ${apt.client.user.lastName || ''}`.trim()
              : 'Danışan',
            time: new Date(apt.startTime),
            status: apt.status,
            type: apt.type || 'Bireysel Terapi',
          }));
          setTodayAppointments(appointments);
        }
      } catch (err) {
        console.error('Failed to fetch today appointments:', err);
        setTodayAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    }

    fetchStats();
    fetchTodayAppointments();
  }, []);

  return (
    <div className="flex flex-col">
      <Header title="Dashboard" description="Kliniğinize hoş geldiniz" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Toplam Danışan"
            value={stats?.totalClients || 0}
            description="aktif danışan"
            icon={<Users className="h-4 w-4 text-primary" />}
            trend={{ value: 12, isPositive: true }}
            loading={loading}
          />
          <StatCard
            title="Bugünkü Randevular"
            value={stats?.todayAppointments || 0}
            description="randevu planlandı"
            icon={<Calendar className="h-4 w-4 text-primary" />}
            loading={loading}
          />
          <StatCard
            title="Aylık Gelir"
            value={formatCurrency(stats?.totalRevenue || 0)}
            description="bu ay"
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            trend={{ value: 8, isPositive: true }}
            loading={loading}
          />
          <StatCard
            title="Bekleyen Ödeme"
            value={formatCurrency(stats?.pendingPayments || 0)}
            description="tahsil edilmedi"
            icon={<CreditCard className="h-4 w-4 text-primary" />}
            loading={loading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bugünkü Randevular</CardTitle>
                <CardDescription>
                  {appointmentsLoading ? 'Yükleniyor...' : `${todayAppointments.length} randevu planlandı`}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/appointments">Tümünü Gör</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : todayAppointments.length > 0 ? (
                todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(appointment.clientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{appointment.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatTime(appointment.time)}
                      </div>
                      <Badge
                        variant={
                          appointment.status === 'CONFIRMED' ? 'success' : 'secondary'
                        }
                        className="mt-1"
                      >
                        {statusLabels[appointment.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Bugün için randevu bulunmuyor</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity - Removed mock data, will be added when API is ready */}
          {/* 
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Son Aktiviteler</CardTitle>
                <CardDescription>Kliniğinizdeki son işlemler</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Son aktiviteler yakında eklenecek</p>
              </div>
            </CardContent>
          </Card>
          */}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  // Get user role and ID from session
  const userRole = (session?.user as any)?.role || 'CLIENT';
  const userName = session?.user?.name?.split(' ')[0] || 'Kullanıcı';
  const userId = (session?.user as any)?.id || '';

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex flex-col">
        <Header title="Yükleniyor..." description="" />
        <div className="flex-1 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show client dashboard for CLIENT role
  if (userRole === 'CLIENT') {
    return <ClientDashboard userName={userName} userId={userId} />;
  }

  // Show admin dashboard for ADMIN, THERAPIST, SUPER_ADMIN
  return <AdminDashboard />;
}

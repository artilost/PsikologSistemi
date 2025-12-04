'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Loader2,
  Download,
  RefreshCw,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api';

function formatCurrency(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [appointmentStats, setAppointmentStats] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [therapistPerformance, setTherapistPerformance] = useState<any[]>([]);

  const userRole = (session?.user as { role?: string })?.role || 'CLIENT';
  const canAccess = ['SUPER_ADMIN', 'ADMIN', 'THERAPIST'].includes(userRole);
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);

  useEffect(() => {
    fetchReports();
  }, [dateRange, canAccess]);

  const fetchReports = async () => {
    if (!canAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch dashboard stats
      const dashboardRes = await reportsApi.getDashboard();
      if (dashboardRes.data.success) {
        setDashboardStats(dashboardRes.data.data);
      }

      // Fetch appointment stats
      const appointmentRes = await reportsApi.getAppointmentStats({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      if (appointmentRes.data.success) {
        setAppointmentStats(appointmentRes.data.data);
      }

      // Admin-only reports
      if (isAdmin) {
        // Fetch revenue stats
        const revenueRes = await reportsApi.getRevenue({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        if (revenueRes.data.success) {
          setRevenueStats(revenueRes.data.data);
        }

        // Fetch therapist performance
        const performanceRes = await reportsApi.getTherapistPerformance({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        if (performanceRes.data.success) {
          setTherapistPerformance(performanceRes.data.data || []);
        }
      }
    } catch (error) {
      toast.error('Raporlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header title="Raporlar" />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erişim Kısıtlı</h3>
              <p className="text-sm text-muted-foreground">
                Raporlara sadece terapistler ve yöneticiler erişebilir.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header title="Raporlar" />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Raporlar ve İstatistikler</h1>
              <p className="text-muted-foreground">
                Klinik performansını analiz edin
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchReports} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
            </div>
          </div>

          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tarih Aralığı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="mt-2"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="endDate">Bitiş Tarihi</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="mt-2"
                  />
                </div>
                <div className="flex items-end">
                  <Select
                    value=""
                    onValueChange={(value) => {
                      const today = new Date();
                      let start: Date;
                      let end = today;

                      switch (value) {
                        case 'today':
                          start = today;
                          break;
                        case 'week':
                          start = subDays(today, 7);
                          break;
                        case 'month':
                          start = startOfMonth(today);
                          end = endOfMonth(today);
                          break;
                        case 'quarter':
                          start = subDays(today, 90);
                          break;
                        default:
                          return;
                      }

                      setDateRange({
                        startDate: format(start, 'yyyy-MM-dd'),
                        endDate: format(end, 'yyyy-MM-dd'),
                      });
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Hızlı Seçim" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Bugün</SelectItem>
                      <SelectItem value="week">Son 7 Gün</SelectItem>
                      <SelectItem value="month">Bu Ay</SelectItem>
                      <SelectItem value="quarter">Son 3 Ay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              {dashboardStats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Toplam Danışan</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.totalClients || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Toplam Randevu</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.totalAppointments || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Bugünkü Randevu</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.todayAppointments || 0}</div>
                    </CardContent>
                  </Card>
                  {isAdmin && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(dashboardStats.totalRevenue || 0)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Appointment Stats */}
              {appointmentStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Randevu İstatistikleri</CardTitle>
                    <CardDescription>
                      {format(new Date(dateRange.startDate), 'd MMMM', { locale: tr })} -{' '}
                      {format(new Date(dateRange.endDate), 'd MMMM yyyy', { locale: tr })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Toplam</p>
                        <p className="text-2xl font-bold">{appointmentStats.total || 0}</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">Tamamlanan</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {appointmentStats.completed || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">İptal Edilen</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                          {appointmentStats.cancelled || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Gelmedi</p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                          {appointmentStats.noShow || 0}
                        </p>
                      </div>
                    </div>
                    {appointmentStats.completionRate !== undefined && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400">Tamamlanma Oranı</p>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                          %{(appointmentStats.completionRate * 100).toFixed(1)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Revenue Stats (Admin Only) */}
              {isAdmin && revenueStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Gelir Raporu</CardTitle>
                    <CardDescription>
                      Dönem içi toplam gelir ve dağılım
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
                        <p className="text-sm opacity-80">Toplam Gelir</p>
                        <p className="text-4xl font-bold">{formatCurrency(revenueStats.total || 0)}</p>
                      </div>

                      {revenueStats.byMethod && revenueStats.byMethod.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Ödeme Yöntemine Göre</h4>
                          <div className="grid gap-2">
                            {revenueStats.byMethod.map((item: any) => (
                              <div
                                key={item.method}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                              >
                                <span className="font-medium">
                                  {item.method === 'CASH'
                                    ? 'Nakit'
                                    : item.method === 'CREDIT_CARD'
                                    ? 'Kredi Kartı'
                                    : item.method === 'BANK_TRANSFER'
                                    ? 'Havale/EFT'
                                    : item.method}
                                </span>
                                <span className="font-bold">{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Therapist Performance (Admin Only) */}
              {isAdmin && therapistPerformance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Terapist Performansı</CardTitle>
                    <CardDescription>Terapistlerin dönem içi performans özeti</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Terapist</TableHead>
                          <TableHead>Toplam Seans</TableHead>
                          <TableHead>Tamamlanan</TableHead>
                          <TableHead>Toplam Gelir</TableHead>
                          <TableHead>Performans</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {therapistPerformance.map((therapist: any) => (
                          <TableRow key={therapist.therapistId}>
                            <TableCell className="font-medium">
                              {therapist.therapistName}
                            </TableCell>
                            <TableCell>{therapist.totalSessions}</TableCell>
                            <TableCell>{therapist.completedSessions}</TableCell>
                            <TableCell>{formatCurrency(therapist.totalRevenue)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  therapist.completedSessions / therapist.totalSessions >= 0.8
                                    ? 'default'
                                    : therapist.completedSessions / therapist.totalSessions >= 0.5
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                %
                                {therapist.totalSessions > 0
                                  ? (
                                      (therapist.completedSessions / therapist.totalSessions) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}


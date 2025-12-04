'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Plus,
  CreditCard,
  DollarSign,
  Clock,
  User,
  Calendar,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { paymentsApi, clientsApi, sessionsApi, type Payment, type Client, type Session } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Bekliyor',
  PAID: 'Tamamlandı',
  PARTIALLY_PAID: 'Kısmen Ödendi',
  REFUNDED: 'İade Edildi',
  CANCELLED: 'İptal Edildi',
  FAILED: 'Başarısız',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  REFUNDED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Nakit',
  CREDIT_CARD: 'Kredi Kartı',
  BANK_TRANSFER: 'Havale/EFT',
  ONLINE: 'Online',
  INSURANCE: 'Sigorta',
};

export default function PaymentsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role || 'CLIENT';
  const canAccess = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'].includes(userRole);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (canAccess) {
      fetchPayments();
      fetchClients();
    } else {
      setLoading(false);
    }
  }, [canAccess, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await paymentsApi.list(params);
      let paymentsData: Payment[] = [];
      if (response.data.success && response.data.data) {
        paymentsData = response.data.data;
        setPayments(paymentsData);
      }

      // Calculate stats from paymentsData
      const pendingCount = paymentsData.filter(p => p.status === 'PENDING' || p.status === 'PARTIALLY_PAID').length;
      const paidCount = paymentsData.filter(p => p.status === 'PAID').length;

      const calculatedPendingAmount = paymentsData.reduce((sum, p) => {
        if (p.status === 'PENDING') {
          return sum + Number(p.amount);
        } else if (p.status === 'PARTIALLY_PAID' && p.remainingAmount) {
          return sum + Number(p.remainingAmount);
        }
        return sum;
      }, 0);

      const calculatedTotalRevenue = paymentsData.reduce((sum, p) => {
        if (p.status === 'PAID' || p.status === 'PARTIALLY_PAID') {
          const paid = Number(p.paidAmount || 0);
          const refunded = Number(p.refundAmount || 0);
          return sum + (paid - refunded);
        } else if (p.status === 'REFUNDED') {
          const paid = Number(p.paidAmount || 0);
          const refunded = Number(p.refundAmount || 0);
          return sum + (paid - refunded);
        }
        return sum;
      }, 0);

      setStats({
        totalRevenue: calculatedTotalRevenue,
        pendingAmount: calculatedPendingAmount,
        paidCount: paidCount,
        pendingCount: pendingCount,
      });
    } catch (error: any) {
      toast.error(error.message || 'Ödemeler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsApi.list({ limit: 100 });
      if (response.data?.success && response.data?.data) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const refreshPayments = async () => {
    await fetchPayments();
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const userName = `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.toLowerCase();
    const userEmail = (p.user?.email || '').toLowerCase();
    return userName.includes(searchQuery.toLowerCase()) || userEmail.includes(searchQuery.toLowerCase());
  });

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const handleProcessPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setProcessDialogOpen(true);
  };

  const handleRefundPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setRefundDialogOpen(true);
  };

  const handleCancelPayment = async (id: string) => {
    if (!confirm('Bu ödemeyi iptal etmek istediğinize emin misiniz?')) return;

    try {
      await paymentsApi.delete(id);
      toast.success('Ödeme iptal edildi');
      refreshPayments();
    } catch (error: any) {
      toast.error(error.message || 'Ödeme iptal edilirken bir hata oluştu');
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditDialogOpen(true);
  };

  if (!canAccess) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Erişim Reddedildi</h2>
                <p className="text-muted-foreground">Bu sayfaya erişim yetkiniz yok.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Ödemeler</h1>
              <p className="text-muted-foreground">Ödeme işlemlerini yönetin</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ödeme Oluştur
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
                <p className="text-xs text-muted-foreground">{stats.pendingCount} ödeme</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.paidCount}</div>
                <p className="text-xs text-muted-foreground">ödeme</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingCount}</div>
                <p className="text-xs text-muted-foreground">ödeme</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Danışan ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum Filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="PENDING">Bekliyor</SelectItem>
                <SelectItem value="PAID">Tamamlandı</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Kısmen Ödendi</SelectItem>
                <SelectItem value="REFUNDED">İade Edildi</SelectItem>
                <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refreshPayments}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Payments Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">Ödeme bulunamadı</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Danışan</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Ödeme Yöntemi</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {p.user?.firstName} {p.user?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{p.user?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold">{formatCurrency(p.amount, p.currency)}</p>
                            {p.status === 'PARTIALLY_PAID' && p.paidAmount !== undefined && p.remainingAmount !== undefined && (
                              <p className="text-sm text-orange-500 dark:text-orange-400">
                                Ödendi: {formatCurrency(p.paidAmount, p.currency)} • Kaldı: {formatCurrency(p.remainingAmount, p.currency)}
                              </p>
                            )}
                            {p.status === 'REFUNDED' && p.refundAmount !== undefined && (
                              <p className="text-sm text-purple-600 dark:text-purple-300">
                                İade edildi: {formatCurrency(p.refundAmount, p.currency)} {p.refundReason && `(${p.refundReason})`}
                              </p>
                            )}
                            {p.status === 'PENDING' && (
                              <p className="text-sm text-yellow-600 mt-1">
                                Bekliyor
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentStatusColors[p.status] || ''}>
                            {paymentStatusLabels[p.status] || p.status}
                          </Badge>
                          {p.status === 'PAID' && p.paidAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(p.paidAt), 'd MMM yyyy HH:mm', { locale: tr })}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.method ? paymentMethodLabels[p.method] || p.method : '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(p.createdAt), 'd MMM yyyy', { locale: tr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(p)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Detayları Gör
                              </DropdownMenuItem>
                              {/* Show process button for PENDING, PARTIALLY_PAID, or payments with refund that have remaining amount */}
                              {/* İade yapıldıktan sonra kalan tutar varsa (remainingAmount > 0) ödeme alınabilmeli */}
                              {(p.status === 'PENDING' || 
                                p.status === 'PARTIALLY_PAID' || 
                                (p.refundAmount && Number(p.refundAmount) > 0 && (Number(p.remainingAmount || 0) > 0 || Number(p.amount) > Number(p.paidAmount || 0)))) && (
                                <DropdownMenuItem onClick={() => handleProcessPayment(p)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  {p.status === 'PARTIALLY_PAID' 
                                    ? 'Kalan Ödemeyi Al' 
                                    : (p.refundAmount && Number(p.refundAmount) > 0)
                                    ? 'Tekrar Ödeme Al' 
                                    : 'Ödeme Al'}
                                </DropdownMenuItem>
                              )}
                              {p.status === 'PENDING' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditPayment(p)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Tutarı Düzenle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleCancelPayment(p.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    İptal Et
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(p.status === 'PAID' || (p.status === 'PARTIALLY_PAID' && p.paidAmount && p.paidAmount > 0)) && (
                                <DropdownMenuItem onClick={() => handleRefundPayment(p)}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  İade Et
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <PaymentDetailDialog
        payment={selectedPayment}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
      <ProcessPaymentDialog
        payment={selectedPayment}
        open={processDialogOpen}
        onOpenChange={setProcessDialogOpen}
        onProcess={refreshPayments}
      />
      <RefundDialog
        payment={selectedPayment}
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        onRefund={refreshPayments}
      />
      <EditPaymentDialog
        payment={selectedPayment}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={refreshPayments}
      />
      <CreatePaymentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={refreshPayments}
      />
    </div>
  );
}

// Payment Detail Dialog
function PaymentDetailDialog({
  payment,
  open,
  onOpenChange,
}: {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ödeme Detayları</DialogTitle>
          <DialogDescription>
            {payment.user?.firstName} {payment.user?.lastName} - {format(new Date(payment.createdAt), 'd MMMM yyyy', { locale: tr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Tutar</Label>
              <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Ödeme Yöntemi</Label>
              <p className="font-medium">{payment.method ? paymentMethodLabels[payment.method] || payment.method : '-'}</p>
            </div>
            {payment.remainingAmount !== undefined && payment.remainingAmount > 0 && (
              <div>
                <Label className="text-muted-foreground">Kalan Tutar</Label>
                <p className="font-medium text-red-600">
                  {formatCurrency(payment.remainingAmount, payment.currency)}
                </p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Durum</Label>
              <Badge className={paymentStatusColors[payment.status] || ''}>
                {paymentStatusLabels[payment.status] || payment.status}
              </Badge>
            </div>
            {payment.paidAmount !== undefined && (
              <div>
                <Label className="text-muted-foreground">Ödenen Tutar</Label>
                <p className="font-medium">{formatCurrency(payment.paidAmount, payment.currency)}</p>
              </div>
            )}
          </div>

          {payment.notes && (
            <div>
              <Label className="text-muted-foreground">Notlar</Label>
              <p className="mt-1 p-3 bg-muted rounded-md">{payment.notes}</p>
            </div>
          )}

          {payment.refundedAt && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
              <Label className="text-purple-700 dark:text-purple-300">İade Bilgileri</Label>
              <p className="text-sm mt-1">
                İade Tarihi: {format(new Date(payment.refundedAt), 'd MMMM yyyy HH:mm', { locale: tr })}
              </p>
              {payment.refundAmount && (
                <p className="text-sm">İade Tutarı: {formatCurrency(payment.refundAmount, payment.currency)}</p>
              )}
              {payment.refundReason && (
                <p className="text-sm">Sebep: {payment.refundReason}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Process Payment Dialog
function ProcessPaymentDialog({
  payment,
  open,
  onOpenChange,
  onProcess,
}: {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcess: () => void;
}) {
  const [method, setMethod] = useState('CASH');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (payment && open) {
      let defaultAmount: string;
      if (payment.status === 'PARTIALLY_PAID' && payment.remainingAmount) {
        defaultAmount = payment.remainingAmount.toString();
      } else if (payment.refundAmount && Number(payment.refundAmount) > 0) {
        defaultAmount = payment.remainingAmount 
          ? payment.remainingAmount.toString() 
          : (Number(payment.amount) - Number(payment.paidAmount || 0)).toString();
      } else {
        defaultAmount = payment.amount.toString();
      }
      setAmount(defaultAmount);
      setMethod(payment.method || 'CASH');
    }
  }, [payment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !amount) return;

    const paidAmount = Number(amount);
    // İade yapıldıktan sonra kalan tutarı hesapla
    // Eğer remainingAmount varsa onu kullan, yoksa amount - paidAmount hesapla
    let maxAmount: number;
    if (payment.status === 'PARTIALLY_PAID' && payment.remainingAmount) {
      maxAmount = Number(payment.remainingAmount);
    } else if (payment.refundAmount && Number(payment.refundAmount) > 0) {
      // İade yapılmışsa, kalan tutar = amount - (paidAmount - refundAmount) = amount - paidAmount + refundAmount
      // Ama daha basit: amount - currentPaidAmount
      const currentPaid = Number(payment.paidAmount || 0);
      maxAmount = Number(payment.amount) - currentPaid;
    } else {
      maxAmount = Number(payment.amount) - Number(payment.paidAmount || 0);
    }

    if (maxAmount <= 0) {
      toast.error('Bu ödeme için kalan tutar yok');
      return;
    }

    if (paidAmount > maxAmount) {
      toast.error(`Maksimum tutar: ${formatCurrency(maxAmount, payment.currency)}`);
      return;
    }

    try {
      setProcessing(true);
      await paymentsApi.process(payment.id, {
        method,
        paidAmount,
      });
      toast.success('Ödeme işlendi');
      onProcess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Ödeme işlenirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ödeme Al</DialogTitle>
          <DialogDescription>
            {payment.user?.firstName} {payment.user?.lastName} için ödeme alın
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label>Toplam Tutar</Label>
              <p className="text-2xl font-bold">{formatCurrency(payment.amount, payment.currency)}</p>
              {payment.status === 'PARTIALLY_PAID' && payment.paidAmount && (
                <p className="text-sm text-muted-foreground mt-1">
                  Ödenen: {formatCurrency(payment.paidAmount, payment.currency)}
                </p>
              )}
              {payment.status === 'PARTIALLY_PAID' && payment.remainingAmount && (
                <p className="text-sm text-orange-600 font-medium mt-1">
                  Kalan: {formatCurrency(payment.remainingAmount, payment.currency)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Ödeme Tutarı *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={payment.status === 'PARTIALLY_PAID' && payment.remainingAmount ? payment.remainingAmount : payment.amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="method">Ödeme Yöntemi *</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Nakit</SelectItem>
                  <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Havale/EFT</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="INSURANCE">Sigorta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
              İptal
            </Button>
            <Button type="submit" disabled={processing || !amount}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ödeme Al
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Refund Dialog
function RefundDialog({
  payment,
  open,
  onOpenChange,
  onRefund,
}: {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefund: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (payment && open) {
      setAmount(payment.paidAmount?.toString() || payment.amount.toString());
      setReason('');
    }
  }, [payment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !amount || !reason) return;

    const refundAmount = Number(amount);
    const maxAmount = Number(payment.paidAmount || payment.amount);

    if (refundAmount > maxAmount) {
      toast.error(`Maksimum iade tutarı: ${formatCurrency(maxAmount, payment.currency)}`);
      return;
    }

    try {
      setProcessing(true);
      await paymentsApi.refund(payment.id, {
        refundAmount,
        refundReason: reason,
      });
      toast.success('İade yapıldı');
      onRefund();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'İade yapılırken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>İade Yap</DialogTitle>
          <DialogDescription>
            {payment.user?.firstName} {payment.user?.lastName} için iade işlemi
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label>Ödenen Tutar</Label>
              <p className="text-2xl font-bold">{formatCurrency(Number(payment.paidAmount || payment.amount), payment.currency)}</p>
            </div>

            <div>
              <Label htmlFor="amount">İade Tutarı *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={Number(payment.paidAmount || payment.amount)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="reason">İade Sebebi *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
                placeholder="İade sebebini açıklayın..."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
              İptal
            </Button>
            <Button type="submit" disabled={processing || !amount || !reason}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              İade Yap
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Payment Dialog
function EditPaymentDialog({
  payment,
  open,
  onOpenChange,
  onUpdate,
}: {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment && open) {
      setAmount(payment.amount.toString());
      setDescription(payment.description || '');
    }
  }, [payment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !amount) return;

    try {
      setLoading(true);
      await paymentsApi.update(payment.id, {
        amount: Number(amount),
        description: description || undefined,
      });
      toast.success('Ödeme tutarı güncellendi');
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Ödeme güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ödeme Tutarını Düzenle</DialogTitle>
          <DialogDescription>
            {payment.user?.firstName} {payment.user?.lastName} için ödeme tutarını güncelleyin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Tutar *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2"
                placeholder="Ödeme açıklaması..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading || !amount}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Güncelle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Payment Dialog
function CreatePaymentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState('none');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (open) {
      fetchClients();
      setUserId('');
      setSessionId('none');
      setAmount('');
      setMethod('CASH');
      setNotes('');
    }
  }, [open]);

  useEffect(() => {
    if (userId && userId !== 'none') {
      fetchSessions(userId);
    } else {
      setSessions([]);
    }
  }, [userId]);

  const fetchClients = async () => {
    try {
      const response = await clientsApi.list({ limit: 100 });
      if (response.data?.success && response.data?.data) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast.error('Danışanlar yüklenirken bir hata oluştu');
    }
  };

  const fetchSessions = async (clientUserId: string) => {
    try {
      const response = await sessionsApi.getClientHistory(clientUserId);
      if (response.data?.success && response.data?.data) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount) return;

    try {
      setLoading(true);
      const data: any = {
        userId,
        amount: Number(amount),
        method,
      };
      if (sessionId && sessionId !== 'none') {
        data.sessionId = sessionId;
      }
      if (notes) {
        data.notes = notes;
      }
      await paymentsApi.create(data);
      toast.success('Ödeme oluşturuldu');
      onCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Ödeme oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Ödeme Oluştur</DialogTitle>
          <DialogDescription>Yeni bir ödeme kaydı oluşturun</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Danışan *</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Danışan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <SelectItem value="none" disabled>Henüz danışan bulunmuyor.</SelectItem>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.userId}>
                        {client.user.firstName} {client.user.lastName} ({client.user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {userId && userId !== 'none' && (
              <div>
                <Label htmlFor="session">Seans (Opsiyonel)</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seans seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seans yok</SelectItem>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.appointment && format(new Date(session.appointment.startTime), 'd MMM yyyy HH:mm', { locale: tr })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="amount">Tutar *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="method">Ödeme Yöntemi *</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Nakit</SelectItem>
                  <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Havale/EFT</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="INSURANCE">Sigorta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                placeholder="Ödeme ile ilgili notlar..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading || !userId || !amount}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

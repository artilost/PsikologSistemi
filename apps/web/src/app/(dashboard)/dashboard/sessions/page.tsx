'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  FileText,
  Clock,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle2,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { sessionsApi, authApi, type Session } from '@/lib/api';

const noteStatusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  COMPLETED: 'Tamamlandı',
  REVIEWED: 'İncelendi',
  ARCHIVED: 'Arşivlendi',
};

const noteStatusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REVIEWED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export default function SessionsPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [therapistProfileId, setTherapistProfileId] = useState<string | null>(null);

  const userRole = (session?.user as { role?: string })?.role || 'CLIENT';

  // Get therapist profile ID if user is a therapist
  useEffect(() => {
    if (userRole === 'THERAPIST') {
      authApi.me().then(response => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (response.data.success && (response.data.data as any).therapistProfile?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTherapistProfileId((response.data.data as any).therapistProfile.id);
        }
      }).catch(() => {
        // Ignore errors
      });
    }
  }, [userRole]);

  // Fetch sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = { limit: 100 };

        if (userRole === 'THERAPIST' && therapistProfileId) {
          params.therapistId = therapistProfileId;
        }

        if (statusFilter !== 'all') {
          params.noteStatus = statusFilter;
        }

        const response = await sessionsApi.list(params);
        if (response.data.success && response.data.data) {
          setSessions(response.data.data);
        }
      } catch (error) {
        toast.error('Seanslar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    if (userRole !== 'CLIENT') {
      if (userRole === 'THERAPIST') {
        if (therapistProfileId) {
          fetchSessions();
        }
      } else {
        fetchSessions();
      }
    } else {
      setLoading(false);
    }
  }, [userRole, therapistProfileId, statusFilter]);

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery) return true;
    const clientName = `${s.client?.user?.firstName || ''} ${s.client?.user?.lastName || ''}`.toLowerCase();
    const therapistName = `${s.therapist?.user?.firstName || ''} ${s.therapist?.user?.lastName || ''}`.toLowerCase();
    return clientName.includes(searchQuery.toLowerCase()) || therapistName.includes(searchQuery.toLowerCase());
  });

  const handleViewDetails = (session: Session) => {
    setSelectedSession(session);
    setDetailDialogOpen(true);
  };

  const handleEditNotes = (session: Session) => {
    setSelectedSession(session);
    setEditDialogOpen(true);
  };

  const handleSignSession = async (session: Session) => {
    try {
      await sessionsApi.sign(session.id);
      toast.success('Seans notları imzalandı');
      // Refresh sessions
      const response = await sessionsApi.list({ limit: 100 });
      if (response.data.success && response.data.data) {
        setSessions(response.data.data);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || 'Seans imzalanırken bir hata oluştu');
    }
  };

  if (userRole === 'CLIENT') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header title="Seanslar" />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erişim Kısıtlı</h3>
              <p className="text-sm text-muted-foreground">
                Seans notlarına sadece terapistler ve yöneticiler erişebilir.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header title="Seanslar" />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Seans Yönetimi</h1>
              <p className="text-muted-foreground">
                Terapi seanslarını ve notlarını yönetin
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Danışan veya terapist ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Durum Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="DRAFT">Taslak</SelectItem>
                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                <SelectItem value="REVIEWED">İncelendi</SelectItem>
                <SelectItem value="ARCHIVED">Arşivlendi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Seanslar</CardTitle>
              <CardDescription>
                {filteredSessions.length} seans bulundu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Seans bulunamadı</h3>
                  <p className="text-sm text-muted-foreground">
                    Henüz kayıtlı seans bulunmuyor.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Danışan</TableHead>
                      {userRole !== 'THERAPIST' && <TableHead>Terapist</TableHead>}
                      <TableHead>Süre</TableHead>
                      <TableHead>Not Durumu</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {s.appointment?.startTime
                                  ? format(new Date(s.appointment.startTime), 'd MMMM yyyy', { locale: tr })
                                  : '-'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {s.appointment?.startTime
                                  ? format(new Date(s.appointment.startTime), 'HH:mm', { locale: tr })
                                  : '-'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {s.client?.user?.firstName?.[0]}
                                {s.client?.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {s.client?.user?.firstName} {s.client?.user?.lastName}
                            </span>
                          </div>
                        </TableCell>
                        {userRole !== 'THERAPIST' && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {s.therapist?.user?.firstName?.[0]}
                                  {s.therapist?.user?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {s.therapist?.user?.firstName} {s.therapist?.user?.lastName}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{s.duration || 50} dk</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={noteStatusColors[s.noteStatus] || ''}>
                            {noteStatusLabels[s.noteStatus] || s.noteStatus}
                          </Badge>
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
                              <DropdownMenuItem onClick={() => handleViewDetails(s)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Detayları Gör
                              </DropdownMenuItem>
                              {s.noteStatus === 'DRAFT' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditNotes(s)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Notları Düzenle
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleSignSession(s)}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    İmzala
                                  </DropdownMenuItem>
                                </>
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
      </main>

      {/* Session Detail Dialog */}
      <SessionDetailDialog
        session={selectedSession}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Edit Notes Dialog */}
      <EditNotesDialog
        session={selectedSession}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={async (notes) => {
          if (!selectedSession) return;
          try {
            await sessionsApi.updateNotes(selectedSession.id, notes);
            toast.success('Notlar güncellendi');
            setEditDialogOpen(false);
            // Refresh
            const response = await sessionsApi.list({ limit: 100 });
            if (response.data.success && response.data.data) {
              setSessions(response.data.data);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            toast.error(error.message || 'Notlar güncellenirken bir hata oluştu');
          }
        }}
      />
    </div>
  );
}

// Session Detail Dialog Component
function SessionDetailDialog({
  session: sessionData,
  open,
  onOpenChange,
}: {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: authSession } = useSession();
  const userRole = (authSession?.user as { role?: string })?.role || 'CLIENT';

  if (!sessionData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seans Detayları</DialogTitle>
          <DialogDescription>
            {sessionData.client?.user?.firstName} {sessionData.client?.user?.lastName} -{' '}
            {sessionData.appointment?.startTime
              ? format(new Date(sessionData.appointment.startTime), 'd MMMM yyyy HH:mm', { locale: tr })
              : '-'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Danışan</Label>
              <p className="font-medium">
                {sessionData.client?.user?.firstName} {sessionData.client?.user?.lastName}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Terapist</Label>
              <p className="font-medium">
                {sessionData.therapist?.user?.firstName} {sessionData.therapist?.user?.lastName}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Seans No</Label>
              <p className="font-medium">{sessionData.sessionNumber || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Süre</Label>
              <p className="font-medium">{sessionData.duration || 50} dakika</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Not Durumu</Label>
              <Badge className={noteStatusColors[sessionData.noteStatus] || ''}>
                {noteStatusLabels[sessionData.noteStatus] || sessionData.noteStatus}
              </Badge>
            </div>
            {sessionData.signedAt && (
              <div>
                <Label className="text-muted-foreground">İmza Tarihi</Label>
                <p className="font-medium">
                  {format(new Date(sessionData.signedAt), 'd MMMM yyyy HH:mm', { locale: tr })}
                </p>
              </div>
            )}
          </div>

          {/* Clinical Notes */}
          {sessionData.clinicalNotes && (
            <div>
              <Label className="text-muted-foreground">Klinik Notlar</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p className="whitespace-pre-wrap">{sessionData.clinicalNotes}</p>
              </div>
            </div>
          )}

          {/* Private Notes - Only visible to THERAPIST */}
          {userRole === 'THERAPIST' && sessionData.privateNotes && (
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <span>Gizli Notlar</span>
                <Badge variant="outline" className="text-xs">Sadece Terapist</Badge>
              </Label>
              <div className="mt-1 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="whitespace-pre-wrap">{sessionData.privateNotes}</p>
              </div>
            </div>
          )}

          {/* Treatment Plan */}
          {sessionData.treatmentPlan && (
            <div>
              <Label className="text-muted-foreground">Tedavi Planı</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p className="whitespace-pre-wrap">{sessionData.treatmentPlan}</p>
              </div>
            </div>
          )}

          {/* Progress Notes */}
          {sessionData.progressNotes && (
            <div>
              <Label className="text-muted-foreground">İlerleme Notları</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p className="whitespace-pre-wrap">{sessionData.progressNotes}</p>
              </div>
            </div>
          )}

          {/* Homework */}
          {sessionData.homework && (
            <div>
              <Label className="text-muted-foreground">Ev Ödevi</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p className="whitespace-pre-wrap">{sessionData.homework}</p>
              </div>
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

// Edit Notes Dialog Component
function EditNotesDialog({
  session,
  open,
  onOpenChange,
  onSave,
}: {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (notes: any) => Promise<void>;
}) {
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [homework, setHomework] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session && open) {
      setClinicalNotes(session.clinicalNotes || '');
      setPrivateNotes(session.privateNotes || '');
      setIsPrivate(session.isPrivate || false);
      setTreatmentPlan(session.treatmentPlan || '');
      setProgressNotes(session.progressNotes || '');
      setHomework(session.homework || '');
    }
  }, [session, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        clinicalNotes,
        privateNotes,
        isPrivate,
        treatmentPlan,
        progressNotes,
        homework,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seans Notlarını Düzenle</DialogTitle>
          <DialogDescription>
            {session.client?.user?.firstName} {session.client?.user?.lastName} -{' '}
            {session.appointment?.startTime
              ? format(new Date(session.appointment.startTime), 'd MMMM yyyy', { locale: tr })
              : '-'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="clinicalNotes">Klinik Notlar</Label>
            <Textarea
              id="clinicalNotes"
              value={clinicalNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClinicalNotes(e.target.value)}
              placeholder="Seans gözlemleri ve klinik değerlendirmeler..."
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Bu notlar danışan tarafından görülebilir.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrivate"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(checked === true)}
              />
              <Label htmlFor="isPrivate" className="font-medium cursor-pointer">
                Gizli Notlar (Sadece terapist görebilir)
              </Label>
            </div>
            {isPrivate && (
              <div>
                <Label htmlFor="privateNotes">Gizli Notlar</Label>
                <Textarea
                  id="privateNotes"
                  value={privateNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrivateNotes(e.target.value)}
                  placeholder="Sadece terapist tarafından görülebilecek gizli notlar..."
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ Bu notlar danışan tarafından ASLA görülemez.
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="treatmentPlan">Tedavi Planı</Label>
            <Textarea
              id="treatmentPlan"
              value={treatmentPlan}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTreatmentPlan(e.target.value)}
              placeholder="Tedavi hedefleri ve stratejiler..."
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="progressNotes">İlerleme Notları</Label>
            <Textarea
              id="progressNotes"
              value={progressNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProgressNotes(e.target.value)}
              placeholder="Danışanın ilerlemesi ve değişimleri..."
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="homework">Ev Ödevi</Label>
            <Textarea
              id="homework"
              value={homework}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHomework(e.target.value)}
              placeholder="Sonraki seansa kadar yapılacak ödevler..."
              rows={2}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


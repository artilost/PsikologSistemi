'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  FileText,
  CheckCircle2,
  Clock,
  Upload,
  Eye,
  Loader2,
  BookOpen,
  Calendar,
  User,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { homeworkApi, sessionsApi, type HomeworkSubmission, type Session, type HomeworkActivity } from '@/lib/api';

const statusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  REVIEWED: 'İncelendi',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REVIEWED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

export default function HomeworkPage() {
  const { data: session } = useSession();
  const [homeworkList, setHomeworkList] = useState<HomeworkSubmission[]>([]);
  const [sessionsWithHomework, setSessionsWithHomework] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkSubmission | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<HomeworkActivity | null>(null);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');

  const userRole = (session?.user as { role?: string })?.role || 'CLIENT';

  // Get client profile ID
  useEffect(() => {
    if (userRole === 'CLIENT') {
      import('@/lib/api').then(({ authApi }) => {
        authApi.me().then(response => {
          if (response.data.success && (response.data.data as any).clientProfile?.id) {
            setClientProfileId((response.data.data as any).clientProfile.id);
          }
        }).catch(() => {
          // Ignore errors
        });
      });
    }
  }, [userRole]);

  // Fetch homework submissions and sessions with homework
  useEffect(() => {
    async function fetchData() {
      if (userRole !== 'CLIENT') {
        setLoading(false);
        return;
      }

      if (!clientProfileId) {
        // Wait for clientProfileId to be set
        return;
      }

      try {
        setLoading(true);
        
        // Fetch my homework submissions
        const homeworkResponse = await homeworkApi.getMyHomework();
        const homeworkData = homeworkResponse.data.success && homeworkResponse.data.data 
          ? homeworkResponse.data.data 
          : [];

        if (homeworkResponse.data.success && homeworkResponse.data.data) {
          setHomeworkList(homeworkData);
        }

        // Fetch sessions with homework assignments
        const sessionsResponse = await sessionsApi.getClientHistory(
          clientProfileId,
          50
        );
        if (sessionsResponse.data.success && sessionsResponse.data.data) {
          // Filter sessions that have homework but no submission yet
          const sessionsWithHomeworkOnly = sessionsResponse.data.data.filter(
            (s: Session) => s.homework && !homeworkData.find((h: HomeworkSubmission) => h.sessionId === s.id)
          );
          setSessionsWithHomework(sessionsWithHomeworkOnly);
        }
      } catch (error: any) {
        console.error('Homework fetch error:', error);
        const errorMessage = 
          error.response?.data?.message || 
          error.response?.data?.error?.message ||
          error.message || 
          'Ev ödevleri yüklenirken bir hata oluştu';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (userRole === 'CLIENT' && clientProfileId) {
      fetchData();
    } else if (userRole !== 'CLIENT') {
      setLoading(false);
    }
  }, [userRole, clientProfileId]);

  const handleSubmitHomework = async (sessionId: string) => {
    try {
      const response = await homeworkApi.create({
        sessionId,
        status: 'IN_PROGRESS',
      });
      if (response.data.success) {
        toast.success('Ev ödevi kaydı oluşturuldu');
        setSubmitDialogOpen(false);
        // Refresh homework list
        const homeworkResponse = await homeworkApi.getMyHomework();
        const homeworkData = homeworkResponse.data.success && homeworkResponse.data.data 
          ? homeworkResponse.data.data 
          : [];
        if (homeworkResponse.data.success && homeworkResponse.data.data) {
          setHomeworkList(homeworkData);
        }
        // Refresh sessions with homework (remove the one we just created)
        if (clientProfileId) {
          const sessionsResponse = await sessionsApi.getClientHistory(clientProfileId, 50);
          if (sessionsResponse.data.success && sessionsResponse.data.data) {
            const sessionsWithHomeworkOnly = sessionsResponse.data.data.filter(
              (s: Session) => s.homework && !homeworkData.find((h: HomeworkSubmission) => h.sessionId === s.id)
            );
            setSessionsWithHomework(sessionsWithHomeworkOnly);
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ev ödevi kaydedilirken bir hata oluştu');
    }
  };

  const handleCompleteHomework = async (homework: HomeworkSubmission) => {
    try {
      await homeworkApi.complete(homework.id);
      toast.success('Ev ödevi tamamlandı olarak işaretlendi');
      setDetailDialogOpen(false);
      // Refresh
      const homeworkResponse = await homeworkApi.getMyHomework();
      if (homeworkResponse.data.success && homeworkResponse.data.data) {
        setHomeworkList(homeworkResponse.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ev ödevi tamamlanırken bir hata oluştu');
    }
  };

  if (userRole !== 'CLIENT') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header title="Ev Ödevleri" />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erişim Kısıtlı</h3>
              <p className="text-sm text-muted-foreground">
                Ev ödevleri sayfasına sadece danışanlar erişebilir.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header title="Ev Ödevleri" description="Seans ödevlerinizi görüntüleyin ve tamamlayın" />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Sessions with homework but no submission */}
              {sessionsWithHomework.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Yeni Ödevler</CardTitle>
                    <CardDescription>
                      Size verilen ev ödevleri - başlamak için "Başlat" butonuna tıklayın
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sessionsWithHomework.map((session) => (
                        <Card key={session.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {session.appointment?.startTime
                                      ? format(new Date(session.appointment.startTime), 'd MMMM yyyy', { locale: tr })
                                      : '-'}
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <Label className="text-sm font-semibold">Ödev:</Label>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                    {session.homework}
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleSubmitHomework(session.id)}
                                size="sm"
                              >
                                <BookOpen className="h-4 w-4 mr-2" />
                                Başlat
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* My Homework Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle>Ev Ödevlerim</CardTitle>
                  <CardDescription>
                    {homeworkList.length} ödev bulundu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {homeworkList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Henüz ev ödevi yok</h3>
                      <p className="text-sm text-muted-foreground">
                        Size verilen ev ödevleri burada görünecek.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {homeworkList.map((homework) => (
                        <Card key={homework.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className={statusColors[homework.status] || ''}>
                                    {statusLabels[homework.status] || homework.status}
                                  </Badge>
                                  {homework.session?.appointment?.startTime && (
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(homework.session.appointment.startTime), 'd MMMM yyyy', { locale: tr })}
                                    </span>
                                  )}
                                </div>
                                {homework.session?.homework && (
                                  <div className="mt-2">
                                    <Label className="text-sm font-semibold">Ödev:</Label>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-2">
                                      {homework.session.homework}
                                    </p>
                                  </div>
                                )}
                                {homework.notes && (
                                  <div className="mt-2">
                                    <Label className="text-sm font-semibold">Notlarım:</Label>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-2">
                                      {homework.notes}
                                    </p>
                                  </div>
                                )}
                                {homework.completedAt && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    Tamamlandı: {format(new Date(homework.completedAt), 'd MMMM yyyy HH:mm', { locale: tr })}
                                  </div>
                                )}
                                
                                {/* Activities Section */}
                                <div className="mt-4 pt-4 border-t">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm font-semibold">Etkinlikler:</Label>
                                    {homework.status !== 'COMPLETED' && homework.status !== 'REVIEWED' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedHomework(homework);
                                          setEditingActivity(null);
                                          setActivityTitle('');
                                          setActivityDescription('');
                                          setActivityDialogOpen(true);
                                        }}
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Etkinlik Ekle
                                      </Button>
                                    )}
                                  </div>
                                  {homework.activities && homework.activities.length > 0 ? (
                                    <div className="space-y-2">
                                      {homework.activities.map((activity) => (
                                        <div
                                          key={activity.id}
                                          className={`flex items-start gap-2 p-2 rounded-md border ${
                                            activity.isCompleted
                                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                              : 'bg-background border-border'
                                          }`}
                                        >
                                          <button
                                            onClick={async () => {
                                              try {
                                                await homeworkApi.updateActivity(activity.id, {
                                                  isCompleted: !activity.isCompleted,
                                                });
                                                toast.success('Etkinlik güncellendi');
                                                // Refresh homework list
                                                const response = await homeworkApi.getMyHomework();
                                                if (response.data.success && response.data.data) {
                                                  setHomeworkList(response.data.data);
                                                }
                                              } catch (error: any) {
                                                toast.error(error.response?.data?.message || 'Etkinlik güncellenemedi');
                                              }
                                            }}
                                            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                              activity.isCompleted
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300 hover:border-green-500'
                                            }`}
                                          >
                                            {activity.isCompleted && <Check className="h-3 w-3" />}
                                          </button>
                                          <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium ${activity.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                              {activity.title}
                                            </div>
                                            {activity.description && (
                                              <div className={`text-xs text-muted-foreground mt-1 ${activity.isCompleted ? 'line-through' : ''}`}>
                                                {activity.description}
                                              </div>
                                            )}
                                          </div>
                                          {homework.status !== 'COMPLETED' && homework.status !== 'REVIEWED' && (
                                            <div className="flex gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => {
                                                  setSelectedHomework(homework);
                                                  setEditingActivity(activity);
                                                  setActivityTitle(activity.title);
                                                  setActivityDescription(activity.description || '');
                                                  setActivityDialogOpen(true);
                                                }}
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-destructive"
                                                onClick={async () => {
                                                  if (confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
                                                    try {
                                                      await homeworkApi.deleteActivity(activity.id);
                                                      toast.success('Etkinlik silindi');
                                                      // Refresh homework list
                                                      const response = await homeworkApi.getMyHomework();
                                                      if (response.data.success && response.data.data) {
                                                        setHomeworkList(response.data.data);
                                                      }
                                                    } catch (error: any) {
                                                      toast.error(error.response?.data?.message || 'Etkinlik silinemedi');
                                                    }
                                                  }
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Henüz etkinlik eklenmedi</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedHomework(homework);
                                    setDetailDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Detay
                                </Button>
                                {homework.status !== 'COMPLETED' && homework.status !== 'REVIEWED' && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedHomework(homework);
                                      setDetailDialogOpen(true);
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Tamamla
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Homework Detail/Submit Dialog */}
      <HomeworkDetailDialog
        homework={selectedHomework}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onComplete={handleCompleteHomework}
      />

      {/* Activity Add/Edit Dialog */}
      <ActivityDialog
        homework={selectedHomework}
        activity={editingActivity}
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        title={activityTitle}
        description={activityDescription}
        onTitleChange={setActivityTitle}
        onDescriptionChange={setActivityDescription}
        onSave={async () => {
          if (!selectedHomework) return;
          
          try {
            if (editingActivity) {
              // Update existing activity
              await homeworkApi.updateActivity(editingActivity.id, {
                title: activityTitle,
                description: activityDescription || undefined,
              });
              toast.success('Etkinlik güncellendi');
            } else {
              // Create new activity
              await homeworkApi.createActivity(selectedHomework.id, {
                title: activityTitle,
                description: activityDescription || undefined,
              });
              toast.success('Etkinlik eklendi');
            }
            
            // Refresh homework list
            const response = await homeworkApi.getMyHomework();
            if (response.data.success && response.data.data) {
              setHomeworkList(response.data.data);
            }
            
            setActivityDialogOpen(false);
            setActivityTitle('');
            setActivityDescription('');
            setEditingActivity(null);
          } catch (error: any) {
            toast.error(error.response?.data?.message || 'Etkinlik kaydedilemedi');
          }
        }}
      />
    </div>
  );
}

// Homework Detail Dialog Component
function HomeworkDetailDialog({
  homework,
  open,
  onOpenChange,
  onComplete,
}: {
  homework: HomeworkSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (homework: HomeworkSubmission) => Promise<void>;
}) {
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (homework && open) {
      setNotes(homework.notes || '');
      setFileUrl(homework.fileUrl || '');
    }
  }, [homework, open]);

  const handleComplete = async () => {
    if (!homework) return;
    setCompleting(true);
    try {
      await homeworkApi.update(homework.id, {
        status: 'COMPLETED',
        notes,
        fileUrl,
      });
      await onComplete(homework);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ev ödevi tamamlanırken bir hata oluştu');
    } finally {
      setCompleting(false);
    }
  };

  if (!homework) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ev Ödevi Detayları</DialogTitle>
          <DialogDescription>
            {homework.session?.appointment?.startTime
              ? format(new Date(homework.session.appointment.startTime), 'd MMMM yyyy', { locale: tr })
              : '-'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Durum</Label>
            <div className="mt-1">
              <Badge className={statusColors[homework.status] || ''}>
                {statusLabels[homework.status] || homework.status}
              </Badge>
            </div>
          </div>

          {homework.session?.homework && (
            <div>
              <Label>Ödev</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p className="whitespace-pre-wrap text-sm">{homework.session.homework}</p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notlarım</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ödev hakkında notlarınızı buraya yazabilirsiniz..."
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="fileUrl">Dosya URL (Opsiyonel)</Label>
            <Input
              id="fileUrl"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ödev dosyanızı bir bulut depolama servisine yükleyip linkini buraya yapıştırabilirsiniz.
            </p>
          </div>

          {homework.fileUrl && (
            <div>
              <Label>Yüklenen Dosya</Label>
              <div className="mt-1">
                <a
                  href={homework.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  {homework.fileUrl}
                </a>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={completing}>
            Kapat
          </Button>
          {homework.status !== 'COMPLETED' && homework.status !== 'REVIEWED' && (
            <Button onClick={handleComplete} disabled={completing}>
              {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Tamamlandı Olarak İşaretle
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Activity Dialog Component
function ActivityDialog({
  homework,
  activity,
  open,
  onOpenChange,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSave,
}: {
  homework: HomeworkSubmission | null;
  activity: HomeworkActivity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Etkinlik başlığı zorunludur');
      return;
    }
    
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{activity ? 'Etkinlik Düzenle' : 'Yeni Etkinlik Ekle'}</DialogTitle>
          <DialogDescription>
            {homework?.session?.appointment?.startTime && (
              <span>
                Seans: {format(new Date(homework.session.appointment.startTime), 'd MMMM yyyy', { locale: tr })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="activity-title">Etkinlik Başlığı *</Label>
            <Input
              id="activity-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Örn: Günlük kaydı tutmak"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="activity-description">Açıklama (Opsiyonel)</Label>
            <Textarea
              id="activity-description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Etkinlik hakkında detaylı bilgi..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {activity ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


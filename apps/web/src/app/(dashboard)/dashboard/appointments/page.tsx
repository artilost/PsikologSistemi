/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  X,
  Loader2,
  Calendar,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, getInitials, statusLabels } from '@/lib/utils';
import { appointmentsApi, clientsApi, usersApi, sessionsApi, type Appointment, type Session } from '@/lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarView } from '@/components/calendar/calendar-view';

// Removed hardcoded timeSlots - now fetched from backend based on therapist availability

// Dynamic schema based on user role
const createAppointmentFormSchema = (userRole: string) => z.object({
  therapistId: z.string().min(1, 'Terapist seçilmelidir'),
  clientId: userRole === 'CLIENT'
    ? z.string().optional()
    : userRole === 'THERAPIST'
      ? z.string().optional() // Therapist can create without client (will be set from their assigned clients)
      : z.string().optional(), // ADMIN/RECEPTIONIST - we'll validate manually in onSubmit
  startTime: z.string().min(1, 'Başlangıç saati seçilmelidir'),
  endTime: z.string().min(1, 'Bitiş saati seçilmelidir'),
  date: z.string().min(1, 'Tarih seçilmelidir'),
  type: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<ReturnType<typeof createAppointmentFormSchema>>;

// Create Appointment Dialog Component
function CreateAppointmentDialog({
  onSuccess,
  userRole,
  currentUserId,
  clientProfileId,
  therapistProfileId,
  userTherapistId,
  clientTherapistProfileId,
  existingAppointments = []
}: {
  onSuccess: () => void;
  userRole: string;
  currentUserId: string;
  clientProfileId?: string | null;
  therapistProfileId?: string | null;
  userTherapistId?: string | null; // For CLIENT role - their therapist's user ID
  clientTherapistProfileId?: string | null; // For CLIENT role - their therapist's profile ID
  existingAppointments?: Appointment[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [therapists, setTherapists] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clients, setClients] = useState<any[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTherapistDuration, setSelectedTherapistDuration] = useState<number>(50); // Default 50 minutes

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(createAppointmentFormSchema(userRole)),
    defaultValues: {
      // For THERAPIST role, set their own therapist profile ID
      // For CLIENT role, set their therapist's profile ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      therapistId: userRole === 'THERAPIST' && therapistProfileId
        ? therapistProfileId
        : userRole === 'CLIENT' && clientTherapistProfileId
          ? clientTherapistProfileId
          : '',
      clientId: userRole === 'CLIENT' ? currentUserId : '',
      startTime: '',
      endTime: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'Bireysel Terapi',
      notes: '',
    },
  });

  // Update therapistId when therapistProfileId or clientTherapistProfileId changes
  useEffect(() => {
    if (userRole === 'THERAPIST' && therapistProfileId) {
      form.setValue('therapistId', therapistProfileId);
    } else if (userRole === 'CLIENT' && clientTherapistProfileId) {
      // Set therapistId directly - backend will validate it
      form.setValue('therapistId', clientTherapistProfileId);
    }
  }, [userRole, therapistProfileId, clientTherapistProfileId, form]);

  // When therapists are loaded and we have clientTherapistProfileId, verify the match
  useEffect(() => {
    if (userRole === 'CLIENT' && clientTherapistProfileId && therapists.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const therapist = therapists.find((t: any) =>
        t.therapistProfileId === clientTherapistProfileId
      );
      if (therapist && form.getValues('therapistId') !== clientTherapistProfileId) {
        form.setValue('therapistId', clientTherapistProfileId);
      }
    }
  }, [userRole, clientTherapistProfileId, therapists, form]);

  // Watch date and therapist to check for conflicts
  const watchedDate = form.watch('date');
  const watchedTherapistId = form.watch('therapistId');

  // Fetch available slots when date or therapist changes
  useEffect(() => {
    async function fetchAvailableSlots() {
      if (!watchedDate || !watchedTherapistId) {
        setAvailableSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        const response = await appointmentsApi.getAvailableSlots({
          therapistId: watchedTherapistId,
          date: watchedDate,
        });

        if (response.data.success && response.data.data) {
          // Convert Date objects to HH:MM strings
          const slots = response.data.data.map((slot: Date) => {
            const d = new Date(slot);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          });
          setAvailableSlots(slots);
        }
      } catch (error) {
        console.error('Error fetching slots:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailableSlots();
  }, [watchedDate, watchedTherapistId]);

  // Watch startTime to auto-calculate endTime
  const watchedStartTime = form.watch('startTime');
  const watchedType = form.watch('type');

  // Update therapist duration when therapist changes
  useEffect(() => {
    if (watchedTherapistId && therapists.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedTherapist = therapists.find((t: any) => 
        t.id === watchedTherapistId || t.therapistProfileId === watchedTherapistId
      );
      
      if (selectedTherapist && (selectedTherapist as any).therapistProfile?.sessionDuration) {
        setSelectedTherapistDuration((selectedTherapist as any).therapistProfile.sessionDuration);
      } else {
        setSelectedTherapistDuration(50); // Default
      }
    }
  }, [watchedTherapistId, therapists]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEffect(() => {
    if (watchedStartTime) {
      // Use therapist's session duration
      let durationMinutes = selectedTherapistDuration;

      // Adjust duration based on type (multipliers based on session type)
      switch (watchedType) {
        case 'Bireysel Terapi':
          durationMinutes = selectedTherapistDuration;
          break;
        case 'Çift Terapisi':
          durationMinutes = Math.ceil(selectedTherapistDuration * 1.5); // 1.5x duration
          break;
        case 'Aile Terapisi':
          durationMinutes = Math.ceil(selectedTherapistDuration * 1.5); // 1.5x duration
          break;
        case 'Grup Terapisi':
          durationMinutes = Math.ceil(selectedTherapistDuration * 1.5); // 1.5x duration
          break;
        default:
          durationMinutes = selectedTherapistDuration;
      }

      // Parse start time
      const [hours, minutes] = watchedStartTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);

      // Add duration
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      const endTimeString = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      form.setValue('endTime', endTimeString);
    }
  }, [watchedStartTime, watchedType, selectedTherapistDuration, form]);

  useEffect(() => {
    if (open) {
      // Load therapists using the therapists endpoint (accessible by all roles)
      setLoadingTherapists(true);
      usersApi.getTherapists()
        .then((response) => {
          // Response format: { data: { success: true, data: [...] } }
          if (response.data?.success && response.data?.data) {
            setTherapists(response.data.data);

            // For CLIENT role, update therapistId if we have clientTherapistProfileId
            if (userRole === 'CLIENT' && clientTherapistProfileId) {
              // Find therapist by therapistProfileId
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const therapist = response.data.data.find((t: any) =>
                t.therapistProfileId === clientTherapistProfileId
              );
              if (therapist) {
                form.setValue('therapistId', clientTherapistProfileId);
              }
            }
          } else {
            toast.error('Terapistler yüklenemedi: Beklenmeyen yanıt formatı');
          }
        })
        .catch((error) => {
          const errorMessage = error.response?.data?.message || error.message || 'Terapistler yüklenemedi';
          toast.error(errorMessage);
        })
        .finally(() => setLoadingTherapists(false));

      // Don't load clients initially - wait for therapist selection
      // Clients will be loaded when therapist is selected
      setClients([]);
    }
  }, [open, userRole, currentUserId, clientTherapistProfileId, form]);

  // Load clients when therapist is selected (for ADMIN/RECEPTIONIST roles)
  useEffect(() => {
    if (open && userRole !== 'CLIENT' && watchedTherapistId) {
      setLoadingClients(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = { limit: 100 };

      // For ADMIN/RECEPTIONIST: Load clients assigned to selected therapist
      if (userRole === 'ADMIN' || userRole === 'RECEPTIONIST' || userRole === 'SUPER_ADMIN') {
        // Find therapist profile ID from selected therapist
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const selectedTherapist = therapists.find((t: any) =>
          t.id === watchedTherapistId || t.therapistProfileId === watchedTherapistId
        );
        if (selectedTherapist?.therapistProfileId) {
          params.therapistId = selectedTherapist.therapistProfileId;
        } else if (watchedTherapistId) {
          // If therapistProfileId is directly selected, use it
          params.therapistId = watchedTherapistId;
        }
      } else if (userRole === 'THERAPIST' && therapistProfileId) {
        // For THERAPIST role, only load their own clients
        params.therapistId = therapistProfileId;
      }

      clientsApi.list(params)
        .then((response) => {
          setClients(response.data.data || []);
        })
        .catch(() => {
          toast.error('Danışanlar yüklenemedi');
        })
        .finally(() => setLoadingClients(false));
    } else if (open && userRole !== 'CLIENT' && !watchedTherapistId) {
      // Clear clients if therapist is deselected
      setClients([]);
    }
  }, [open, userRole, watchedTherapistId, therapists, therapistProfileId]);

  // Get today's date in YYYY-MM-DD format for min date
  const today = format(new Date(), 'yyyy-MM-dd');

  // Check if a time slot is available
  const isTimeSlotAvailable = (time: string, date: string, therapistId: string, appointmentType?: string) => {
    if (!date || !therapistId) return true; // Allow if date or therapist not selected yet

    // Calculate duration based on appointment type
    let durationMinutes = 60; // Default 1 hour
    if (appointmentType) {
      switch (appointmentType) {
        case 'Bireysel Terapi':
          durationMinutes = 60;
          break;
        case 'Çift Terapisi':
        case 'Aile Terapisi':
        case 'Grup Terapisi':
          durationMinutes = 90;
          break;
        default:
          durationMinutes = 60;
      }
    }

    const slotStart = new Date(`${date}T${time}`);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

    // Check for conflicts with existing appointments for the same therapist
    // Exclude CANCELLED and NO_SHOW appointments
    const hasConflict = existingAppointments.some((apt) => {
      // Skip cancelled appointments - they don't block time slots
      if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') {
        return false;
      }

      // Check therapist match - compare both therapistId field and therapist.id
      // therapistId can be either therapistProfile.id or userId depending on context
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aptTherapistId = (apt as any).therapistId || apt.therapist?.id;
      const aptTherapistUserId = apt.therapist?.user?.id;

      // Match if therapistId matches either the profile ID or user ID
      if (aptTherapistId !== therapistId && aptTherapistUserId !== therapistId) {
        return false;
      }

      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);

      // Check if dates match
      const aptDate = format(aptStart, 'yyyy-MM-dd');
      if (aptDate !== date) return false;

      // Check for time overlap
      const overlaps = slotStart < aptEnd && slotEnd > aptStart;
      return overlaps;
    });

    return !hasConflict;
  };

  const onSubmit = async (values: AppointmentFormValues) => {
    console.log('Form submitted with values:', values);
    console.log('User role:', userRole);
    console.log('Form errors:', form.formState.errors);

    try {
      setLoading(true);

      // Check if date is in the past
      const selectedDate = new Date(values.date);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < todayDate) {
        toast.error('Geçmiş bir tarihe randevu oluşturulamaz');
        setLoading(false);
        return;
      }

      // Check if date is today and time is in the past
      const startDateTime = new Date(`${values.date}T${values.startTime}`);
      const now = new Date();

      if (startDateTime < now) {
        toast.error('Geçmiş bir saate randevu oluşturulamaz');
        setLoading(false);
        return;
      }

      // Combine date and time
      const endDateTime = new Date(`${values.date}T${values.endTime}`);

      if (endDateTime <= startDateTime) {
        toast.error('Bitiş saati başlangıç saatinden sonra olmalıdır');
        setLoading(false);
        return;
      }

      // Check for conflicts with existing appointments
      // Exclude CANCELLED and NO_SHOW appointments
      const hasConflict = existingAppointments.some((apt) => {
        // Skip cancelled appointments - they don't block time slots
        if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') {
          return false;
        }

        if (apt.therapist?.id !== values.therapistId) return false;

        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);

        // Check for time overlap
        return (startDateTime < aptEnd && endDateTime > aptStart);
      });

      if (hasConflict) {
        toast.error('Seçilen saatte bu terapist için başka bir randevu mevcut');
        setLoading(false);
        return;
      }

      // Calculate duration in minutes
      const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

      // Validate required fields
      if (!values.therapistId) {
        toast.error('Lütfen bir terapist seçin');
        setLoading(false);
        return;
      }

      // For CLIENT role, backend will automatically set clientId from the authenticated user
      // So we don't need to send clientId for CLIENT role
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const appointmentData: any = {
        therapistId: values.therapistId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: duration,
        type: values.type || 'individual',
        appointmentNotes: values.notes,
      };

      // Only send clientId if user is not CLIENT (ADMIN/THERAPIST can choose client)
      // For ADMIN/RECEPTIONIST: clientId is required if therapist is selected
      if (userRole !== 'CLIENT') {
        if (values.clientId) {
          appointmentData.clientId = values.clientId;
        } else if (userRole === 'ADMIN' || userRole === 'RECEPTIONIST' || userRole === 'SUPER_ADMIN') {
          toast.error('Lütfen bir danışan seçin');
          setLoading(false);
          return;
        }
      }

      console.log('Creating appointment with data:', appointmentData);
      const response = await appointmentsApi.create(appointmentData);
      console.log('Appointment created successfully:', response);

      toast.success('Randevu başarıyla oluşturuldu');
      setOpen(false);
      form.reset();
      onSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Appointment creation error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Randevu oluşturulurken bir hata oluştu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Randevu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yeni Randevu Oluştur</DialogTitle>
          <DialogDescription>
            Randevu bilgilerini doldurun ve kaydedin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Hide therapist selection for THERAPIST role (they can only create for themselves) */}
            {/* Hide therapist selection for CLIENT role (automatically set to their therapist) */}
            {userRole !== 'THERAPIST' && userRole !== 'CLIENT' && (
              <FormField
                control={form.control}
                name="therapistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terapist *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear client selection when therapist changes
                        form.setValue('clientId', '');
                        setClients([]);
                      }}
                      defaultValue={field.value}
                      disabled={loadingTherapists}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Terapist seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {therapists.map((therapist) => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const value = (therapist as any).therapistProfileId || therapist.id;
                          return (
                            <SelectItem key={therapist.id} value={value}>
                              {therapist.firstName} {therapist.lastName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <FormDescription>
                      Terapist seçilmeden danışan seçilemez
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}

            {/* Show therapist info for THERAPIST and CLIENT roles */}
            {(userRole === 'THERAPIST' || userRole === 'CLIENT') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Terapist</label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm">
                  {userRole === 'THERAPIST'
                    ? 'Kendi randevunuz'
                    : (() => {
                      // CLIENT role: Show therapist name based on clientTherapistProfileId
                      // If therapist info not loaded yet, show loading
                      if (!clientTherapistProfileId) {
                        return 'Terapist bilgileri yükleniyor...';
                      }

                      // If therapists list not loaded yet, show loading
                      if (loadingTherapists) {
                        return 'Terapist yükleniyor...';
                      }

                      // If we have clientTherapistProfileId but therapists not loaded yet
                      if (clientTherapistProfileId && therapists.length === 0) {
                        return 'Terapist yükleniyor...';
                      }

                      // Find therapist by therapistProfileId
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const therapist = therapists.find((t: any) =>
                        t.therapistProfileId === clientTherapistProfileId
                      );

                      // If we have clientTherapistProfileId but therapist not found in list
                      if (clientTherapistProfileId && !therapist && therapists.length > 0) {
                        return 'Terapist bulunamadı';
                      }

                      // If therapist found, show name
                      if (therapist) {
                        return `${therapist.firstName} ${therapist.lastName}`;
                      }

                      // Default: still loading
                      return 'Terapist bilgileri yükleniyor...';
                    })()}
                </div>
              </div>
            )}

            {userRole !== 'CLIENT' && (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Danışan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loadingClients || !watchedTherapistId || (userRole !== 'THERAPIST' && therapists.length === 0)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !watchedTherapistId
                              ? "Önce terapist seçin"
                              : loadingClients
                                ? "Danışanlar yükleniyor..."
                                : clients.length === 0
                                  ? "Bu terapiste atanmış danışan bulunamadı"
                                  : "Danışan seçin"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.length === 0 && watchedTherapistId ? (
                          <SelectItem value="no-clients" disabled>
                            Bu terapiste atanmış danışan bulunamadı
                          </SelectItem>
                        ) : (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.user?.firstName} {client.user?.lastName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {!watchedTherapistId && userRole !== 'THERAPIST' && (
                      <FormDescription>
                        Önce bir terapist seçmelisiniz
                      </FormDescription>
                    )}
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarih</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={today}
                        onChange={(e) => {
                          field.onChange(e);
                          // Reset startTime when date changes to avoid conflicts
                          form.setValue('startTime', '');
                          form.setValue('endTime', '');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Randevu Türü</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tür seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Bireysel Terapi">Bireysel Terapi</SelectItem>
                        <SelectItem value="Çift Terapisi">Çift Terapisi</SelectItem>
                        <SelectItem value="Aile Terapisi">Aile Terapisi</SelectItem>
                        <SelectItem value="Grup Terapisi">Grup Terapisi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlangıç Saati</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Başlangıç saati" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingSlots ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Müsait saatler yükleniyor...
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Bu tarih için müsait saat yok
                          </div>
                        ) : (
                          availableSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <FormDescription>
                      Sadece terapistin müsait olduğu saatler gösteril</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bitiş Saati (Otomatik)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled
                        className="bg-muted cursor-not-allowed"
                        placeholder="Başlangıç saatine göre otomatik hesaplanır"
                      />
                    </FormControl>
                    <FormDescription>
                      Bitiş saati başlangıç saatine göre otomatik hesaplanır ({selectedTherapistDuration} dakika)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Randevu ile ilgili notlar..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oluştur
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Cancel Appointment Dialog Component
function CancelAppointmentDialog({
  appointment,
  open,
  onOpenChange,
  onCancel,
}: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (appointment: Appointment, reason?: string) => void;
}) {
  const [reason, setReason] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(false);

  if (!appointment) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onCancel(appointment, reason || undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Randevuyu İptal Et</DialogTitle>
          <DialogDescription>
            Bu randevuyu iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm font-medium">
              {format(new Date(appointment.startTime), 'd MMMM yyyy, HH:mm', { locale: tr })}
            </p>
            {appointment.therapist?.user && (
              <p className="text-sm text-muted-foreground mt-1">
                Terapist: {appointment.therapist.user.firstName} {appointment.therapist.user.lastName}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">İptal Nedeni (Opsiyonel)</label>
            <Input
              placeholder="İptal nedeni..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            İptal
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Randevuyu İptal Et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Reschedule Appointment Dialog Component
function RescheduleAppointmentDialog({
  appointment,
  open,
  onOpenChange,
  onReschedule,
}: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReschedule: (appointment: Appointment, newStartTime: string, newEndTime: string) => void;
}) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appointment && open) {
      const start = new Date(appointment.startTime);
      setDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      // Calculate end time based on appointment duration
      const duration = Math.round((new Date(appointment.endTime).getTime() - start.getTime()) / (1000 * 60));
      const calculatedEnd = new Date(start.getTime() + duration * 60 * 1000);
      setEndTime(format(calculatedEnd, 'HH:mm'));
    }
  }, [appointment, open]);

  // Auto-calculate end time when start time changes
  useEffect(() => {
    if (appointment && date && startTime) {
      const start = new Date(appointment.startTime);
      const end = new Date(appointment.endTime);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

      const newStart = new Date(`${date}T${startTime}`);
      const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEndTime(format(newEnd, 'HH:mm'));
    }
  }, [date, startTime, appointment]);

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleSubmit = async () => {
    if (!appointment || !date || !startTime || !endTime) return;

    const newStartTime = new Date(`${date}T${startTime}`).toISOString();
    const newEndTime = new Date(`${date}T${endTime}`).toISOString();

    setLoading(true);
    try {
      await onReschedule(appointment, newStartTime, newEndTime);
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Randevuyu Ertele</DialogTitle>
          <DialogDescription>
            Randevu için yeni tarih ve saat seçin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tarih</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Başlangıç Saati</label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Başlangıç saati" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Bitiş Saati</label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm mt-2">
              {endTime || 'Başlangıç saati seçildikten sonra otomatik hesaplanacak'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bitiş saati, randevu süresine göre otomatik hesaplanır
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !date || !startTime || !endTime}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Randevuyu Ertele
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Appointment Detail Dialog Component
function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange
}: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!appointment) return null;

  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Randevu Detayları</DialogTitle>
          <DialogDescription>
            Randevu bilgilerini görüntüleyin
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tarih</label>
              <p className="text-sm font-medium">{format(startTime, 'd MMMM yyyy', { locale: tr })}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Saat</label>
              <p className="text-sm font-medium">
                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Süre</label>
              <p className="text-sm font-medium">{duration} dakika</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Durum</label>
              <div className="mt-1">
                <Badge variant={appointment.status === 'CONFIRMED' ? 'success' : 'default'}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {statusLabels[appointment.status] || appointment.status}
                </Badge>
              </div>
            </div>
          </div>

          {appointment.therapist?.user && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Terapist</label>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(
                      `${appointment.therapist.user.firstName} ${appointment.therapist.user.lastName || ''}`
                    )}
                  </AvatarFallback>
                </Avatar>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <p className="text-sm font-medium">
                  {appointment.therapist.user.firstName} {appointment.therapist.user.lastName || ''}
                </p>
              </div>
            </div>
          )}

          {appointment.client?.user && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Danışan</label>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(
                      `${appointment.client.user.firstName} ${appointment.client.user.lastName || ''}`
                    )}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">
                  {appointment.client.user.firstName} {appointment.client.user.lastName || ''}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground">Randevu Türü</label>
            <p className="text-sm font-medium mt-1">{appointment.type || 'Bireysel Terapi'}</p>
          </div>

          {appointment.appointmentNotes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Notlar</label>
              <p className="text-sm mt-1 p-3 bg-muted rounded-md">{appointment.appointmentNotes}</p>
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

export default function AppointmentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: false,
    onUnauthenticated: () => {
      router.push('/login');
    },
  });

  // All hooks must be called before any conditional returns
  const [currentDate, setCurrentDate] = useState(new Date());
  // const [view, setView] = useState<'week' | 'day'>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);
  const [therapistProfileId, setTherapistProfileId] = useState<string | null>(null);
  const [userTherapistId, setUserTherapistId] = useState<string | null>(null); // For CLIENT role - their therapist's user ID
  const [clientTherapistProfileId, setClientTherapistProfileId] = useState<string | null>(null); // For CLIENT role - their therapist's profile ID
  const [filter, setFilter] = useState<'all' | 'past' | 'upcoming' | 'confirmed' | 'pending' | 'cancelled'>('all');

  // Dialog states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [sessionNotesDialogOpen, setSessionNotesDialogOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const userRole = (session?.user as any)?.role || 'CLIENT';
  const userId = (session?.user as any)?.id || '';

  // Get user profile information (client profile for CLIENT, therapist profile for THERAPIST)
  useEffect(() => {
    if (userId) {
      import('@/lib/api').then(({ authApi }) => {
        authApi.me()
          .then((response) => {
            if (response.data.success && response.data.data) {
              const user = response.data.data as any;

              if (userRole === 'CLIENT') {
                if (user.clientProfile?.id) {
                  setClientProfileId(user.clientProfile.id);
                  // Get therapist profile ID directly from clientProfile.therapistProfileId
                  // Backend doesn't include therapistProfile relation, so we use therapistProfileId directly
                  if ((user.clientProfile as any).therapistProfileId) {
                    setClientTherapistProfileId((user.clientProfile as any).therapistProfileId);
                  }
                } else {
                  setLoading(false);
                }
              } else if (userRole === 'THERAPIST') {
                if (user.therapistProfile?.id) {
                  setTherapistProfileId(user.therapistProfile.id);
                }
                setLoading(false);
              } else {
                // ADMIN or other roles
                setLoading(false);
              }
            }
          })
          .catch(async (error: any) => {
            // If 401 Unauthorized, logout user
            if (error?.response?.status === 401 || error?.message?.includes('401')) {
              if (typeof window !== 'undefined') {
                const { signOut } = await import('next-auth/react');
                signOut({ callbackUrl: '/login', redirect: true });
              }
              return;
            }
            setLoading(false);
          });
      });
    }
  }, [userRole, userId]);

  // Fetch appointments
  useEffect(() => {
    async function fetchAppointments() {
      try {
        setLoading(true);

        let startDate: Date;
        let endDate: Date;

        // For "past" filter, fetch a wider date range (last 3 months)
        if (filter === 'past') {
          const now = new Date();
          endDate = now;
          startDate = addDays(now, -90); // Last 3 months
        } else if (filter === 'upcoming') {
          // For upcoming, fetch from now to 3 months ahead
          const now = new Date();
          startDate = now;
          endDate = addDays(now, 90);
        } else {
          // For other filters, use weekly view
          const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
          startDate = weekStart;
          endDate = addDays(weekStart, 7);
        }

        const params: any = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 200, // Increased limit for past/upcoming filters
        };

        // For CLIENT role, only show their own appointments
        if (userRole === 'CLIENT' && clientProfileId) {
          params.clientId = clientProfileId;
        }

        // For THERAPIST role, only show their own appointments (filter by therapistId)
        if (userRole === 'THERAPIST' && therapistProfileId) {
          params.therapistId = therapistProfileId;
          // For therapist, include SCHEDULED appointments when viewing "all" or "pending" filters
          // so they can see and approve pending appointments
          // By default, backend excludes SCHEDULED for therapists, so we need to explicitly include them
          if (filter === 'all' || filter === 'pending') {
            params.excludeScheduled = false;
          }
          // For other filters (upcoming, past, confirmed), exclude SCHEDULED (default behavior)
        }

        const response = await appointmentsApi.list(params);

        if (response.data.success && response.data.data) {
          setAppointments(response.data.data);
        }
      } catch (error) {
        toast.error('Randevular yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    if (userRole !== 'CLIENT') {
      // For non-CLIENT roles, fetch immediately
      if (userRole === 'THERAPIST' && !therapistProfileId) {
        // Wait for therapistProfileId
        return;
      }
      fetchAppointments();
    } else if (clientProfileId !== null) {
      // For CLIENT role, only fetch if we have clientProfileId (null means we checked and it doesn't exist)
      if (clientProfileId) {
        fetchAppointments();
      } else {
        // No client profile, show empty state
        setLoading(false);
      }
    }
  }, [currentDate, userRole, clientProfileId, therapistProfileId, filter]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter appointments based on selected filter
  const getFilteredAppointments = () => {
    const now = new Date();
    return appointments.filter((apt) => {
      // Always exclude cancelled appointments from other filters (except 'cancelled' filter)
      if (filter !== 'cancelled' && (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW')) {
        return false;
      }

      const aptDate = new Date(apt.startTime);
      const isPast = aptDate < now;
      const isUpcoming = aptDate >= now;

      switch (filter) {
        case 'past':
          return isPast && apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW';
        case 'upcoming':
          // Planlanan: Gelecekteki randevular (SCHEDULED veya CONFIRMED, ama CANCELLED değil)
          return isUpcoming && apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW';
        case 'confirmed':
          return apt.status === 'CONFIRMED';
        case 'pending':
          return apt.status === 'SCHEDULED';
        case 'cancelled':
          return apt.status === 'CANCELLED' || apt.status === 'NO_SHOW';
        case 'all':
        default:
          return true;
      }
    });
  };

  const getAppointmentsForDay = (date: Date) => {
    const filtered = getFilteredAppointments();
    return filtered.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return isSameDay(aptDate, date);
    });
  };

  const getAppointmentStyle = (startTime: string) => {
    const start = new Date(startTime);
    const hours = start.getHours();
    const minutes = start.getMinutes();
    const startMinutes = hours * 60 + minutes;

    // Find closest time slot
    const slotIndex = timeSlots.findIndex((slot) => {
      const [h, m] = slot.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      return slotMinutes >= startMinutes;
    });

    const top = slotIndex >= 0 ? slotIndex * 48 : 0;
    const duration = 2; // Default 1 hour (2 slots)

    return {
      top: `${top}px`,
      height: `${duration * 48 - 4}px`,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300';
      case 'SCHEDULED':
        return 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300';
      case 'IN_PROGRESS':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300';
      case 'COMPLETED':
        return 'bg-gray-500/20 border-gray-500 text-gray-700 dark:text-gray-300';
      case 'CANCELLED':
        return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
      default:
        return 'bg-primary/20 border-primary text-primary';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  const canCreateAppointment = userRole === 'CLIENT' ||
    ['ADMIN', 'THERAPIST', 'RECEPTIONIST'].includes(userRole);

  // Handle appointment actions
  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailDialogOpen(true);
  };

  const handleCancel = async (appointment: Appointment, reason?: string) => {
    try {
      await appointmentsApi.cancel(appointment.id, reason);
      toast.success('Randevu başarıyla iptal edildi');
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
      // Force refresh appointments
      setCurrentDate(new Date());
      setTimeout(() => {
        setCurrentDate(new Date(currentDate));
      }, 100);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Randevu iptal edilirken bir hata oluştu');
    }
  };

  const handleReschedule = async (appointment: Appointment, newStartTime: string, newEndTime: string) => {
    try {
      await appointmentsApi.reschedule(appointment.id, {
        startTime: newStartTime,
        endTime: newEndTime,
      });
      toast.success('Randevu başarıyla ertelendi');
      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      // Force refresh appointments by updating currentDate
      // This will trigger the useEffect that fetches appointments
      setCurrentDate(new Date());
      // Also trigger a manual refresh
      setTimeout(() => {
        setCurrentDate(new Date(currentDate));
      }, 100);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Randevu ertelenirken bir hata oluştu');
    }
  };

  const handleUpdateStatus = async (appointment: Appointment, newStatus: string) => {
    try {
      await appointmentsApi.updateStatus(appointment.id, newStatus);
      toast.success('Randevu durumu güncellendi');
      // Force refresh appointments
      setCurrentDate(new Date());
      setTimeout(() => {
        setCurrentDate(new Date(currentDate));
      }, 100);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Durum güncellenirken bir hata oluştu');
    }
  };

  const handleStartSession = async (appointment: Appointment) => {
    try {
      const response = await sessionsApi.startSessionFromAppointment(appointment.id);
      if (response.data.success) {
        toast.success('Seans başlatıldı');
        // Set current session and appointment, then open notes dialog
        setCurrentSession(response.data.data);
        setSelectedAppointment(appointment);
        setSessionNotesDialogOpen(true);
        // Refresh appointments to show updated status
        setCurrentDate(new Date());
        setTimeout(() => {
          setCurrentDate(new Date(currentDate));
        }, 100);
      } else {
        toast.error(response.data.message || 'Seans başlatılamadı');
      }
    } catch (error: any) {
      console.error('Start session error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Seans başlatılırken bir hata oluştu';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Show loading state while session is being fetched */}
      {status === 'loading' ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Header title="Randevular" description="Randevu takvimi ve yönetimi">
            {canCreateAppointment && (
              <CreateAppointmentDialog
                onSuccess={() => {
                  // Refresh appointments by re-triggering the useEffect
                  // Force a re-fetch by updating a dependency
                  setCurrentDate(new Date(currentDate));
                }}
                userRole={userRole}
                currentUserId={userId}
                clientProfileId={clientProfileId}
                therapistProfileId={therapistProfileId}
                userTherapistId={userTherapistId}
                clientTherapistProfileId={clientTherapistProfileId}
                existingAppointments={appointments}
              />
            )}
          </Header>

          <div className="flex-1 p-6 space-y-6 overflow-auto">
            <Tabs defaultValue="list" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
                  <TabsTrigger value="calendar">Takvim Görünümü</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list" className="space-y-6 mt-0">
                {/* Filters and Date Navigation */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                      >
                        Tümü
                      </Button>
                      <Button
                        variant={filter === 'upcoming' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('upcoming')}
                      >
                        Planlanan
                      </Button>
                      <Button
                        variant={filter === 'past' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('past')}
                      >
                        Geçmiş
                      </Button>
                      <Button
                        variant={filter === 'confirmed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('confirmed')}
                      >
                        Onaylanan
                      </Button>
                      {(userRole === 'CLIENT' || userRole === 'THERAPIST') && (
                        <Button
                          variant={filter === 'pending' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilter('pending')}
                        >
                          Onay Bekleyen
                        </Button>
                      )}
                      <Button
                        variant={filter === 'cancelled' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('cancelled')}
                      >
                        İptal Edilen
                      </Button>
                    </div>

                    {/* Date Navigation */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <h2 className="text-lg font-semibold">
                          {format(weekStart, 'd MMMM', { locale: tr })} -{' '}
                          {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: tr })}
                        </h2>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                      >
                        Bugün
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Appointments List */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : getFilteredAppointments().length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <CalendarIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Randevu bulunamadı</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {filter === 'all'
                          ? (userRole === 'CLIENT'
                            ? 'Henüz randevunuz bulunmuyor. Yeni randevu oluşturmak için yukarıdaki "Yeni Randevu" butonuna tıklayın.'
                            : 'Bu hafta için randevu bulunmuyor. Yeni randevu oluşturmak için yukarıdaki "Yeni Randevu" butonuna tıklayın.')
                          : `Seçili filtreye göre randevu bulunamadı. Filtreyi değiştirmeyi deneyin.`
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Group appointments by date */}
                    {weekDays.map((day) => {
                      const dayAppointments = getAppointmentsForDay(day);
                      if (dayAppointments.length === 0) return null;

                      const isToday = isSameDay(day, new Date());

                      return (
                        <Card key={day.toISOString()}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <CalendarIcon className="h-5 w-5" />
                              <span className={cn(isToday && 'text-primary')}>
                                {format(day, 'EEEE, d MMMM yyyy', { locale: tr })}
                              </span>
                              {isToday && (
                                <Badge variant="default" className="ml-2">Bugün</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {dayAppointments.map((apt) => {
                                const startTime = new Date(apt.startTime);
                                const endTime = new Date(apt.endTime);
                                const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

                                return (
                                  <div
                                    key={apt.id}
                                    className={cn(
                                      'flex items-center gap-4 p-4 rounded-lg border-l-4 transition-all hover:shadow-md',
                                      getStatusColor(apt.status)
                                    )}
                                  >
                                    {/* Time */}
                                    <div className="flex-shrink-0 text-center min-w-[80px]">
                                      <div className="flex items-center gap-1 text-sm font-semibold">
                                        <Clock className="h-4 w-4" />
                                        {formatTime(apt.startTime)}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {formatTime(apt.endTime)}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {duration} dk
                                      </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-16 w-px bg-border" />

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-3 mb-2">
                                            {userRole === 'CLIENT' ? (
                                              apt.therapist?.user ? (
                                                <>
                                                  <Avatar className="h-10 w-10">
                                                    <AvatarFallback>
                                                      {getInitials(
                                                        `${apt.therapist.user.firstName} ${apt.therapist.user.lastName || ''}`
                                                      )}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <div>
                                                    <p className="font-semibold">
                                                      {apt.therapist.user.firstName} {apt.therapist.user.lastName || ''}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">Terapist</p>
                                                  </div>
                                                </>
                                              ) : (
                                                <div>
                                                  <p className="font-semibold">Terapist</p>
                                                </div>
                                              )
                                            ) : (
                                              apt.client?.user ? (
                                                <>
                                                  <Avatar className="h-10 w-10">
                                                    <AvatarFallback>
                                                      {getInitials(
                                                        `${apt.client.user.firstName} ${apt.client.user.lastName || ''}`
                                                      )}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <div>
                                                    <p className="font-semibold">
                                                      {apt.client.user.firstName} {apt.client.user.lastName || ''}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">Danışan</p>
                                                  </div>
                                                </>
                                              ) : (
                                                <div>
                                                  <p className="font-semibold">Danışan</p>
                                                </div>
                                              )
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="text-xs">
                                              {apt.type || 'Bireysel Terapi'}
                                            </Badge>
                                            <Badge variant={apt.status === 'CONFIRMED' ? 'success' : 'default'}>
                                              {statusLabels[apt.status] || apt.status}
                                            </Badge>
                                          </div>
                                          {apt.appointmentNotes && (
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                              {apt.appointmentNotes}
                                            </p>
                                          )}
                                        </div>

                                        {/* Actions */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleViewDetails(apt)}>
                                              <Eye className="h-4 w-4 mr-2" />
                                              Detayları Görüntüle
                                            </DropdownMenuItem>
                                            {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                                              <>
                                                {userRole !== 'CLIENT' && (
                                                  <DropdownMenuItem onClick={() => {
                                                    setSelectedAppointment(apt);
                                                    setRescheduleDialogOpen(true);
                                                  }}>
                                                    <RotateCcw className="h-4 w-4 mr-2" />
                                                    Ertele
                                                  </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                  className="text-red-600"
                                                  onClick={() => {
                                                    setSelectedAppointment(apt);
                                                    setCancelDialogOpen(true);
                                                  }}
                                                >
                                                  <X className="h-4 w-4 mr-2" />
                                                  İptal Et
                                                </DropdownMenuItem>
                                              </>
                                            )}
                                            {userRole !== 'CLIENT' && apt.status !== 'CANCELLED' && (
                                              <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>Durum Değiştir</DropdownMenuLabel>
                                                {apt.status !== 'CONFIRMED' && (
                                                  <DropdownMenuItem onClick={() => handleUpdateStatus(apt, 'CONFIRMED')}>
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    Onayla
                                                  </DropdownMenuItem>
                                                )}
                                                {apt.status !== 'IN_PROGRESS' && apt.status !== 'CANCELLED' && (
                                                  <DropdownMenuItem onClick={() => handleStartSession(apt)}>
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    Seansı Başlat
                                                  </DropdownMenuItem>
                                                )}
                                                {apt.status === 'IN_PROGRESS' && (
                                                  <DropdownMenuItem onClick={() => handleUpdateStatus(apt, 'COMPLETED')}>
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    Seansı Bitir
                                                  </DropdownMenuItem>
                                                )}
                                                {apt.status !== 'COMPLETED' && (
                                                  <DropdownMenuItem onClick={() => handleUpdateStatus(apt, 'COMPLETED')}>
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    Tamamla
                                                  </DropdownMenuItem>
                                                )}
                                              </>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="calendar" className="mt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <CalendarView
                    appointments={appointments}
                    onSelectEvent={handleViewDetails}
                    userRole={userRole}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* Appointment Detail Dialog */}
      <AppointmentDetailDialog
        appointment={selectedAppointment}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Cancel Appointment Dialog */}
      <CancelAppointmentDialog
        appointment={selectedAppointment}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onCancel={handleCancel}
      />

      {/* Reschedule Appointment Dialog */}
      <RescheduleAppointmentDialog
        appointment={selectedAppointment}
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        onReschedule={handleReschedule}
      />

      {/* Session Notes Dialog */}
      <SessionNotesDialog
        session={currentSession}
        appointment={selectedAppointment}
        open={sessionNotesDialogOpen}
        onOpenChange={setSessionNotesDialogOpen}
        onCompleteSession={async () => {
          if (currentSession && selectedAppointment) {
            try {
              await sessionsApi.completeSession(currentSession.id);
              toast.success('Seans tamamlandı');
              setSessionNotesDialogOpen(false);
              setCurrentSession(null);
              // Refresh appointments
              setCurrentDate(new Date());
              setTimeout(() => {
                setCurrentDate(new Date(currentDate));
              }, 100);
            } catch (error: any) {
              toast.error(error.response?.data?.message || 'Seans tamamlanırken bir hata oluştu');
            }
          }
        }}
      />
    </div>
  );
}

// Session Notes Dialog Component
function SessionNotesDialog({
  session,
  appointment,
  open,
  onOpenChange,
  onCompleteSession,
}: {
  session: Session | null;
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleteSession: () => Promise<void>;
}) {
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [homework, setHomework] = useState('');
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [localSession, setLocalSession] = useState<Session | null>(session);

  useEffect(() => {
    if (localSession && open) {
      setClinicalNotes(localSession.clinicalNotes || '');
      setPrivateNotes(localSession.privateNotes || '');
      setIsPrivate(localSession.isPrivate || false);
      setTreatmentPlan(localSession.treatmentPlan || '');
      setProgressNotes(localSession.progressNotes || '');
      setHomework(localSession.homework || '');
    }
  }, [localSession, open]);

  // Update local session when prop changes
  useEffect(() => {
    setLocalSession(session);
  }, [session]);

  // Fetch session if we have appointment but no session
  useEffect(() => {
    if (appointment && open && !localSession) {
      sessionsApi.getByAppointment(appointment.id)
        .then((response) => {
          if (response.data.success && response.data.data) {
            setLocalSession(response.data.data);
          }
        })
        .catch(() => {
          // Session might not exist yet, that's okay
        });
    }
  }, [appointment, open, localSession]);

  const handleSave = async () => {
    if (!localSession) return;
    setSaving(true);
    try {
      await sessionsApi.updateNotes(localSession.id, {
        clinicalNotes,
        privateNotes,
        isPrivate,
        treatmentPlan,
        progressNotes,
        homework,
      });
      toast.success('Notlar kaydedildi');
      // Update local session
      const updated = await sessionsApi.get(localSession.id);
      if (updated.data.success) {
        setLocalSession(updated.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Notlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!localSession) return;
    setCompleting(true);
    try {
      // First save notes
      await sessionsApi.updateNotes(localSession.id, {
        clinicalNotes,
        privateNotes,
        isPrivate,
        treatmentPlan,
        progressNotes,
        homework,
      });
      // Then complete session
      await onCompleteSession();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Seans tamamlanırken bir hata oluştu');
    } finally {
      setCompleting(false);
    }
  };

  if (!localSession && !appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seans Notları</DialogTitle>
          <DialogDescription>
            {appointment?.client?.user?.firstName} {appointment?.client?.user?.lastName} -{' '}
            {appointment?.startTime
              ? format(new Date(appointment.startTime), 'd MMMM yyyy', { locale: tr })
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

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || completing}>
            Kapat
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || completing} variant="outline">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Notları Kaydet
            </Button>
            <Button onClick={handleComplete} disabled={saving || completing}>
              {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Seansı Bitir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

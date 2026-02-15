'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimeSlot {
    start: string;
    end: string;
}

export interface DaySchedule {
    enabled: boolean;
    slots: TimeSlot[];
}

export interface WeeklySchedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

interface WeeklyScheduleEditorProps {
    value: WeeklySchedule;
    onChange: (schedule: WeeklySchedule) => void;
    sessionDuration?: number; // in minutes
}

const DAY_NAMES: { key: keyof WeeklySchedule; label: string }[] = [
    { key: 'monday', label: 'Pazartesi' },
    { key: 'tuesday', label: 'Salı' },
    { key: 'wednesday', label: 'Çarşamba' },
    { key: 'thursday', label: 'Perşembe' },
    { key: 'friday', label: 'Cuma' },
    { key: 'saturday', label: 'Cumartesi' },
    { key: 'sunday', label: 'Pazar' },
];

const DEFAULT_SLOT: TimeSlot = { start: '09:00', end: '18:00' };

export function WeeklyScheduleEditor({ value, onChange, sessionDuration = 50 }: WeeklyScheduleEditorProps) {
    const [copySource, setCopySource] = useState<keyof WeeklySchedule | null>(null);

    const updateDay = (day: keyof WeeklySchedule, updates: Partial<DaySchedule>) => {
        onChange({
            ...value,
            [day]: {
                ...value[day],
                ...updates,
            },
        });
    };

    const toggleDay = (day: keyof WeeklySchedule) => {
        const currentDay = value[day];
        updateDay(day, {
            enabled: !currentDay.enabled,
            slots: !currentDay.enabled && currentDay.slots.length === 0 ? [DEFAULT_SLOT] : currentDay.slots,
        });
    };

    const addSlot = (day: keyof WeeklySchedule) => {
        const currentSlots = value[day].slots;
        const lastSlot = currentSlots[currentSlots.length - 1];
        const newSlot: TimeSlot = lastSlot
            ? { start: lastSlot.end, end: '18:00' }
            : DEFAULT_SLOT;

        updateDay(day, {
            slots: [...currentSlots, newSlot],
        });
    };

    const removeSlot = (day: keyof WeeklySchedule, index: number) => {
        const currentSlots = value[day].slots;
        updateDay(day, {
            slots: currentSlots.filter((_, i) => i !== index),
        });
    };

    const updateSlot = (day: keyof WeeklySchedule, index: number, field: 'start' | 'end', newValue: string) => {
        const currentSlots = value[day].slots;
        const updatedSlots = currentSlots.map((slot, i) =>
            i === index ? { ...slot, [field]: newValue } : slot
        );

        updateDay(day, {
            slots: updatedSlots,
        });
    };

    const copySchedule = (fromDay: keyof WeeklySchedule) => {
        setCopySource(fromDay);
    };

    const pasteSchedule = (toDay: keyof WeeklySchedule) => {
        if (!copySource) return;

        const sourceSchedule = value[copySource];
        updateDay(toDay, {
            enabled: sourceSchedule.enabled,
            slots: [...sourceSchedule.slots],
        });

        setCopySource(null);
    };

    const applyToAllDays = (sourceDay: keyof WeeklySchedule) => {
        const sourceSchedule = value[sourceDay];
        const newSchedule = { ...value };

        DAY_NAMES.forEach(({ key }) => {
            newSchedule[key] = {
                enabled: sourceSchedule.enabled,
                slots: [...sourceSchedule.slots],
            };
        });

        onChange(newSchedule);
    };

    const calculateSlots = (slots: TimeSlot[]): number => {
        let total = 0;
        slots.forEach(slot => {
            const [startHour, startMin] = slot.start.split(':').map(Number);
            const [endHour, endMin] = slot.end.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const duration = endMinutes - startMinutes;
            total += Math.floor(duration / sessionDuration);
        });
        return total;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Haftalık Çalışma Programı</h3>
                    <p className="text-sm text-muted-foreground">
                        Çalışma saatlerinizi belirleyin. Her gün için birden fazla zaman aralığı ekleyebilirsiniz.
                    </p>
                </div>
                <Badge variant="outline">
                    Seans Süresi: {sessionDuration} dk
                </Badge>
            </div>

            <div className="space-y-3">
                {DAY_NAMES.map(({ key, label }) => {
                    const daySchedule = value[key];
                    const slotCount = daySchedule.enabled ? calculateSlots(daySchedule.slots) : 0;

                    return (
                        <Card key={key} className={cn(!daySchedule.enabled && 'opacity-60')}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={daySchedule.enabled}
                                            onCheckedChange={() => toggleDay(key)}
                                        />
                                        <div>
                                            <CardTitle className="text-base">{label}</CardTitle>
                                            {daySchedule.enabled && slotCount > 0 && (
                                                <CardDescription className="text-xs">
                                                    ~{slotCount} randevu slotu
                                                </CardDescription>
                                            )}
                                        </div>
                                    </div>

                                    {daySchedule.enabled && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copySchedule(key)}
                                                className="h-8"
                                            >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Kopyala
                                            </Button>
                                            {copySource && copySource !== key && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => pasteSchedule(key)}
                                                    className="h-8"
                                                >
                                                    Yapıştır
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => applyToAllDays(key)}
                                                className="h-8 text-primary"
                                            >
                                                Tüm Günlere Uygula
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            {daySchedule.enabled && (
                                <CardContent className="space-y-2">
                                    {daySchedule.slots.map((slot, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 flex-1">
                                                <Input
                                                    type="time"
                                                    value={slot.start}
                                                    onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                                                    className="w-32"
                                                />
                                                <span className="text-muted-foreground">-</span>
                                                <Input
                                                    type="time"
                                                    value={slot.end}
                                                    onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                                                    className="w-32"
                                                />
                                            </div>

                                            {daySchedule.slots.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeSlot(key, index)}
                                                    className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addSlot(key)}
                                        className="w-full mt-2"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Zaman Aralığı Ekle
                                    </Button>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

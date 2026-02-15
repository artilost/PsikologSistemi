'use client';

import { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import '@/styles/calendar.css';
import { Appointment } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Setup the localizer for date-fns
const locales = {
    'tr': tr,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarViewProps {
    appointments: Appointment[];
    onSelectEvent: (appointment: Appointment) => void;
    onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
    userRole: string;
}

// Custom Toolbar Component
const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
        toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
        toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
        toolbar.onNavigate('TODAY');
    };

    const label = () => {
        const date = toolbar.date;
        return (
            <span className="text-lg font-semibold capitalize">
                {format(date, 'MMMM yyyy', { locale: tr })}
            </span>
        );
    };

    return (
        <div className="flex items-center justify-between mb-4 p-2">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToBack}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNext}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToCurrent}>
                    Bugün
                </Button>
                <div className="ml-4">{label()}</div>
            </div>

            <div className="flex bg-muted rounded-md p-1">
                <button
                    onClick={() => toolbar.onView('month')}
                    className={cn(
                        "px-3 py-1 text-sm rounded-sm transition-colors",
                        toolbar.view === 'month' ? "bg-background shadow-sm" : "hover:bg-background/50"
                    )}
                >
                    Ay
                </button>
                <button
                    onClick={() => toolbar.onView('week')}
                    className={cn(
                        "px-3 py-1 text-sm rounded-sm transition-colors",
                        toolbar.view === 'week' ? "bg-background shadow-sm" : "hover:bg-background/50"
                    )}
                >
                    Hafta
                </button>
                <button
                    onClick={() => toolbar.onView('day')}
                    className={cn(
                        "px-3 py-1 text-sm rounded-sm transition-colors",
                        toolbar.view === 'day' ? "bg-background shadow-sm" : "hover:bg-background/50"
                    )}
                >
                    Gün
                </button>
            </div>
        </div>
    );
};

export function CalendarView({ appointments, onSelectEvent, onSelectSlot, userRole }: CalendarViewProps) {
    const [view, setView] = useState<View>(Views.WEEK);
    const [date, setDate] = useState(new Date());

    // Transform appointments to calendar events
    const events = appointments.map(apt => ({
        id: apt.id,
        title: userRole === 'THERAPIST'
            ? `${apt.client?.user?.firstName} ${apt.client?.user?.lastName} (${apt.type})`
            : `${apt.therapist?.user?.firstName} ${apt.therapist?.user?.lastName} (${apt.type})`,
        start: new Date(apt.startTime),
        end: new Date(apt.endTime),
        resource: apt,
        status: apt.status
    }));

    const eventPropGetter = useCallback(
        (event: any) => {
            let className = '';

            switch (event.status) {
                case 'CONFIRMED':
                    className = 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300';
                    break;
                case 'SCHEDULED':
                    className = 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
                    break;
                case 'CANCELLED':
                case 'NO_SHOW':
                    className = 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-300 opacity-70';
                    break;
                case 'COMPLETED':
                    className = 'bg-gray-100 border-gray-500 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                    break;
                default:
                    className = 'bg-primary/10 border-primary text-primary';
            }

            return {
                className: cn("border-l-4 text-xs p-1 rounded-sm overflow-hidden", className)
            };
        },
        []
    );

    return (
        <div className="h-[600px] bg-card rounded-lg border shadow-sm p-4">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectEvent={(event) => onSelectEvent(event.resource)}
                onSelectSlot={onSelectSlot}
                selectable={!!onSelectSlot}
                eventPropGetter={eventPropGetter}
                components={{
                    toolbar: CustomToolbar
                }}
                messages={{
                    week: 'Hafta',
                    work_week: 'Çalışma Haftası',
                    day: 'Gün',
                    month: 'Ay',
                    previous: 'Geri',
                    next: 'İleri',
                    today: 'Bugün',
                    agenda: 'Ajanda',
                    showMore: (total) => `+${total} daha fazla`,
                }}
                culture='tr'
                min={new Date(0, 0, 0, 8, 0, 0)} // Start at 08:00
                max={new Date(0, 0, 0, 22, 0, 0)} // End at 22:00
                step={30} // 30 minute intervals
                timeslots={2} // 2 slots per hour (with step=30, this gives us 30min slots)
                dayLayoutAlgorithm="no-overlap"
            />
        </div>
    );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

interface CampaignForCalendar {
  id: string;
  campaign_name: string;
  status: string;
  send_at?: string | null;
}

interface CampaignCalendarProps {
  campaigns: CampaignForCalendar[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (campaignId: string) => void;
}

export const CampaignCalendar = ({ campaigns, onDateClick, onEventClick }: CampaignCalendarProps) => {
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek'>('dayGridMonth');

  const events = campaigns
    .filter(c => c.send_at)
    .map(c => ({
      id: c.id,
      title: c.campaign_name,
      start: c.send_at!,
      backgroundColor: c.status === 'scheduled' ? 'hsl(var(--primary))' : 
                       c.status === 'active' ? 'hsl(var(--green-500))' : 
                       'hsl(var(--muted))',
      borderColor: 'transparent'
    }));

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendrier des Campagnes</CardTitle>
          <div className="flex gap-2">
            <button 
              onClick={() => setView('dayGridMonth')}
              className={`px-3 py-1 text-xs rounded ${view === 'dayGridMonth' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              Mois
            </button>
            <button 
              onClick={() => setView('timeGridWeek')}
              className={`px-3 py-1 text-xs rounded ${view === 'timeGridWeek' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              Semaine
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          locale={frLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={events}
          eventClick={(info) => onEventClick?.(info.event.id)}
          dateClick={(info) => onDateClick?.(info.date)}
          height="auto"
          editable={true}
          droppable={true}
        />
      </CardContent>
    </Card>
  );
};

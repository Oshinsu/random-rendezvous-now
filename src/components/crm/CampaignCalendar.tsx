import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Mail } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CampaignForCalendar {
  id: string;
  campaign_name: string;
  status: string;
  send_at?: string | null;
}

interface CampaignCalendarProps {
  campaigns: CampaignForCalendar[];
}

export const CampaignCalendar = ({ campaigns }: CampaignCalendarProps) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getCampaignsForDay = (day: Date) => {
    return campaigns.filter(c => 
      c.send_at && isSameDay(parseISO(c.send_at), day)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendrier des Campagnes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            {format(today, 'MMMM yyyy', { locale: fr })}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {daysInMonth.map((day) => {
            const campaignsForDay = getCampaignsForDay(day);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] p-2 border rounded-lg ${
                  isToday ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
                {campaignsForDay.length > 0 && (
                  <div className="space-y-1">
                    {campaignsForDay.slice(0, 2).map(campaign => (
                      <Badge
                        key={campaign.id}
                        variant="secondary"
                        className="text-[10px] w-full justify-start truncate"
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        {campaign.campaign_name}
                      </Badge>
                    ))}
                    {campaignsForDay.length > 2 && (
                      <p className="text-[10px] text-muted-foreground">
                        +{campaignsForDay.length - 2} autres
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

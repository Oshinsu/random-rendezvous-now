import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ScheduledGroupService } from '@/services/scheduledGroupService';
import { GeolocationService } from '@/services/geolocation';

interface ScheduleGroupButtonProps {
  onScheduled?: () => void;
}

export function ScheduleGroupButton({ onScheduled }: ScheduleGroupButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const timeSlots = [
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', 
    '21:00', '21:30', '22:00', '22:30', '23:00'
  ];

  const handleScheduleGroup = async () => {
    if (!user || !selectedDate || !selectedTime) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date et une heure",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get user location
      const userLocation = await GeolocationService.getCurrentLocation();
      if (!userLocation) {
        toast({
          title: "Erreur",
          description: "Impossible d'obtenir votre localisation",
          variant: "destructive"
        });
        return;
      }

      // Create scheduled datetime
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Create scheduled group
      const result = await ScheduledGroupService.createScheduledGroup(
        userLocation,
        scheduledDateTime,
        user.id
      );

      if (result.success) {
        toast({
          title: "Groupe planifié !",
          description: `Votre groupe a été planifié pour le ${format(scheduledDateTime, 'PPP à HH:mm', { locale: fr })}`,
        });
        setIsOpen(false);
        setSelectedDate(undefined);
        setSelectedTime(undefined);
        onScheduled?.();
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Erreur lors de la planification",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error scheduling group:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const canSchedule = selectedDate && selectedTime;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Clock className="h-4 w-4" />
          Planifier un groupe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Planifier un groupe</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => !isValidDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Heure</label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une heure" />
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleScheduleGroup}
              disabled={!canSchedule || isLoading}
              className="flex-1"
            >
              {isLoading ? "Planification..." : "Planifier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ManualScheduledGroupService } from '@/services/manualScheduledGroupService';

const FRENCH_CITIES = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 
  'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Étienne',
  'Toulon', 'Le Havre', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne'
];

const TIME_SLOTS = [
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

interface ManualScheduleGroupButtonProps {
  onScheduled?: () => void;
}

const ManualScheduleGroupButton: React.FC<ManualScheduleGroupButtonProps> = ({ onScheduled }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [barName, setBarName] = useState('');
  const [barAddress, setBarAddress] = useState('');

  const isValidDate = (date: Date | undefined): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const canSchedule = selectedDate && selectedTime && selectedCity && barName && barAddress;

  const handleScheduleGroup = async () => {
    if (!user || !selectedDate || !selectedTime || !selectedCity || !barName || !barAddress) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!isValidDate(selectedDate)) {
      toast.error('Veuillez sélectionner une date valide');
      return;
    }

    setLoading(true);

    try {
      // Create the scheduled datetime
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const result = await ManualScheduledGroupService.createScheduledGroup({
        scheduledFor: scheduledDateTime,
        cityName: selectedCity,
        barName: barName.trim(),
        barAddress: barAddress.trim()
      }, user.id);

      if (result.success) {
        toast.success('Groupe programmé avec succès !');
        setOpen(false);
        // Reset form
        setSelectedDate(undefined);
        setSelectedTime('');
        setSelectedCity('');
        setBarName('');
        setBarAddress('');
        onScheduled?.();
      } else {
        toast.error(result.error || 'Erreur lors de la programmation du groupe');
      }
    } catch (error) {
      console.error('Error scheduling group:', error);
      toast.error('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Planifier un groupe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Planifier un groupe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* City Selection */}
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une ville" />
              </SelectTrigger>
              <SelectContent>
                {FRENCH_CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bar Name */}
          <div className="space-y-2">
            <Label htmlFor="barName">Nom du bar</Label>
            <Input
              id="barName"
              value={barName}
              onChange={(e) => setBarName(e.target.value)}
              placeholder="Ex: Le Procope"
            />
          </div>

          {/* Bar Address */}
          <div className="space-y-2">
            <Label htmlFor="barAddress">Adresse du bar</Label>
            <Input
              id="barAddress"
              value={barAddress}
              onChange={(e) => setBarAddress(e.target.value)}
              placeholder="Ex: 13 Rue de l'Ancienne Comédie, 75006 Paris"
            />
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date</Label>
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
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Heure</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une heure" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleScheduleGroup} 
              disabled={!canSchedule || loading}
            >
              {loading ? 'Planification...' : 'Planifier'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualScheduleGroupButton;
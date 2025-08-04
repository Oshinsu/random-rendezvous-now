import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, MapPin, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedScheduledGroupService, CreateScheduledGroupData } from '@/services/unifiedScheduledGroupService';

// French cities for manual selection
const FRENCH_CITIES = [
  'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg',
  'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Étienne', 'Toulon', 'Le Havre', 'Grenoble',
  'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Clermont-Ferrand', 'Le Mans', 'Aix-en-Provence',
  'Brest', 'Tours', 'Amiens', 'Limoges', 'Annecy', 'Perpignan', 'Boulogne-Billancourt'
];

// Time slots for scheduling
const TIME_SLOTS = [
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

interface UnifiedScheduleGroupButtonProps {
  onScheduled?: () => void;
}

const UnifiedScheduleGroupButton: React.FC<UnifiedScheduleGroupButtonProps> = ({ onScheduled }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [barName, setBarName] = useState<string>('');
  const [barAddress, setBarAddress] = useState<string>('');

  const isValidDate = (date: Date | undefined): boolean => {
    if (!date) return false;
    return date > new Date();
  };

  const canSchedule = Boolean(
    selectedDate && 
    selectedTime && 
    isValidDate(selectedDate) &&
    selectedCity && 
    barName && 
    barAddress
  );

  const handleScheduleGroup = async () => {
    if (!user || !canSchedule) return;

    setLoading(true);
    try {
      // Create scheduled datetime
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledFor = new Date(selectedDate!);
      scheduledFor.setHours(hours, minutes, 0, 0);

      const createData: CreateScheduledGroupData = {
        scheduledFor,
        cityName: selectedCity,
        barName: barName,
        barAddress: barAddress
      };

      const result = await UnifiedScheduledGroupService.createScheduledGroup(createData, user.id);

      if (result.success) {
        toast({
          title: "Groupe planifié !",
          description: `Votre groupe est programmé pour le ${format(scheduledFor, 'PPP à HH:mm', { locale: fr })}`
        });
        
        // Reset form
        setSelectedDate(undefined);
        setSelectedTime('');
        setSelectedCity('');
        setBarName('');
        setBarAddress('');
        setOpen(false);
        
        onScheduled?.();
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de créer le groupe planifié",
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
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Clock className="h-4 w-4" />
          Planifier un groupe
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto data-[state=closed]:duration-0">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Clock className="h-5 w-5 text-primary" />
            Planifier un groupe
          </DialogTitle>
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border-l-4 border-primary">
            <p>Choisissez le bar et la ville où vous souhaitez vous retrouver.</p>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* City Selection */}
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-primary" />
              Ville
            </Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-12 border-input focus:border-primary focus:ring-primary/20">
                <SelectValue placeholder="Sélectionnez une ville" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg z-50 max-h-60">
                {FRENCH_CITIES.map((city) => (
                  <SelectItem key={city} value={city} className="hover:bg-accent hover:text-accent-foreground cursor-pointer">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Bar Name */}
          <div className="space-y-2">
            <Label htmlFor="barName" className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-primary" />
              Nom du bar
            </Label>
            <Input
              id="barName"
              value={barName}
              onChange={(e) => setBarName(e.target.value)}
              placeholder="Ex: Le Comptoir du 7ème"
              className="h-12 border-input focus:border-primary focus:ring-primary/20"
            />
          </div>
          
          {/* Bar Address */}
          <div className="space-y-2">
            <Label htmlFor="barAddress" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-primary" />
              Adresse du bar
            </Label>
            <Input
              id="barAddress"
              value={barAddress}
              onChange={(e) => setBarAddress(e.target.value)}
              placeholder="Ex: 123 rue de la République"
              className="h-12 border-input focus:border-primary focus:ring-primary/20"
            />
          </div>
          
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal border-input",
                    !selectedDate && "text-muted-foreground",
                    "hover:bg-accent focus:border-primary focus:ring-primary/20"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Choisir une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border-border shadow-lg z-50" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-primary" />
              Heure
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="h-12 border-input focus:border-primary focus:ring-primary/20">
                <SelectValue placeholder="Choisir une heure" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg z-50 max-h-60">
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time} className="hover:bg-accent hover:text-accent-foreground cursor-pointer">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 pt-6 border-t sm:flex-row sm:justify-end">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="h-12 border-input hover:bg-accent"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleScheduleGroup}
            disabled={!canSchedule || loading}
            className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
          >
            {loading ? 'Planification...' : 'Planifier'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedScheduleGroupButton;
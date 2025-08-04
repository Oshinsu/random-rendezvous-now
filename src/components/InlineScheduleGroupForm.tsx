import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface InlineScheduleGroupFormProps {
  onScheduled?: () => void;
}

const InlineScheduleGroupForm: React.FC<InlineScheduleGroupFormProps> = ({ onScheduled }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form fields
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [barName, setBarName] = useState<string>('');
  const [barAddress, setBarAddress] = useState<string>('');

  const isValidDate = (date: Date | undefined): boolean => {
    if (!date) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const maxFutureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours max
    
    return selectedDay >= today && selectedDay <= maxFutureDate;
  };

  // Filtrer les créneaux horaires pour aujourd'hui
  const getAvailableTimeSlots = (): string[] => {
    if (!selectedDate) return TIME_SLOTS;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // Si la date sélectionnée n'est pas aujourd'hui, tous les créneaux sont disponibles
    if (selectedDay.getTime() !== today.getTime()) {
      return TIME_SLOTS;
    }
    
    // Pour aujourd'hui, filtrer les créneaux qui sont au moins 30 minutes dans le futur
    const minFutureTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes d'avance
    
    return TIME_SLOTS.filter(timeSlot => {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
      return slotDateTime >= minFutureTime;
    });
  };

  const canScheduleAtTime = (timeSlot: string): boolean => {
    if (!selectedDate) return false;
    
    const now = new Date();
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    // Vérifier que c'est au moins 30 minutes dans le futur
    const minFutureTime = new Date(now.getTime() + 30 * 60 * 1000);
    return slotDateTime >= minFutureTime;
  };

  const canSchedule = Boolean(
    selectedDate && 
    selectedTime && 
    isValidDate(selectedDate) &&
    canScheduleAtTime(selectedTime) &&
    selectedCity && 
    barName && 
    barAddress
  );

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime('');
    setSelectedCity('');
    setBarName('');
    setBarAddress('');
  };

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
        
        resetForm();
        setShowForm(false);
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

  if (!showForm) {
    return (
      <Button 
        onClick={() => setShowForm(true)}
        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Clock className="h-4 w-4" />
        Planifier un groupe
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Planifier un nouveau groupe
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choisissez le bar et la ville où vous souhaitez vous retrouver.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City Selection */}
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-primary" />
              Ville
            </Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Sélectionnez une ville" />
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
            <Label htmlFor="barName" className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-primary" />
              Nom du bar
            </Label>
            <Input
              id="barName"
              value={barName}
              onChange={(e) => setBarName(e.target.value)}
              placeholder="Ex: Le Comptoir du 7ème"
              className="h-12"
            />
          </div>
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
            className="h-12"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    "w-full h-12 justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Choisir une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const maxFutureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return date < today || date > maxFutureDate;
                  }}
                  initialFocus
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
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Choisir une heure" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableTimeSlots().map((time) => (
                  <SelectItem 
                    key={time} 
                    value={time}
                    disabled={!canScheduleAtTime(time)}
                  >
                    {time}
                    {!canScheduleAtTime(time) && ' (passé)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
          <Button 
            variant="outline" 
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
            className="h-12"
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
      </CardContent>
    </Card>
  );
};

export default InlineScheduleGroupForm;
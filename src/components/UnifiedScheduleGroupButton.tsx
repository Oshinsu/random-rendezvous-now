import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedScheduledGroupService, CreateScheduledGroupData } from '@/services/unifiedScheduledGroupService';
import { GeolocationService } from '@/services/geolocation';

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
  const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');
  
  // Common fields
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Manual mode fields
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
    (mode === 'automatic' || (selectedCity && barName && barAddress))
  );

  const handleScheduleGroup = async () => {
    if (!user || !canSchedule) return;

    setLoading(true);
    try {
      // Create scheduled datetime
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledFor = new Date(selectedDate!);
      scheduledFor.setHours(hours, minutes, 0, 0);

      let createData: CreateScheduledGroupData = {
        scheduledFor
      };

      if (mode === 'automatic') {
        // Get user location for automatic mode
        const userLocation = await GeolocationService.getCurrentLocation();
        if (!userLocation) {
          toast({
            title: "Erreur de géolocalisation",
            description: "Impossible d'obtenir votre position actuelle",
            variant: "destructive"
          });
          return;
        }
        createData.userLocation = userLocation;
      } else {
        // Manual mode data
        createData.cityName = selectedCity;
        createData.barName = barName;
        createData.barAddress = barAddress;
      }

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
        <Button className="gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-medium">
          <Clock className="h-4 w-4" />
          Planifier un groupe
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Planifier un groupe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Mode Selection */}
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'automatic' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="automatic" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Automatique
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Manuel
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="automatic" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p>Mode automatique : Un bar sera automatiquement sélectionné près de votre position lorsque le groupe sera complet.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p>Mode manuel : Choisissez le bar et la ville où vous souhaitez vous retrouver.</p>
              </div>
              
              {/* City Selection */}
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
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
                <Label htmlFor="barName">Nom du bar</Label>
                <Input
                  id="barName"
                  value={barName}
                  onChange={(e) => setBarName(e.target.value)}
                  placeholder="Ex: Le Comptoir du 7ème"
                />
              </div>
              
              {/* Bar Address */}
              <div className="space-y-2">
                <Label htmlFor="barAddress">Adresse du bar</Label>
                <Input
                  id="barAddress"
                  value={barAddress}
                  onChange={(e) => setBarAddress(e.target.value)}
                  placeholder="Ex: 123 rue de la République"
                />
              </div>
            </TabsContent>
          </Tabs>
          
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
                  {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Choisir une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleScheduleGroup}
            disabled={!canSchedule || loading}
            className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white"
          >
            {loading ? 'Planification...' : 'Planifier'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedScheduleGroupButton;
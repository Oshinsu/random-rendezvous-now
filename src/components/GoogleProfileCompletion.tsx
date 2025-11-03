import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export const GoogleProfileCompletion = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [gender, setGender] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) return;

      // Vérifier si le profil est complet
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('gender, city')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // Si gender ou city manquant, ouvrir la modal
      if (!profile?.gender || !profile?.city) {
        setIsOpen(true);
      }
    };

    checkProfileCompletion();
  }, [user]);

  const handleSubmit = async () => {
    if (!gender || !city) {
      toast({
        title: t('auth.complete_profile_error'),
        description: t('auth.complete_profile_desc'),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Mettre à jour le profil
      const { error } = await supabase
        .from('profiles')
        .update({ 
          gender: gender as 'male' | 'female' | 'non_binary' | 'prefer_not_to_say',
          city 
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast({
        title: t('auth.profile_completed'),
        description: t('auth.welcome_to_random')
      });

      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('auth.complete_your_profile')}</DialogTitle>
          <DialogDescription>
            {t('auth.complete_profile_subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('auth.gender')}</Label>
            <RadioGroup value={gender} onValueChange={setGender}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="modal-male" />
                <Label htmlFor="modal-male" className="font-normal">{t('auth.male')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="modal-female" />
                <Label htmlFor="modal-female" className="font-normal">{t('auth.female')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non_binary" id="modal-non_binary" />
                <Label htmlFor="modal-non_binary" className="font-normal">{t('auth.non_binary')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prefer_not_to_say" id="modal-prefer" />
                <Label htmlFor="modal-prefer" className="font-normal">{t('auth.prefer_not_to_say')}</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>{t('auth.city')}</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder={t('auth.city_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paris">Paris</SelectItem>
                <SelectItem value="Lyon">Lyon</SelectItem>
                <SelectItem value="Marseille">Marseille</SelectItem>
                <SelectItem value="Toulouse">Toulouse</SelectItem>
                <SelectItem value="Nice">Nice</SelectItem>
                <SelectItem value="Nantes">Nantes</SelectItem>
                <SelectItem value="Strasbourg">Strasbourg</SelectItem>
                <SelectItem value="Montpellier">Montpellier</SelectItem>
                <SelectItem value="Bordeaux">Bordeaux</SelectItem>
                <SelectItem value="Lille">Lille</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? t('common.loading') : t('auth.complete_profile')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

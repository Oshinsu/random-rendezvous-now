import { useState } from 'react';
import { NOTIFICATION_COPIES, formatNotificationCopy } from '@/constants/notificationCopies';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PushPreviewDevice } from './PushPreviewDevice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Smartphone, Save, RotateCcw, Sparkles } from 'lucide-react';

type NotificationType = keyof typeof NOTIFICATION_COPIES;
type VariantKey = string;

export const NotificationCopyEditor = () => {
  const { user } = useAuth();
  const [activeType, setActiveType] = useState<NotificationType>('GROUP_CONFIRMED');
  const [activeVariant, setActiveVariant] = useState<VariantKey>('default');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');
  const [deviceType, setDeviceType] = useState<'iphone' | 'android'>('iphone');
  const [saving, setSaving] = useState(false);

  // Charger la copie sélectionnée
  const loadCopy = (type: NotificationType, variant: VariantKey) => {
    const copy = NOTIFICATION_COPIES[type];
    if (copy && copy[variant]) {
      setEditedTitle(copy[variant].title);
      setEditedBody(copy[variant].body);
    }
  };

  // Changer de type
  const handleTypeChange = (newType: string) => {
    const type = newType as NotificationType;
    setActiveType(type);
    const variants = Object.keys(NOTIFICATION_COPIES[type]);
    const firstVariant = variants[0] || 'default';
    setActiveVariant(firstVariant);
    loadCopy(type, firstVariant);
  };

  // Changer de variante
  const handleVariantChange = (variant: string) => {
    setActiveVariant(variant);
    loadCopy(activeType, variant);
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          custom_copies: {
            [activeType]: {
              [activeVariant]: {
                title: editedTitle,
                body: editedBody,
                imageUrl: editedImageUrl || undefined,
              },
            },
          },
        });

      if (error) throw error;

      toast.success('✅ Copie sauvegardée avec succès');
    } catch (error) {
      console.error('Error saving copy:', error);
      toast.error('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Réinitialiser la copie
  const handleReset = () => {
    loadCopy(activeType, activeVariant);
    setEditedImageUrl('');
    toast.info('Copie réinitialisée');
  };

  // Variables d'exemple pour la preview
  const previewVariables = {
    first_name: 'Alex',
    bar_name: 'Le Perchoir',
    time: '20h30',
    count: 3,
    remaining: 2,
    minutes: 15,
    active_count: 12,
  };

  const previewCopy = formatNotificationCopy(
    { title: editedTitle, body: editedBody },
    previewVariables
  );

  const notificationTypes: { value: NotificationType; label: string; emoji: string }[] = [
    { value: 'GROUP_CONFIRMED', label: 'Groupe confirmé', emoji: '🎉' },
    { value: 'GROUP_FORMING', label: 'Groupe en formation', emoji: '🔥' },
    { value: 'WELCOME_FUN', label: 'Bienvenue', emoji: '👋' },
    { value: 'FIRST_WIN', label: 'Première sortie', emoji: '🎊' },
    { value: 'PEAK_HOURS_FOMO', label: 'FOMO peak hours', emoji: '⏰' },
    { value: 'COMEBACK_COOL', label: 'Comeback', emoji: '💫' },
    { value: 'MEETING_REMINDER', label: 'Rappel RDV', emoji: '🔔' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Éditeur gauche */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Éditeur de copies
            </CardTitle>
            <CardDescription>
              Personnalise les notifications envoyées aux utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection du type */}
            <div className="space-y-2">
              <Label>Type de notification</Label>
              <Select value={activeType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.emoji} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sélection de la variante */}
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={activeVariant} onValueChange={handleVariantChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(NOTIFICATION_COPIES[activeType]).map((variant) => (
                    <SelectItem key={variant} value={variant}>
                      {variant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Titre */}
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Ex: 🎉 C'est parti ! Groupe confirmé"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {editedTitle.length}/60 caractères
              </p>
            </div>

            {/* Corps du message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                placeholder="Ex: RDV au {{bar_name}} {{time}} — On se voit là-bas 🍹✨"
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {editedBody.length}/200 caractères • Variables: {'{{'} bar_name, time, count, first_name {'}}'}
              </p>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label>Image (optionnel)</Label>
              <Input
                value={editedImageUrl}
                onChange={(e) => setEditedImageUrl(e.target.value)}
                placeholder="https://... ou /notif-welcome.png"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || !editedTitle || !editedBody}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview droite */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Prévisualisation
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Button
                variant={deviceType === 'iphone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceType('iphone')}
              >
                iPhone
              </Button>
              <Button
                variant={deviceType === 'android' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceType('android')}
              >
                Android
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <PushPreviewDevice
              deviceType={deviceType}
              notification={{
                title: previewCopy.title,
                body: previewCopy.body,
                icon: '/notification-icon.png',
                imageUrl: editedImageUrl || undefined,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

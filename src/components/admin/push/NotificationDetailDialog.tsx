import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Save, 
  Trash2, 
  Sparkles, 
  TrendingUp,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { NotificationTypeConfig } from '@/hooks/useNotificationTypesConfig';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NotificationDeliveryFlow } from './NotificationDeliveryFlow';
import { NotificationAnalyticsCharts } from './NotificationAnalyticsCharts';
import { NotificationTestSend } from './NotificationTestSend';
import { NotificationTechnicalDocs } from './NotificationTechnicalDocs';
import { NotificationVariantsAB } from './NotificationVariantsAB';
import { NotificationImageEditor } from './NotificationImageEditor';
import { PushPreviewDevice } from './PushPreviewDevice';
import { toast } from 'sonner';

const CATEGORY_ICONS = {
  groups: '👥',
  lifecycle: '🎁',
  bars: '🏢',
  messages: '💬',
  promotions: '📢',
};

interface NotificationDetailDialogProps {
  notification: NotificationTypeConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<NotificationTypeConfig>) => void;
  onDelete?: (id: string) => void;
}

export const NotificationDetailDialog = ({
  notification,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: NotificationDetailDialogProps) => {
  const [editedCopy, setEditedCopy] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState('default');
  const [priority, setPriority] = useState(notification?.priority || 5);
  const [isImproving, setIsImproving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'iphone' | 'android'>('iphone');

  if (!notification) return null;

  const currentCopy = editedCopy || notification.default_copy?.[selectedVariant] || { title: '', body: '' };

  const handleSave = () => {
    onUpdate(notification.id, {
      default_copy: {
        ...notification.default_copy,
        [selectedVariant]: currentCopy,
      },
      priority,
    });
    toast.success('✅ Notification mise à jour');
    onOpenChange(false);
  };

  const handleAIImprove = async () => {
    setIsImproving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/improve-notification-copy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            current_title: currentCopy.title,
            current_body: currentCopy.body,
            notification_type: notification.type_key,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to improve copy');

      const { improved_title, improved_body } = await response.json();
      setEditedCopy({ title: improved_title, body: improved_body });
      toast.success('✨ Copy améliorée par l\'IA');
    } catch (error) {
      toast.error('❌ Erreur lors de l\'amélioration IA');
    } finally {
      setIsImproving(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Supprimer définitivement la notification "${notification.display_name}" ?`)) {
      onDelete?.(notification.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{CATEGORY_ICONS[notification.category]}</span>
              <div>
                <DialogTitle className="text-2xl">
                  {notification.display_name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{notification.type_key}</p>
              </div>
            </div>
            <Badge variant={notification.is_active ? 'default' : 'secondary'}>
              {notification.is_active ? '✓ Active' : '○ Inactive'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* SECTION 1: Metadata (Left) */}
            <div className="col-span-3 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Statut</Label>
                    <Switch
                      checked={notification.is_active}
                      onCheckedChange={(checked) =>
                        onUpdate(notification.id, { is_active: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Priorité : {priority}</Label>
                    <Slider
                      value={[priority]}
                      onValueChange={([val]) => setPriority(val)}
                      min={1}
                      max={10}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      1 = Basse | 10 = Critique
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs text-muted-foreground">Catégorie</Label>
                    <Badge className="mt-1">{notification.category}</Badge>
                  </div>

                  {notification.tags && notification.tags.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {notification.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Stats 30j
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Envoyées</Label>
                    <p className="text-2xl font-bold">
                      {notification.total_sent_30d?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Open Rate</Label>
                    <p className={`text-2xl font-bold ${
                      (notification.open_rate || 0) >= 40 ? 'text-green-600' : 
                      (notification.open_rate || 0) >= 25 ? 'text-orange-600' : 
                      'text-red-600'
                    }`}>
                      {notification.open_rate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Dernière envoyée</Label>
                    <p className="text-sm">
                      {notification.last_sent_at
                        ? formatDistanceToNow(new Date(notification.last_sent_at), {
                            addSuffix: true,
                            locale: fr,
                          })
                        : 'Jamais'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>

            {/* SECTION 2: Customization & Preview (Center) */}
            <div className="col-span-6 space-y-4">
              <Tabs defaultValue="copy" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="copy">Copy</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="variants">Variants A/B</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="test">Test</TabsTrigger>
                </TabsList>

                <TabsContent value="copy" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Éditeur de Copy</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAIImprove}
                          disabled={isImproving}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isImproving ? 'Amélioration...' : 'AI Improve'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Variante</Label>
                        <select
                          className="w-full mt-1 p-2 border rounded"
                          value={selectedVariant}
                          onChange={(e) => setSelectedVariant(e.target.value)}
                        >
                          {Object.keys(notification.default_copy || {}).map((variant) => (
                            <option key={variant} value={variant}>
                              {variant}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Titre</Label>
                          <span className="text-xs text-muted-foreground">
                            {currentCopy.title?.length || 0}/60
                          </span>
                        </div>
                        <Input
                          value={currentCopy.title || ''}
                          onChange={(e) =>
                            setEditedCopy({ ...currentCopy, title: e.target.value })
                          }
                          maxLength={60}
                          placeholder="🎉 Titre accrocheur..."
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Body</Label>
                          <span className="text-xs text-muted-foreground">
                            {currentCopy.body?.length || 0}/200
                          </span>
                        </div>
                        <Textarea
                          value={currentCopy.body || ''}
                          onChange={(e) =>
                            setEditedCopy({ ...currentCopy, body: e.target.value })
                          }
                          maxLength={200}
                          rows={4}
                          placeholder="Message captivant avec variables {{first_name}}, {{bar_name}}..."
                        />
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">
                          Variables disponibles :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['{{first_name}}', '{{bar_name}}', '{{time}}', '{{count}}'].map(
                            (variable) => (
                              <Badge key={variable} variant="secondary" className="text-xs">
                                {variable}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <NotificationVariantsAB notification={notification} />
                </TabsContent>

                <TabsContent value="images">
                  <NotificationImageEditor notification={notification} />
                </TabsContent>

                <TabsContent value="variants">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">A/B Testing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Feature A/B Testing à venir</p>
                        <p className="text-xs mt-1">
                          Créez des variantes et testez automatiquement les meilleures
                          performances
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <div className="flex justify-center gap-2 mb-4">
                    <Button
                      variant={previewDevice === 'iphone' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewDevice('iphone')}
                    >
                      📱 iPhone
                    </Button>
                    <Button
                      variant={previewDevice === 'android' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewDevice('android')}
                    >
                      🤖 Android
                    </Button>
                  </div>

                  <div className="flex justify-center">
                    <PushPreviewDevice
                      notification={{
                        title: currentCopy.title || 'Titre de notification',
                        body: currentCopy.body || 'Corps du message...',
                        imageUrl: notification.default_copy?.image_url,
                      }}
                      deviceType={previewDevice}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="test">
                  <NotificationTestSend notification={notification} currentCopy={currentCopy} />
                </TabsContent>
              </Tabs>
            </div>

            {/* SECTION 3: Delivery Rules & Analytics (Right) */}
            <div className="col-span-3 space-y-4">
              <Tabs defaultValue="delivery" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="delivery">Delivery</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="docs">Docs</TabsTrigger>
                </TabsList>

                <TabsContent value="delivery">
                  <NotificationDeliveryFlow notification={notification} />
                </TabsContent>

                <TabsContent value="analytics">
                  <NotificationAnalyticsCharts notification={notification} />
                </TabsContent>

                <TabsContent value="docs">
                  <NotificationTechnicalDocs notification={notification} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Créée le{' '}
            {new Date(notification.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

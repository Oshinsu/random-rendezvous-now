import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NotificationTypeConfig } from '@/hooks/useNotificationTypesConfig';
import { Upload, Image as ImageIcon, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NotificationImageEditorProps {
  notification: NotificationTypeConfig;
}

export const NotificationImageEditor = ({ notification }: NotificationImageEditorProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(notification.default_copy?.image_url || '');

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      toast.error('❌ Fichier doit être une image');
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('❌ Image trop grande (max 2MB)');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${notification.type_key}_${Date.now()}.${fileExt}`;
      const filePath = `notification-images/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('notification_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const { data } = supabase.storage
        .from('notification_images')
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
      toast.success('✅ Image uploadée');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('❌ Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    setImageUrl('');
    toast.success('Image supprimée');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Images & Media
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hero Image */}
        <div>
          <Label>Hero Image (Rich Notification)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Image 2:1 ratio, optimale 1200x600px
          </p>
          
          {imageUrl ? (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Hero"
                className="w-full h-32 object-cover rounded-lg border"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(imageUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-2">
                Glisse une image ou clique pour uploader
              </p>
              <Input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="max-w-xs mx-auto"
              />
            </div>
          )}
        </div>

        {/* Icon */}
        <div>
          <Label>Icon (Petite notification)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            192x192px, PNG transparent
          </p>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">notification-icon.png</p>
              <p className="text-xs text-muted-foreground">Default Random branding</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
            📊 Impact des Images
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Les rich notifications avec images ont +56% d'open rate en moyenne
          </p>
        </div>

        {uploading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Upload en cours...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

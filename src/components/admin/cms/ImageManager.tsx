import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  Image as ImageIcon, 
  Link, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  RotateCcw, 
  ZoomIn,
  Download,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImageManagerProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  label?: string;
}

export const ImageManager = ({ value, onChange, onSave, isSaving = false, label }: ImageManagerProps) => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload' | 'gallery'>('url');
  const [imageUrl, setImageUrl] = useState(value);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Images actuellement utilisées dans le projet
  const galleryImages = [
    '/src/assets/new-hero-banner.jpg',
    '/src/assets/new-benefit-1.jpg',
    '/src/assets/new-benefit-2.jpg',
    '/src/assets/new-benefit-3.jpg',
    '/src/assets/new-benefit-4.jpg',
    '/src/assets/step-1.png',
    '/src/assets/step-2.png',
    '/src/assets/step-3.png',
  ];

  const handleUrlChange = (newUrl: string) => {
    setImageUrl(newUrl);
    onChange(newUrl);
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner un fichier image valide");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB (limite du bucket)
      toast.error("L'image doit faire moins de 5MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Générer un nom de fichier unique avec timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      // Preview local pendant l'upload
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);

      // Upload vers Supabase Storage
      setUploadProgress(30);
      
      const { data, error } = await supabase.storage
        .from('site-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      setUploadProgress(70);

      // Générer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('site-images')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      
      // Mettre à jour l'URL dans le state
      handleUrlChange(publicUrl);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

      toast.success("Image uploadée vers Supabase Storage");

    } catch (error: any) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      setImagePreview(null);
      
      toast.error(error.message || "Impossible d'uploader l'image");
    }
  }, [onChange, toast]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("URL copiée dans le presse-papiers");
    } catch (err) {
      toast.error("Impossible de copier l'URL");
    }
  };

  const clearImage = () => {
    setImageUrl('');
    onChange('');
    setImagePreview(null);
  };

  const selectGalleryImage = (imagePath: string) => {
    handleUrlChange(imagePath);
    setActiveTab('url');
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {label && <Label className="text-base font-medium">{label}</Label>}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                Image
              </Badge>
              {imageUrl && (
                <Badge variant="secondary" className="text-xs">
                  {imageUrl.split('/').pop()?.substring(0, 20)}...
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {imageUrl && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(imageUrl)}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Aperçu de l'image</DialogTitle>
                      <DialogDescription>
                        {imageUrl}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center">
                      <img 
                        src={imageUrl} 
                        alt="Aperçu" 
                        className="max-h-96 max-w-full object-contain rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearImage}
                  title="Supprimer l'image"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button
              onClick={onSave}
              disabled={isSaving}
              size="sm"
              className="flex items-center gap-2"
            >
              {isSaving ? <RotateCcw className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'url' | 'upload' | 'gallery')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Galerie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">URL de l'image</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg ou /src/assets/image.jpg"
                className="w-full"
              />
            </div>
            
            {imageUrl && (
              <div className="border rounded-md p-4 bg-muted/30">
                <img 
                  src={imageUrl} 
                  alt="Aperçu" 
                  className="max-h-48 max-w-full object-contain mx-auto rounded-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyVjE5QTIgMiAwIDAgMSAxOSAyMUg1QTIgMiAwIDAgMSAzIDE5VjVBMiAyIDAgMCAxIDUgM0gxMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjkiIGN5PSI5IiByPSIyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHN2ZyBnZW5lcmF0ZWQgYnkgTHVjaWRlLnJ1bj4K';
                    target.alt = 'Image non trouvée';
                  }}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Uploader une image</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cliquez pour sélectionner ou glissez-déposez votre image ici
              </p>
              <p className="text-xs text-muted-foreground">
                Formats supportés: JPG, PNG, GIF, WebP • Max 10MB
              </p>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {imagePreview && (
              <div className="border rounded-md p-4 bg-muted/30">
                <img 
                  src={imagePreview} 
                  alt="Aperçu upload" 
                  className="max-h-48 max-w-full object-contain mx-auto rounded-md"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {galleryImages.map((imagePath, index) => (
                <div
                  key={index}
                  className={`relative group cursor-pointer border-2 rounded-md overflow-hidden transition-all duration-200 ${
                    imageUrl === imagePath ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-muted-foreground/50'
                  }`}
                  onClick={() => selectGalleryImage(imagePath)}
                >
                  <img
                    src={imagePath}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-24 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                    <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  {imageUrl === imagePath && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-4 w-4 text-primary bg-primary-foreground rounded-full p-0.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Cliquez sur une image pour la sélectionner
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
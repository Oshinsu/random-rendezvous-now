import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageManager } from './ImageManager';
import { SiteContent } from '@/hooks/useSiteContent';
import { Image, Eye, Edit, Trash2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImageGalleryProps {
  images: SiteContent[];
  onUpdate: (id: string, value: any) => Promise<boolean>;
  onRefresh: () => void;
}

export const ImageGallery = ({ images, onUpdate, onRefresh }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<SiteContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    if (selectedImage) {
      await onRefresh();
      setIsEditing(false);
      setSelectedImage(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((image) => {
          const imageUrl = typeof image.content_value === 'string' 
            ? image.content_value 
            : '';

          return (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative group">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={image.content_key}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedImage(image);
                        setIsEditing(false);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedImage(image);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{image.content_key}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {image.description || 'Aucune description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {image.page_section}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Image className="h-3 w-3 mr-1" />
                      Image
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog pour visualiser/éditer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              {selectedImage?.content_key}
            </DialogTitle>
            <DialogDescription>
              {selectedImage?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedImage && (
            <div className="space-y-4">
              {isEditing ? (
                <ImageManager
                  value={typeof selectedImage.content_value === 'string' ? selectedImage.content_value : ''}
                  onChange={(value) => {
                    setSelectedImage({
                      ...selectedImage,
                      content_value: value
                    });
                  }}
                  onSave={async () => {
                    await onUpdate(selectedImage.id, selectedImage.content_value);
                    handleSave();
                  }}
                  label="Modifier l'image"
                />
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <img
                      src={typeof selectedImage.content_value === 'string' ? selectedImage.content_value : ''}
                      alt={selectedImage.content_key}
                      className="max-w-full h-auto rounded-md mx-auto"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Modifier
                    </Button>
                    {typeof selectedImage.content_value === 'string' && (
                      <Button
                        variant="outline"
                        asChild
                      >
                        <a
                          href={selectedImage.content_value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ouvrir
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
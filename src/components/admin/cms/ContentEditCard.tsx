import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Check, X, Type, Image as ImageIcon, Code, FileText, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteContent } from '@/contexts/SiteContentContext';
import { toast } from 'sonner';
import { ImageManager } from './ImageManager';

interface ContentEditCardProps {
  content: SiteContent;
  onUpdate: (id: string, value: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export const ContentEditCard = ({ content, onUpdate, onDelete }: ContentEditCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content.content_value);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4 text-green-600" />;
      case 'image':
        return <ImageIcon className="h-4 w-4 text-blue-600" />;
      case 'html':
        return <Code className="h-4 w-4 text-purple-600" />;
      case 'json':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'border-l-green-500';
      case 'image':
        return 'border-l-blue-500';
      case 'html':
        return 'border-l-purple-500';
      case 'json':
        return 'border-l-orange-500';
      default:
        return 'border-l-neutral-500';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    const success = await onUpdate(content.id, value);
    setIsLoading(false);
    
    if (success) {
      setIsEditing(false);
      toast.success(`"${content.content_key.replace(/_/g, ' ')}" sauvegardé`, {
        description: `Modifié à ${new Date().toLocaleTimeString('fr-FR')}`,
        duration: 3000
      });
    } else {
      toast.error("Échec de la sauvegarde", {
        description: "Veuillez réessayer",
        action: {
          label: "Réessayer",
          onClick: handleSave
        }
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await onDelete(content.id);
    setIsDeleting(false);
    
    if (success) {
      setShowDeleteDialog(false);
      toast.success("Contenu supprimé", {
        description: `"${content.content_key.replace(/_/g, ' ')}" a été supprimé`
      });
    } else {
      toast.error("Échec de la suppression", {
        description: "Veuillez réessayer"
      });
    }
  };

  const handleCancel = () => {
    setValue(content.content_value);
    setIsEditing(false);
  };

  const getCharacterCount = () => {
    if (typeof value === 'string') {
      return value.length;
    }
    return JSON.stringify(value).length;
  };

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md border-l-4',
        getBorderColor(content.content_type)
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {getContentTypeIcon(content.content_type)}
            <CardTitle className="text-sm font-medium">
              {content.content_key.replace(/_/g, ' ')}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {content.content_type}
            </Badge>
            {!isEditing ? (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Supprimer ce contenu ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Le contenu "<strong>{content.content_key}</strong>" sera définitivement supprimé.
                      Cette action est irréversible.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Supprimer'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {content.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {content.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-2">
            {content.content_type === 'text' ? (
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={4}
                className="font-mono text-sm"
                disabled={isLoading}
              />
            ) : content.content_type === 'image' ? (
              <ImageManager
                value={typeof value === 'string' ? value : JSON.stringify(value)}
                onChange={(newUrl) => setValue(newUrl)}
                onSave={handleSave}
                isSaving={isLoading}
                label={content.content_key.replace(/_/g, ' ')}
              />
            ) : content.content_type === 'html' ? (
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={6}
                className="font-mono text-xs"
                disabled={isLoading}
              />
            ) : (
              <Textarea
                value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    setValue(JSON.parse(e.target.value));
                  } catch {
                    setValue(e.target.value);
                  }
                }}
                rows={6}
                className="font-mono text-xs"
                disabled={isLoading}
              />
            )}
            {content.content_type === 'text' && (
              <div className="text-xs text-muted-foreground text-right">
                {getCharacterCount()} caractères
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {content.content_type === 'image' ? (
              <div className="space-y-2">
                <img
                  src={value}
                  alt={content.content_key}
                  className="w-full h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Image+Error';
                  }}
                />
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {value}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground line-clamp-3">
                {typeof value === 'string' ? value : JSON.stringify(value)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

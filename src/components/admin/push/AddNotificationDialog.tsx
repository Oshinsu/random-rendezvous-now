import { useState } from 'react';
import { useNotificationTypesConfig } from '@/hooks/useNotificationTypesConfig';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface AddNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddNotificationDialog = ({ open, onOpenChange }: AddNotificationDialogProps) => {
  const { addNotificationType, isAdding } = useNotificationTypesConfig();
  
  const [formData, setFormData] = useState({
    type_key: '',
    display_name: '',
    category: 'groups' as 'groups' | 'lifecycle' | 'bars' | 'messages' | 'promotions',
    description: '',
    default_title: '',
    default_body: '',
    priority: 5,
    tags: [] as string[],
  });
  
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addNotificationType({
      type_key: formData.type_key.toUpperCase().replace(/\s+/g, '_'),
      display_name: formData.display_name,
      category: formData.category,
      description: formData.description,
      priority: formData.priority,
      tags: formData.tags,
      default_copy: {
        default: {
          title: formData.default_title,
          body: formData.default_body,
        }
      },
      send_rules: {
        max_per_day: null,
        quiet_hours_exempt: false,
        requires_user_consent: false,
      },
      is_active: true,
    });
    
    onOpenChange(false);
    setFormData({
      type_key: '',
      display_name: '',
      category: 'groups',
      description: '',
      default_title: '',
      default_body: '',
      priority: 5,
      tags: [],
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une notification</DialogTitle>
          <DialogDescription>
            Crée un nouveau type de notification pour ton app
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type_key">Type Key *</Label>
              <Input
                id="type_key"
                placeholder="GROUP_NEW_FEATURE"
                value={formData.type_key}
                onChange={(e) => setFormData({ ...formData, type_key: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Format: MAJUSCULES_UNDERSCORES
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Nom affiché *</Label>
              <Input
                id="display_name"
                placeholder="Nouvelle fonctionnalité"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groups">Groupes</SelectItem>
                  <SelectItem value="lifecycle">Lifecycle</SelectItem>
                  <SelectItem value="bars">Bars</SelectItem>
                  <SelectItem value="messages">Messages</SelectItem>
                  <SelectItem value="promotions">Promotions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité: {formData.priority}</Label>
              <Slider
                id="priority"
                min={1}
                max={10}
                step={1}
                value={[formData.priority]}
                onValueChange={([value]) => setFormData({ ...formData, priority: value })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                1 = Faible, 10 = Critique
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Notif envoyée quand..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_title">Titre par défaut *</Label>
            <Input
              id="default_title"
              placeholder="🎉 Nouvelle fonctionnalité !"
              value={formData.default_title}
              onChange={(e) => setFormData({ ...formData, default_title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_body">Message par défaut *</Label>
            <Textarea
              id="default_body"
              placeholder="Viens découvrir la nouvelle feature..."
              value={formData.default_body}
              onChange={(e) => setFormData({ ...formData, default_body: e.target.value })}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Utilise {`{{variable}}`} pour les placeholders dynamiques
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="important, beta, test..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Ajouter
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding ? 'Création...' : 'Créer la notification'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from 'react';
import { SiteContent } from '@/hooks/useSiteContent';
import { RichTextEditor } from './RichTextEditor';
import { ImageManager } from './ImageManager';
import { ContentPreview } from './ContentPreview';
import { AICopywriterPanel } from './AICopywriterPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { 
  Save, 
  RotateCcw, 
  Clock, 
  FileText, 
  Image as ImageIcon, 
  Code, 
  Type, 
  AlertCircle,
  CheckCircle2,
  History,
  Settings
} from 'lucide-react';

interface AdvancedContentEditorProps {
  content: SiteContent;
  onUpdate: (id: string, value: any) => Promise<boolean>;
  onClose?: () => void;
}

export const AdvancedContentEditor = ({ content, onUpdate, onClose }: AdvancedContentEditorProps) => {
  const [value, setValue] = useState(content.content_value);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (!hasChanges || !autoSave) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [value, hasChanges, autoSave]);

  // Detect changes
  useEffect(() => {
    const hasActualChanges = JSON.stringify(value) !== JSON.stringify(content.content_value);
    setHasChanges(hasActualChanges);
    
    // Clear validation error when content changes
    if (hasActualChanges) {
      setValidationError(null);
    }
  }, [value, content.content_value]);

  const handleSave = async () => {
    if (!hasChanges) return;

    // Validation
    if (content.content_type === 'json') {
      try {
        if (typeof value === 'string' && value.trim()) {
          JSON.parse(value);
        }
      } catch (error) {
        setValidationError('JSON invalide');
        return;
      }
    }

    if (content.content_type === 'text' && typeof value === 'string') {
      if (value.trim().length === 0) {
        setValidationError('Le texte ne peut pas être vide');
        return;
      }
      if (value.length > 10000) {
        setValidationError('Le texte est trop long (max 10 000 caractères)');
        return;
      }
    }

    setSaving(true);
    setValidationError(null);

    try {
      const success = await onUpdate(content.id, value);
      if (success) {
        setHasChanges(false);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setValue(content.content_value);
    setHasChanges(false);
    setValidationError(null);
  };

  const getIcon = () => {
    switch (content.content_type) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'html':
        return <Code className="h-4 w-4" />;
      case 'json':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSectionBadgeColor = (section: string) => {
    switch (section) {
      case 'hero':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'benefits':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'how_it_works':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'footer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'meta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderEditor = () => {
    const commonProps = {
      value,
      onChange: setValue,
      onSave: handleSave,
      isSaving: saving,
      label: content.content_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    };

    // Déterminer le contexte de section pour l'AI
    const sectionContext = ['hero', 'benefits', 'how_it_works', 'footer', 'meta'].includes(content.page_section) 
      ? content.page_section as 'hero' | 'benefits' | 'how_it_works' | 'footer' | 'meta'
      : 'hero';

    // Pour les contenus texte, afficher l'éditeur avec le panneau AI en split-screen
    if (content.content_type === 'text' || content.content_type === 'html') {
      return (
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
          {/* Zone Édition */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full p-4">
              <RichTextEditor
                {...commonProps}
                contentType={content.content_type}
                placeholder={content.content_type === 'html' ? '<p>Entrez votre code HTML ici...</p>' : 'Entrez votre texte ici...'}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Zone AI + Preview */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full p-4 overflow-y-auto">
              <AICopywriterPanel
                currentText={typeof value === 'string' ? value : ''}
                sectionContext={sectionContext}
                contentId={content.id}
                onApplySuggestion={(text) => setValue(text)}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }

    // Pour les autres types de contenu, affichage classique
    switch (content.content_type) {
      case 'image':
        return (
          <ImageManager
            {...commonProps}
          />
        );
      case 'json':
        return (
          <RichTextEditor
            {...commonProps}
            contentType="text"
            placeholder='{"key": "value"}'
          />
        );
      default:
        return (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Type de contenu non supporté: {content.content_type}
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {getIcon()}
                <CardTitle className="text-xl">
                  {content.content_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getSectionBadgeColor(content.page_section)}`}
                >
                  {content.page_section}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {content.content_type.toUpperCase()}
                </Badge>
              </div>
              {content.description && (
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {content.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <ContentPreview content={content} updatedValue={value} />
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                  id="auto-save"
                />
                <Label htmlFor="auto-save" className="text-sm">Auto-save</Label>
              </div>
            </div>
          </div>
          
          {/* Barre de statut */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Modifié: {new Date(content.updated_at).toLocaleString('fr-FR')}</span>
              </div>
              {lastSaved && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Sauvé: {lastSaved.toLocaleTimeString('fr-FR')}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <History className="h-3 w-3" />
                <span>ID: {content.id.slice(0, 8)}...</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {hasChanges && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !!validationError}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </>
              )}
              {!hasChanges && lastSaved && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Sauvegardé
                </Badge>
              )}
            </div>
          </div>
          
          {/* Erreur de validation */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{validationError}</span>
            </div>
          )}
        </CardHeader>
      </Card>

      <Separator />

      {/* Éditeur principal */}
      {renderEditor()}
    </div>
  );
};
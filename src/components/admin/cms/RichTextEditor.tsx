import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Code, Type, Bold, Italic, Link, List, ListOrdered, Image as ImageIcon, Save, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  label?: string;
  placeholder?: string;
  contentType?: 'text' | 'html';
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  onSave, 
  isSaving = false, 
  label, 
  placeholder,
  contentType = 'text'
}: RichTextEditorProps) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addToHistory = useCallback((newValue: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    addToHistory(newValue);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousValue = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onChange(previousValue);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextValue = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onChange(nextValue);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    handleChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatButtons = [
    { icon: Bold, label: 'Gras', onClick: () => insertText('**', '**'), shortcut: 'Ctrl+B' },
    { icon: Italic, label: 'Italique', onClick: () => insertText('*', '*'), shortcut: 'Ctrl+I' },
    { icon: Link, label: 'Lien', onClick: () => insertText('[', '](url)'), shortcut: 'Ctrl+K' },
    { icon: List, label: 'Liste', onClick: () => insertText('- '), shortcut: 'Ctrl+L' },
    { icon: ListOrdered, label: 'Liste ordonnée', onClick: () => insertText('1. '), shortcut: 'Ctrl+Shift+L' },
    { icon: ImageIcon, label: 'Image', onClick: () => insertText('![alt](', ')'), shortcut: 'Ctrl+M' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 's':
          e.preventDefault();
          onSave();
          break;
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {label && <Label className="text-base font-medium">{label}</Label>}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {contentType === 'html' ? 'HTML' : 'Texte'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {value.length} caractères
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Annuler (Ctrl+Z)"
            >
              <Undo className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Refaire (Ctrl+Y)"
            >
              <Redo className="h-3 w-3" />
            </Button>
            <Button
              onClick={onSave}
              disabled={isSaving}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-3 w-3" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'preview')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Éditeur
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Aperçu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-3 mt-3">
            {contentType === 'html' && (
              <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-md border">
                {formatButtons.map((button, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={button.onClick}
                    title={`${button.label} (${button.shortcut})`}
                    className="h-8 px-2"
                  >
                    <button.icon className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || (contentType === 'html' ? 'Entrez votre code HTML...' : 'Entrez votre texte...')}
              rows={12}
              className="font-mono text-sm resize-none"
            />
            
            <div className="text-xs text-muted-foreground">
              <div className="flex flex-wrap gap-4">
                <span>Ctrl+S: Sauvegarder</span>
                <span>Ctrl+Z: Annuler</span>
                <span>Ctrl+Y: Refaire</span>
                {contentType === 'html' && (
                  <>
                    <span>Ctrl+B: Gras</span>
                    <span>Ctrl+I: Italique</span>
                    <span>Ctrl+K: Lien</span>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-3">
            <div className="border rounded-md p-4 min-h-[200px] bg-background">
              {contentType === 'html' ? (
                <div dangerouslySetInnerHTML={{ __html: value }} />
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {value || <span className="text-muted-foreground italic">Aperçu vide</span>}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
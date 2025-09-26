import { useState } from 'react';
import { SiteContent } from '@/hooks/useSiteContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Image, FileText, Code, Type } from 'lucide-react';

interface ContentEditorProps {
  content: SiteContent;
  onUpdate: (id: string, value: any) => Promise<boolean>;
}

export const ContentEditor = ({ content, onUpdate }: ContentEditorProps) => {
  const [value, setValue] = useState(content.content_value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await onUpdate(content.id, value);
    if (success) {
      // Optionally show success feedback
    }
    setSaving(false);
  };

  const getIcon = () => {
    switch (content.content_type) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'html':
        return <Code className="h-4 w-4" />;
      case 'json':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderEditor = () => {
    switch (content.content_type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Entrez le texte..."
            className="w-full"
          />
        );
      case 'image':
        return (
          <Input
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder="/src/assets/image.jpg"
            className="w-full"
          />
        );
      case 'html':
      case 'json':
        return (
          <Textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              if (content.content_type === 'json') {
                try {
                  setValue(JSON.parse(e.target.value));
                } catch {
                  setValue(e.target.value);
                }
              } else {
                setValue(e.target.value);
              }
            }}
            placeholder={content.content_type === 'json' ? '{"key": "value"}' : '<p>HTML content</p>'}
            rows={6}
            className="w-full font-mono text-sm"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-base">{content.content_key}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {content.content_type}
            </Badge>
          </div>
          <Badge variant="secondary" className="text-xs">
            {content.page_section}
          </Badge>
        </div>
        {content.description && (
          <CardDescription className="text-sm">
            {content.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Label htmlFor={`content-${content.id}`} className="text-sm font-medium">
            Contenu
          </Label>
          {renderEditor()}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-3 w-3" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
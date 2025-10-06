import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmailTemplate {
  subject: string;
  html_content: string;
  variables: string[];
}

interface EmailTemplateEditorProps {
  template: EmailTemplate;
  onChange: (template: EmailTemplate) => void;
}

const AVAILABLE_VARIABLES = [
  '{{first_name}}',
  '{{last_name}}',
  '{{email}}',
  '{{total_outings}}',
  '{{health_score}}',
  '{{last_activity}}',
  '{{referral_code}}',
  '{{unsubscribe_link}}'
];

export const EmailTemplateEditor = ({ template, onChange }: EmailTemplateEditorProps) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const insertVariable = (variable: string) => {
    onChange({
      ...template,
      html_content: template.html_content + variable
    });
  };

  const getPreviewHtml = () => {
    return template.html_content
      .replace(/{{first_name}}/g, 'John')
      .replace(/{{last_name}}/g, 'Doe')
      .replace(/{{email}}/g, 'john.doe@example.com')
      .replace(/{{total_outings}}/g, '5')
      .replace(/{{health_score}}/g, '75')
      .replace(/{{last_activity}}/g, '2 jours')
      .replace(/{{referral_code}}/g, 'JOHN2025')
      .replace(/{{unsubscribe_link}}/g, '#unsubscribe');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Éditeur de Template Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Utilisez les variables dynamiques pour personnaliser vos emails
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>Sujet de l'email</Label>
          <Input
            value={template.subject}
            onChange={(e) => onChange({ ...template, subject: e.target.value })}
            placeholder="Ex: Bienvenue sur Random, {{first_name}} !"
          />
        </div>

        <div className="space-y-2">
          <Label>Variables disponibles</Label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <Button
                key={variable}
                variant="outline"
                size="sm"
                onClick={() => insertVariable(variable)}
              >
                {variable}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Éditeur</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-2">
            <Label>Contenu HTML</Label>
            <Textarea
              value={template.html_content}
              onChange={(e) => onChange({ ...template, html_content: e.target.value })}
              placeholder="Écrivez votre email en HTML..."
              className="min-h-[400px] font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-2">
            <div className="flex gap-2 mb-2">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                Desktop
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                Mobile
              </Button>
            </div>
            <div 
              className={`border rounded-lg overflow-auto ${
                previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'
              }`}
              style={{ minHeight: '400px' }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                className="p-4"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

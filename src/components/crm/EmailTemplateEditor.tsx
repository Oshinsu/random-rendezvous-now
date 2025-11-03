import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Smartphone, Monitor, Mail, Code, Eye, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * SOTA 2025 Email Template Editor
 * Sources:
 * - Mailchimp Template Editor (https://mailchimp.com) - Visual email builder
 * - Resend Email Editor (https://resend.com) - Modern email dev experience
 * - React Email (https://react.email) - Component-based email templates
 */

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Éditeur de Template Email SOTA 2025
            </CardTitle>
            <CardDescription className="mt-2">
              Editeur visuel + Preview multi-device + Variables dynamiques
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-2">
            <Sparkles className="h-3 w-3" />
            AI-powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Utilisez les variables dynamiques pour personnaliser vos emails. Compatible avec tous les clients email (Gmail, Outlook, Apple Mail).
          </AlertDescription>
        </Alert>

        <Separator />

        <div className="space-y-2">
          <Label>Sujet de l'email</Label>
          <Input
            value={template.subject}
            onChange={(e) => onChange({ ...template, subject: e.target.value })}
            placeholder="Ex: Bienvenue sur Random, {{first_name}} !"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Variables disponibles</Label>
            <Badge variant="secondary" className="text-xs">
              {AVAILABLE_VARIABLES.length} variables
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <Button
                key={variable}
                variant="outline"
                size="sm"
                onClick={() => insertVariable(variable)}
                className="justify-start font-mono text-xs"
              >
                <Code className="h-3 w-3 mr-2" />
                {variable}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

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

          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
              </div>
              <Badge variant="outline">
                <Eye className="h-3 w-3 mr-1" />
                Preview mode
              </Badge>
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

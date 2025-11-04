import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Eye, 
  Monitor, 
  Smartphone, 
  Tablet, 
  ExternalLink, 
  RefreshCw,
  Code,
  Palette
} from 'lucide-react';
import { SiteContent } from '@/contexts/SiteContentContext';

interface ContentPreviewProps {
  content: SiteContent;
  updatedValue: any;
}

export const ContentPreview = ({ content, updatedValue }: ContentPreviewProps) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<'live' | 'mock'>('live');

  const getDeviceClass = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-sm';
      case 'tablet': 
        return 'max-w-2xl';
      default:
        return 'max-w-full';
    }
  };

  const renderPreview = () => {
    const value = updatedValue || content.content_value;
    
    switch (content.content_type) {
      case 'text':
        return (
          <div className="space-y-4">
            {content.content_key.includes('title') || content.content_key.includes('heading') ? (
              <h1 className="text-4xl font-bold text-foreground">{value}</h1>
            ) : content.content_key.includes('subtitle') || content.content_key.includes('description') ? (
              <p className="text-xl text-muted-foreground">{value}</p>
            ) : content.content_key.includes('button') || content.content_key.includes('cta') ? (
              <Button className="bg-primary text-primary-foreground px-6 py-3">
                {value}
              </Button>
            ) : (
              <p className="text-base text-foreground">{value}</p>
            )}
          </div>
        );
        
      case 'image':
        return (
          <div className="space-y-4">
            <img 
              src={value} 
              alt="Aperçu" 
              className="max-w-full h-auto rounded-md shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyVjE5QTIgMiAwIDAgMSAxOSAyMUg1QTIgMiAwIDAgMSAzIDE5VjVBMiAyIDAgMCAxIDUgM0gxMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjkiIGN5PSI5IiByPSIyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHN2ZyBnZW5lcmF0ZWQgYnkgTHVjaWRlLnJ1bj4K';
              }}
            />
            <p className="text-sm text-muted-foreground">
              URL: {value}
            </p>
          </div>
        );
        
      case 'html':
        return (
          <div className="space-y-4">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: value }} 
            />
          </div>
        );
        
      case 'json':
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          return (
            <div className="space-y-4">
              <pre className="bg-muted p-4 rounded-md text-sm font-mono overflow-x-auto">
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </div>
          );
        } catch (error) {
          return (
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-destructive text-sm font-medium">JSON invalide</p>
                <pre className="mt-2 text-xs font-mono">{String(value)}</pre>
              </div>
            </div>
          );
        }
        
      default:
        return (
          <div className="text-muted-foreground italic">
            Aperçu non disponible pour ce type de contenu
          </div>
        );
    }
  };

  const getSectionDemo = () => {
    switch (content.page_section) {
      case 'hero':
        return (
          <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 rounded-lg text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              {renderPreview()}
            </div>
          </div>
        );
        
      case 'benefits':
        return (
          <div className="bg-background p-6 rounded-lg border">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                {renderPreview()}
              </div>
              <div className="bg-muted/30 rounded-md aspect-video flex items-center justify-center">
                <span className="text-muted-foreground">Zone d'image</span>
              </div>
            </div>
          </div>
        );
        
      case 'footer':
        return (
          <div className="bg-secondary border-t p-6 rounded-lg">
            <div className="text-center space-y-4">
              {renderPreview()}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="bg-background p-6 rounded-lg border">
            {renderPreview()}
          </div>
        );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Eye className="h-3 w-3" />
          Aperçu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu: {content.content_key}
              </DialogTitle>
              <DialogDescription>
                Section: {content.page_section} • Type: {content.content_type}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {content.page_section}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {content.content_type}
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Contrôles d'aperçu */}
          <div className="flex items-center justify-between">
            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'live' | 'mock')}>
              <TabsList>
                <TabsTrigger value="live" className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Temps réel
                </TabsTrigger>
                <TabsTrigger value="mock" className="flex items-center gap-1">
                  <Palette className="h-3 w-3" />
                  Contexte
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceMode('desktop')}
                className="h-8 px-2"
              >
                <Monitor className="h-3 w-3" />
              </Button>
              <Button
                variant={deviceMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceMode('tablet')}
                className="h-8 px-2"
              >
                <Tablet className="h-3 w-3" />
              </Button>
              <Button
                variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceMode('mobile')}
                className="h-8 px-2"
              >
                <Smartphone className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Zone d'aperçu */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-xs text-muted-foreground">
                  Aperçu {deviceMode} • {content.content_key}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="p-6 bg-background">
              <div className={`mx-auto transition-all duration-300 ${getDeviceClass()}`}>
                {previewMode === 'live' ? renderPreview() : getSectionDemo()}
              </div>
            </div>
          </div>

          {/* Informations sur le contenu */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="h-4 w-4" />
                Informations techniques
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Clé:</span> {content.content_key}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {content.content_type}
                </div>
                <div>
                  <span className="font-medium">Section:</span> {content.page_section}
                </div>
                <div>
                  <span className="font-medium">Modifié:</span> {new Date(content.updated_at).toLocaleString('fr-FR')}
                </div>
              </div>
              {content.description && (
                <div className="mt-2 pt-2 border-t">
                  <span className="font-medium">Description:</span> {content.description}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
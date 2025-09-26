import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  File, 
  Plus, 
  Copy, 
  Eye, 
  Settings, 
  FileText, 
  Image as ImageIcon, 
  Code, 
  Type,
  Sparkles
} from 'lucide-react';

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  content_type: 'text' | 'image' | 'html' | 'json';
  page_section: string;
  template_value: any;
  category: 'marketing' | 'technical' | 'content' | 'design';
}

const defaultTemplates: ContentTemplate[] = [
  {
    id: '1',
    name: 'Titre de Hero impactant',
    description: 'Titre principal accrocheur pour la section hero',
    content_type: 'text',
    page_section: 'hero',
    template_value: 'Transformez votre [ACTIVITÉ] avec [PRODUIT]',
    category: 'marketing'
  },
  {
    id: '2',
    name: 'CTA persuasif',
    description: 'Bouton d\'action avec urgence',
    content_type: 'text',
    page_section: 'hero',
    template_value: 'Commencer maintenant - Gratuit',
    category: 'marketing'
  },
  {
    id: '3',
    name: 'Description produit',
    description: 'Description engageante des bénéfices',
    content_type: 'text',
    page_section: 'benefits',
    template_value: 'Découvrez comment [PRODUIT] vous aide à [BÉNÉFICE] en seulement [TEMPS], sans [PROBLÈME].',
    category: 'content'
  },
  {
    id: '4',
    name: 'Métadonnées SEO',
    description: 'Title et description optimisés SEO',
    content_type: 'text',
    page_section: 'meta',
    template_value: '[PRODUIT] - [BÉNÉFICE PRINCIPAL] | [MARQUE]',
    category: 'technical'
  },
  {
    id: '5',
    name: 'Image Hero responsive',
    description: 'Image hero optimisée avec fallback',
    content_type: 'image',
    page_section: 'hero',
    template_value: '/src/assets/hero-modern.jpg',
    category: 'design'
  },
  {
    id: '6',
    name: 'Bloc de fonctionnalité',
    description: 'HTML structure pour présenter une fonctionnalité',
    content_type: 'html',
    page_section: 'benefits',
    template_value: '<div class="feature-block"><h3>[TITRE FONCTIONNALITÉ]</h3><p>[DESCRIPTION]</p><ul><li>[POINT 1]</li><li>[POINT 2]</li><li>[POINT 3]</li></ul></div>',
    category: 'content'
  }
];

interface ContentTemplatesProps {
  onSelectTemplate: (template: ContentTemplate) => void;
}

export const ContentTemplates = ({ onSelectTemplate }: ContentTemplatesProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);

  const categories = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'content', label: 'Contenu' },
    { value: 'technical', label: 'Technique' },
    { value: 'design', label: 'Design' }
  ];

  const filteredTemplates = defaultTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTemplateIcon = (type: string) => {
    switch (type) {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'marketing':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'content':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'technical':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'design':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleUseTemplate = (template: ContentTemplate) => {
    onSelectTemplate(template);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <File className="h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Templates de Contenu
          </DialogTitle>
          <DialogDescription>
            Utilisez des templates prêts à l'emploi pour créer du contenu professionnel rapidement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Rechercher un template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateTemplate(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Créer
            </Button>
          </div>

          {/* Templates grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTemplateIcon(template.content_type)}
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        {template.content_type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(template.category)}`}
                      >
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="bg-muted/30 p-3 rounded-md text-sm font-mono">
                      {template.content_type === 'image' ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                          {template.template_value}
                        </div>
                      ) : (
                        <div className="line-clamp-3">
                          {String(template.template_value)}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-xs">
                        {template.page_section}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                          className="h-8 px-3 text-xs"
                        >
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Aucun template trouvé
              </h3>
              <p className="text-muted-foreground">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
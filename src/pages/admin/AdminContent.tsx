import { useState } from 'react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { ContentEditor } from '@/components/admin/ContentEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Search, FileText, Palette, Layout, Globe } from 'lucide-react';

export default function AdminContent() {
  const { contents, loading, updateContent } = useSiteContent();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const sections = Array.from(new Set(contents.map(c => c.page_section)));
  
  const filteredContents = contents.filter(content => {
    const matchesSearch = content.content_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === 'all' || content.page_section === selectedSection;
    
    return matchesSearch && matchesSection;
  });

  const groupedContents = filteredContents.reduce((acc, content) => {
    if (!acc[content.page_section]) {
      acc[content.page_section] = [];
    }
    acc[content.page_section].push(content);
    return acc;
  }, {} as Record<string, typeof contents>);

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'hero':
        return <Layout className="h-4 w-4" />;
      case 'benefits':
        return <Palette className="h-4 w-4" />;
      case 'how_it_works':
        return <FileText className="h-4 w-4" />;
      case 'footer':
        return <Globe className="h-4 w-4" />;
      case 'meta':
        return <Globe className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'hero':
        return 'Section Hero';
      case 'benefits':
        return 'Section Avantages';
      case 'how_it_works':
        return 'Comment ça marche';
      case 'footer':
        return 'Footer';
      case 'meta':
        return 'Méta-données';
      default:
        return section;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-800">Gestion de Contenu</h1>
          <p className="text-red-600">
            Modifiez les textes, images et contenus de votre site en temps réel
          </p>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un contenu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Toutes les sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section} value={section}>
                      {getSectionTitle(section)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{contents.length}</Badge>
                <span className="text-sm font-medium">Contenus totaux</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{sections.length}</Badge>
                <span className="text-sm font-medium">Sections</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{filteredContents.length}</Badge>
                <span className="text-sm font-medium">Résultats affichés</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contenus groupés par section */}
      <div className="space-y-8">
        {Object.entries(groupedContents).map(([section, sectionContents]) => (
          <div key={section} className="space-y-4">
            <div className="flex items-center gap-2">
              {getSectionIcon(section)}
              <h2 className="text-xl font-semibold text-red-700">
                {getSectionTitle(section)}
              </h2>
              <Badge variant="secondary">
                {sectionContents.length} élément{sectionContents.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {sectionContents.map(content => (
                <ContentEditor
                  key={content.id}
                  content={content}
                  onUpdate={updateContent}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredContents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Aucun contenu trouvé
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos critères de recherche
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
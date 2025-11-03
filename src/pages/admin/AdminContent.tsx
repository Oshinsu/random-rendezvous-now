import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteContent } from '@/hooks/useSiteContent';
import { AdvancedContentEditor } from '@/components/admin/cms/AdvancedContentEditor';
import { CMSNavigation } from '@/components/admin/cms/CMSNavigation';
import { CMSHeader } from '@/components/admin/cms/CMSHeader';
import { CMSStats } from '@/components/admin/cms/CMSStats';
import { ImageGallery } from '@/components/admin/cms/ImageGallery';
import { BlockEditor } from '@/components/admin/cms/BlockEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  Search, 
  FileText, 
  Layout, 
  Globe, 
  Filter, 
  Grid, 
  List,
  Eye,
  Image as ImageIcon,
  Type,
  Code,
  Zap,
  Target,
} from 'lucide-react';
import { SiteContent } from '@/hooks/useSiteContent';

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'section' | 'type' | 'updated';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'text' | 'image' | 'html' | 'json';

export default function AdminContent() {
  const location = useLocation();
  const { contents, loading, updateContent, refresh } = useSiteContent();
  const [selectedContent, setSelectedContent] = useState<SiteContent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('section');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Déterminer le type de vue selon la route
  const currentView = location.pathname.includes('/images') 
    ? 'images' 
    : location.pathname.includes('/texts')
    ? 'texts'
    : location.pathname.includes('/templates')
    ? 'templates'
    : location.pathname.includes('/builder')
    ? 'builder'
    : 'all';

  const sections = Array.from(new Set(contents.map(c => c.page_section)));
  const contentTypes = ['text', 'image', 'html', 'json'] as const;

  // Statistiques optimisées
  const stats = useMemo(() => {
    return {
      total: contents.length,
      sections: sections.length,
      byType: contentTypes.map(type => ({
        type,
        count: contents.filter(c => c.content_type === type).length
      })),
      recentlyUpdated: contents.filter(c => {
        const updated = new Date(c.updated_at);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - updated.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }).length
    };
  }, [contents, sections]);

  // Images uniquement
  const imageContents = useMemo(() => {
    return contents.filter(content => content.content_type === 'image');
  }, [contents]);

  // Contenus filtrés et triés
  const filteredAndSortedContents = useMemo(() => {
    let filtered = contents.filter(content => {
      const matchesSearch = content.content_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          content.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          content.page_section.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSection = selectedSection === 'all' || content.page_section === selectedSection;
      const matchesType = selectedType === 'all' || content.content_type === selectedType;
      
      return matchesSearch && matchesSection && matchesType;
    });

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.content_key.localeCompare(b.content_key);
          break;
        case 'section':
          comparison = a.page_section.localeCompare(b.page_section);
          break;
        case 'type':
          comparison = a.content_type.localeCompare(b.content_type);
          break;
        case 'updated':
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [contents, searchTerm, selectedSection, selectedType, sortBy, sortOrder]);

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'hero':
        return <Layout className="h-4 w-4" />;
      case 'benefits':
        return <Target className="h-4 w-4" />;
      case 'how_it_works':
        return <Zap className="h-4 w-4" />;
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
        return section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getContentTypeIcon = (type: string) => {
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

  const handleContentClick = (content: SiteContent) => {
    setSelectedContent(content);
  };

  const handleUpdateContent = async (id: string, value: any) => {
    const success = await updateContent(id, value);
    if (success) {
      await refresh();
    }
    return success;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* En-tête */}
      <CMSHeader onRefresh={refresh} />

      {/* Statistiques */}
      <CMSStats
        total={stats.total}
        sections={stats.sections}
        recentlyUpdated={stats.recentlyUpdated}
        byType={stats.byType}
      />

      <Separator />

      {/* Navigation CMS */}
      <CMSNavigation />

      {/* Contenu selon la route */}
      {currentView === 'builder' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-red-600" />
                Visual Page Builder SOTA 2025
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BlockEditor />
            </CardContent>
          </Card>
        </div>
      ) : currentView === 'images' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Gestion des Images ({imageContents.length})
            </h2>
          </div>
          <ImageGallery
            images={imageContents}
            onUpdate={handleUpdateContent}
            onRefresh={refresh}
          />
        </div>
      ) : currentView === 'texts' ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Filtres pour textes uniquement */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                  Filtres et Recherche
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Toutes les sections" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="all">Toutes les sections</SelectItem>
                    {sections.map(section => (
                      <SelectItem key={section} value={section}>
                        <div className="flex items-center gap-2">
                          {getSectionIcon(section)}
                          {getSectionTitle(section)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
                  const [newSortBy, newSortOrder] = v.split('-') as [SortBy, SortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="name-asc">Nom A-Z</SelectItem>
                    <SelectItem value="name-desc">Nom Z-A</SelectItem>
                    <SelectItem value="section-asc">Section A-Z</SelectItem>
                    <SelectItem value="updated-desc">Plus récent</SelectItem>
                    <SelectItem value="updated-asc">Plus ancien</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des textes */}
          <div className="grid gap-4 sm:gap-6">
            {filteredAndSortedContents.filter(c => c.content_type === 'text').map(content => (
              <Card key={content.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleContentClick(content)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{content.content_key}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {content.page_section}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {typeof content.content_value === 'string' ? content.content_value : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : currentView === 'templates' ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <Layout className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Templates à venir</h3>
              <p className="text-muted-foreground">
                La gestion des templates sera disponible prochainement
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Vue par défaut: Tout le contenu */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                  Filtres et Recherche
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Toutes les sections" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="all">Toutes les sections</SelectItem>
                    {sections.map(section => (
                      <SelectItem key={section} value={section}>
                        <div className="flex items-center gap-2">
                          {getSectionIcon(section)}
                          {getSectionTitle(section)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as FilterType)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="all">Tous les types</SelectItem>
                    {contentTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {getContentTypeIcon(type)}
                          {type.toUpperCase()}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
                  const [newSortBy, newSortOrder] = v.split('-') as [SortBy, SortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="name-asc">Nom A-Z</SelectItem>
                    <SelectItem value="name-desc">Nom Z-A</SelectItem>
                    <SelectItem value="section-asc">Section A-Z</SelectItem>
                    <SelectItem value="updated-desc">Plus récent</SelectItem>
                    <SelectItem value="updated-asc">Plus ancien</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 pt-4 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <span>{filteredAndSortedContents.length} résultat{filteredAndSortedContents.length > 1 ? 's' : ''}</span>
                  {(searchTerm || selectedSection !== 'all' || selectedType !== 'all') && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedSection('all');
                        setSelectedType('all');
                      }}
                    >
                      Effacer les filtres
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {filteredAndSortedContents.length} / {contents.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contenus groupés par section */}
          {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:gap-6">
              {Object.entries(
                filteredAndSortedContents.reduce((acc, content) => {
                  if (!acc[content.page_section]) {
                    acc[content.page_section] = [];
                  }
                  acc[content.page_section].push(content);
                  return acc;
                }, {} as Record<string, SiteContent[]>)
              ).map(([section, sectionContents]) => (
                <div key={section} className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {getSectionIcon(section)}
                    <h2 className="text-lg sm:text-xl font-semibold">
                      {getSectionTitle(section)}
                    </h2>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSectionBadgeColor(section)}`}
                    >
                      {sectionContents.length} élément{sectionContents.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sectionContents.map(content => (
                      <Card 
                        key={content.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleContentClick(content)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getContentTypeIcon(content.content_type)}
                              <Badge variant="outline" className="text-xs">
                                {content.content_type}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm font-medium mb-1 truncate">{content.content_key}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {content.description || 'Aucune description'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedContents.map(content => (
                <Card
                  key={content.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleContentClick(content)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getContentTypeIcon(content.content_type)}
                        <div>
                          <p className="font-medium">{content.content_key}</p>
                          <p className="text-sm text-muted-foreground">
                            {content.description || 'Aucune description'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{content.page_section}</Badge>
                        <Badge variant="secondary">{content.content_type}</Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sheet pour l'éditeur avancé */}
      <Sheet open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <SheetContent 
          side="right" 
          className="w-full sm:w-[90vw] sm:max-w-none lg:w-[85vw] xl:w-[80vw] max-w-none overflow-hidden flex flex-col"
        >
          <SheetHeader className="pb-4 shrink-0">
            <SheetTitle className="text-lg sm:text-xl">
              Éditeur avancé
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Modifiez le contenu de votre site web avec l'éditeur avancé
            </SheetDescription>
          </SheetHeader>
          {selectedContent && (
            <div className="flex-1 overflow-auto">
              <AdvancedContentEditor
                content={selectedContent}
                onUpdate={handleUpdateContent}
                onClose={() => setSelectedContent(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
import { useState, useMemo } from 'react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { AdvancedContentEditor } from '@/components/admin/cms/AdvancedContentEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  FileText, 
  Layout, 
  Globe, 
  Filter, 
  Grid, 
  List,
  Plus,
  RefreshCw,
  Eye,
  Edit3,
  Image as ImageIcon,
  Type,
  Code,
  Zap,
  Target,
  BarChart3,
  Clock
} from 'lucide-react';
import { SiteContent } from '@/hooks/useSiteContent';

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'section' | 'type' | 'updated';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'text' | 'image' | 'html' | 'json';

export default function AdminContent() {
  const { contents, loading, updateContent, refresh } = useSiteContent();
  const [selectedContent, setSelectedContent] = useState<SiteContent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('section');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
      {/* En-tête optimisé pour mobile */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-red-800 flex items-center gap-3">
              <Edit3 className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="hidden sm:inline">Gestion de Contenu Avancée</span>
              <span className="sm:hidden">CMS Avancé</span>
            </h1>
            <p className="text-red-600 mt-1 text-sm sm:text-base">
              Éditeur CMS professionnel avec prévisualisation temps réel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refresh()}
              className="flex items-center gap-2"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            <Button className="flex items-center gap-2" size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau contenu</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>
        </div>

        {/* Statistiques responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Sections</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.sections}</p>
                </div>
                <Layout className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Modifiés (7j)</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.recentlyUpdated}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Types</p>
                  <div className="flex gap-1 flex-wrap">
                    {stats.byType.map(({ type, count }) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {count}
                      </Badge>
                    ))}
                  </div>
                </div>
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Filtres optimisés pour mobile */}
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

      {/* Contenus avec UI optimisée */}
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
                <h2 className="text-lg sm:text-xl font-semibold text-red-700">
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
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50 group"
                    onClick={() => handleContentClick(content)}
                  >
                    <CardHeader className="pb-2 px-3 pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getContentTypeIcon(content.content_type)}
                          <CardTitle className="text-sm truncate font-medium">
                            {content.content_key.replace(/_/g, ' ')}
                          </CardTitle>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {content.content_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-3 pb-3">
                      {content.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-tight">
                          {content.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">{new Date(content.updated_at).toLocaleDateString('fr-FR')}</span>
                        <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Liste des contenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredAndSortedContents.map(content => (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                  onClick={() => handleContentClick(content)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getContentTypeIcon(content.content_type)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {content.content_key.replace(/_/g, ' ')}
                      </div>
                      {content.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {content.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Badge variant="outline" className={`text-xs hidden sm:inline-flex ${getSectionBadgeColor(content.page_section)}`}>
                      {content.page_section}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {content.content_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {new Date(content.updated_at).toLocaleDateString('fr-FR')}
                    </span>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si aucun contenu */}
      {filteredAndSortedContents.length === 0 && (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <Search className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Aucun contenu trouvé
            </h3>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              Essayez de modifier vos critères de recherche ou de filtrage
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedSection('all');
                setSelectedType('all');
              }}
            >
              Effacer tous les filtres
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog pour l'éditeur avancé - optimisé mobile */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2 shrink-0">
            <DialogTitle className="text-lg sm:text-xl">
              Éditeur avancé
            </DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <div className="flex-1 overflow-auto">
              <AdvancedContentEditor
                content={selectedContent}
                onUpdate={handleUpdateContent}
                onClose={() => setSelectedContent(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
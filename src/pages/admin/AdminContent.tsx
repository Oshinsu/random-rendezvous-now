import { useState, useMemo, useEffect } from 'react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { AdvancedContentEditor } from '@/components/admin/cms/AdvancedContentEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  FileText, 
  Palette, 
  Layout, 
  Globe, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid, 
  List,
  Plus,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Edit3,
  Image as ImageIcon,
  Type,
  Code,
  Zap,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const sections = Array.from(new Set(contents.map(c => c.page_section)));
  const contentTypes = ['text', 'image', 'html', 'json'] as const;

  // Statistiques
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
      // Refresh the content to get updated data
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
    <div className="p-4 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-red-800 flex items-center gap-3">
              <Edit3 className="h-8 w-8" />
              Gestion de Contenu Avancée
            </h1>
            <p className="text-red-600 mt-1">
              Éditeur CMS professionnel avec prévisualisation temps réel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refresh()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau contenu
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sections</p>
                  <p className="text-2xl font-bold">{stats.sections}</p>
                </div>
                <Layout className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Modifiés (7j)</p>
                  <p className="text-2xl font-bold">{stats.recentlyUpdated}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Types</p>
                  <div className="flex gap-1">
                    {stats.byType.map(({ type, count }) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {count}
                      </Badge>
                    ))}
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Filtres et recherche */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="relative md:col-span-2 xl:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un contenu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">Toutes les sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section} value={section}>
                      <div className="flex items-center gap-2">
                        {getSectionIcon(section)}
                        <span className="truncate">{getSectionTitle(section)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as FilterType)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">Tous les types</SelectItem>
                  {contentTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {getContentTypeIcon(type)}
                        <span>{type.toUpperCase()}</span>
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
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Tri" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="name-asc">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4" />
                      <span>Nom A-Z</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="name-desc">
                    <div className="flex items-center gap-2">
                      <SortDesc className="h-4 w-4" />
                      <span>Nom Z-A</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="section-asc">Section A-Z</SelectItem>
                  <SelectItem value="updated-desc">Plus récent</SelectItem>
                  <SelectItem value="updated-asc">Plus ancien</SelectItem>
                </SelectContent>
              </Select>
            </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

      {/* Contenus */}
      <div className="space-y-8">
        {viewMode === 'grid' ? (
          <div className="space-y-8">
            {Object.entries(
              filteredAndSortedContents.reduce((acc, content) => {
                if (!acc[content.page_section]) {
                  acc[content.page_section] = [];
                }
                acc[content.page_section].push(content);
                return acc;
              }, {} as Record<string, SiteContent[]>)
            ).map(([section, sectionContents]) => (
              <div key={section} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSectionIcon(section)}
                    <h2 className="text-xl font-semibold text-red-700">
                      {getSectionTitle(section)}
                    </h2>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSectionBadgeColor(section)}`}
                    >
                      {sectionContents.length} élément{sectionContents.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sectionContents.map(content => (
                    <Card 
                      key={content.id} 
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-red-300/50 border-2 hover:scale-[1.02]"
                      onClick={() => handleContentClick(content)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-red-50 transition-colors">
                              {getContentTypeIcon(content.content_type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-sm font-medium truncate group-hover:text-red-700 transition-colors">
                                {content.content_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </CardTitle>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0 px-1.5 py-0.5">
                            {content.content_type.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {content.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {content.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">
                            {new Date(content.updated_at).toLocaleDateString('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit'
                            })}
                          </span>
                          <Eye className="h-3 w-3 text-muted-foreground group-hover:text-red-500 transition-colors" />
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
              <CardTitle className="text-lg flex items-center gap-2">
                <List className="h-5 w-5" />
                Liste des contenus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredAndSortedContents.map(content => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer transition-all duration-200 group"
                    onClick={() => handleContentClick(content)}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-red-50 transition-colors shrink-0">
                        {getContentTypeIcon(content.content_type)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-medium text-sm group-hover:text-red-700 transition-colors truncate">
                          {content.content_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        {content.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {content.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge 
                        variant="outline" 
                        className={`text-xs hidden sm:inline-flex ${getSectionBadgeColor(content.page_section)}`}
                      >
                        {content.page_section}
                      </Badge>
                      <Badge variant="secondary" className="text-xs hidden md:inline-flex">
                        {content.content_type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden lg:inline">
                        {new Date(content.updated_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })}
                      </span>
                      <Eye className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {filteredAndSortedContents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Aucun contenu trouvé
            </h3>
            <p className="text-muted-foreground mb-4">
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

      {/* Dialog pour l'éditeur avancé */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col p-0">
          <div className="sticky top-0 bg-background border-b px-6 py-4 z-10">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-red-600" />
                Éditeur Avancé
                {selectedContent && (
                  <Badge variant="outline" className="text-xs">
                    {selectedContent.content_key.replace(/_/g, ' ')}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {selectedContent && (
              <AdvancedContentEditor
                content={selectedContent}
                onUpdate={handleUpdateContent}
                onClose={() => setSelectedContent(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
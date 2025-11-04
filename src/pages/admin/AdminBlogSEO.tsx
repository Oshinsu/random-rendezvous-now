import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBlogKeywords } from '@/hooks/useBlogKeywords';
import { useBlogArticles } from '@/hooks/useBlogArticles';
import { useBlogGeneration } from '@/hooks/useBlogGeneration';
import { useBlogGenerationLogs, useBlogGenerationStats } from '@/hooks/useBlogGenerationLogs';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Send, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Pause, 
  Archive,
  FileText,
  BarChart3,
  Activity,
  Clock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminBlogSEO() {
  const [newKeyword, setNewKeyword] = useState('');
  const [newPriority, setNewPriority] = useState(5);
  const [newNotes, setNewNotes] = useState('');
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [articleStatusFilter, setArticleStatusFilter] = useState<'draft' | 'published' | 'archived' | undefined>(undefined);

  const { keywords, isLoading: keywordsLoading, addKeyword, updateKeyword, deleteKeyword } = useBlogKeywords();
  const { articles, isLoading: articlesLoading, publishArticle, unpublishArticle, deleteArticle, updateArticle } = useBlogArticles(articleStatusFilter);
  const { schedule, generateNow, updateSchedule } = useBlogGeneration();
  const { data: logs } = useBlogGenerationLogs();
  const { data: stats } = useBlogGenerationStats();

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    
    await addKeyword.mutateAsync({
      keyword: newKeyword.trim(),
      priority: newPriority,
      notes: newNotes.trim() || undefined,
    });
    
    setNewKeyword('');
    setNewPriority(5);
    setNewNotes('');
    setIsAddingKeyword(false);
  };

  const handleToggleSchedule = async (active: boolean) => {
    await updateSchedule.mutateAsync({ is_active: active });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, icon: any, label: string }> = {
      active: { variant: 'default', icon: CheckCircle2, label: 'Actif' },
      paused: { variant: 'secondary', icon: Pause, label: 'En pause' },
      archived: { variant: 'outline', icon: Archive, label: 'Archivé' },
      draft: { variant: 'secondary', icon: FileText, label: 'Brouillon' },
      published: { variant: 'default', icon: CheckCircle2, label: 'Publié' },
    };
    
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-red-800 flex items-center gap-3">
              <Sparkles className="h-8 w-8" />
              Blog SEO Automatique
            </h1>
            <p className="text-muted-foreground mt-2">
              Génération intelligente d'articles optimisés avec IA
            </p>
          </div>
          <Button
            onClick={() => generateNow.mutate()}
            disabled={generateNow.isPending}
            size="lg"
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
          >
            {generateNow.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Générer Maintenant
              </>
            )}
          </Button>
        </div>

        {/* Indicateur génération automatique - SOTA 2025 */}
        {schedule && schedule.is_active && (
          <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <Clock className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900 font-semibold">Génération automatique active</AlertTitle>
            <AlertDescription className="text-green-800">
              <div className="flex flex-col gap-1 mt-1">
                <span className="font-medium">
                  Prochain article : {schedule.next_generation_at ? format(new Date(schedule.next_generation_at), 'PPpp', { locale: fr }) : 'Non planifié'}
                </span>
                <span className="text-sm text-green-700">
                  {schedule.total_generated} articles générés • Fréquence : tous les {schedule.frequency_days} jour(s)
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Mots-clés actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {keywords?.filter(k => k.status === 'active').length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                prêts pour la génération
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Articles générés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {schedule?.total_generated || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                au total par l'IA
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Articles publiés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {articles?.filter(a => a.status === 'published').length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                visibles sur le blog
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Prochaine génération
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-purple-600">
                {schedule?.next_generation_at
                  ? formatDistanceToNow(new Date(schedule.next_generation_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })
                  : 'Non planifiée'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {schedule?.is_active ? 'Auto activée' : 'Auto désactivée'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="keywords" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            <TabsTrigger value="keywords" className="data-[state=active]:bg-red-100">
              <FileText className="h-4 w-4 mr-2" />
              Mots-clés
            </TabsTrigger>
            <TabsTrigger value="articles" className="data-[state=active]:bg-red-100">
              <BarChart3 className="h-4 w-4 mr-2" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-red-100">
              <Calendar className="h-4 w-4 mr-2" />
              Planification
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-red-100">
              <Clock className="h-4 w-4 mr-2" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-red-100">
              <Activity className="h-4 w-4 mr-2" />
              Santé SEO
            </TabsTrigger>
          </TabsList>

          {/* Onglet Mots-clés */}
          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Gestion des mots-clés</CardTitle>
                    <CardDescription className="mt-1">
                      Ajoutez des mots-clés pour générer automatiquement des articles SEO optimisés
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setIsAddingKeyword(!isAddingKeyword)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isAddingKeyword ? 'Annuler' : 'Ajouter un mot-clé'}
                  </Button>
                </div>
              </CardHeader>

              {/* Inline Add Form */}
              {isAddingKeyword && (
                <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-red-600" />
                      Nouveau mot-clé SEO
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyword" className="text-sm font-medium">
                          Mot-clé <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="keyword"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Ex: rencontrer de nouvelles personnes à Paris"
                          className="h-11"
                          autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                          Utilisez des mots-clés longue traîne pour un meilleur SEO
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority" className="text-sm font-medium">
                          Priorité <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={newPriority.toString()}
                          onValueChange={(value) => setNewPriority(parseInt(value))}
                        >
                          <SelectTrigger id="priority" className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num >= 8 ? '(Haute priorité)' : num >= 5 ? '(Moyenne)' : '(Basse)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          10 = priorité maximale, sera utilisé en premier
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">
                          Notes internes (optionnel)
                        </Label>
                        <Textarea
                          id="notes"
                          value={newNotes}
                          onChange={(e) => setNewNotes(e.target.value)}
                          placeholder="Notes sur ce mot-clé, contexte, idées d'angles..."
                          className="min-h-[100px] resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddingKeyword(false);
                            setNewKeyword('');
                            setNewPriority(5);
                            setNewNotes('');
                          }}
                        >
                          Annuler
                        </Button>
                        <Button 
                          onClick={handleAddKeyword}
                          disabled={!newKeyword.trim() || addKeyword.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {addKeyword.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Ajout...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter le mot-clé
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <CardContent className="p-0">
                {keywordsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                  </div>
                ) : keywords && keywords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Mot-clé</TableHead>
                          <TableHead className="font-semibold">Priorité</TableHead>
                          <TableHead className="font-semibold">Statut</TableHead>
                          <TableHead className="font-semibold">Utilisations</TableHead>
                          <TableHead className="font-semibold">Dernière utilisation</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keywords.map((keyword) => (
                          <TableRow key={keyword.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium max-w-xs">
                              <div className="flex flex-col gap-1">
                                <span>{keyword.keyword}</span>
                                {keyword.notes && (
                                  <span className="text-xs text-muted-foreground line-clamp-1">
                                    {keyword.notes}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={keyword.priority >= 8 ? 'destructive' : keyword.priority >= 5 ? 'default' : 'secondary'}
                                className="font-mono"
                              >
                                {keyword.priority}/10
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(keyword.status)}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">{keyword.times_used}×</span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {keyword.last_used_at
                                ? formatDistanceToNow(new Date(keyword.last_used_at), { 
                                    addSuffix: true, 
                                    locale: fr 
                                  })
                                : 'Jamais utilisé'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateKeyword.mutate({
                                    id: keyword.id,
                                    updates: { 
                                      status: keyword.status === 'active' ? 'paused' : 'active' 
                                    }
                                  })}
                                  title={keyword.status === 'active' ? 'Mettre en pause' : 'Activer'}
                                >
                                  {keyword.status === 'active' ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteKeyword.mutate(keyword.id)}
                                  title="Supprimer"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun mot-clé configuré</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Ajoutez votre premier mot-clé pour commencer à générer des articles SEO automatiquement
                    </p>
                    <Button onClick={() => setIsAddingKeyword(true)} className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter votre premier mot-clé
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Articles */}
          <TabsContent value="articles" className="space-y-4">
            <Card>
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="text-xl">Articles générés par l'IA</CardTitle>
                <CardDescription className="mt-1">
                  Gérez, prévisualisez et publiez vos articles générés automatiquement
                </CardDescription>
              </CardHeader>
              
              {/* Filtres UI - SOTA 2025 */}
              <div className="flex gap-2 p-4 border-b bg-muted/30">
                <Button
                  size="sm"
                  variant={articleStatusFilter === undefined ? 'default' : 'outline'}
                  onClick={() => setArticleStatusFilter(undefined)}
                  className="gap-1"
                >
                  Tous
                  {articles && <Badge variant="secondary" className="ml-1">{articles.length}</Badge>}
                </Button>
                <Button
                  size="sm"
                  variant={articleStatusFilter === 'draft' ? 'default' : 'outline'}
                  onClick={() => setArticleStatusFilter('draft')}
                  className="gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Brouillons
                  {articles && <Badge variant="secondary" className="ml-1">{articles.filter(a => a.status === 'draft').length}</Badge>}
                </Button>
                <Button
                  size="sm"
                  variant={articleStatusFilter === 'published' ? 'default' : 'outline'}
                  onClick={() => setArticleStatusFilter('published')}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Publiés
                  {articles && <Badge variant="secondary" className="ml-1">{articles.filter(a => a.status === 'published').length}</Badge>}
                </Button>
                <Button
                  size="sm"
                  variant={articleStatusFilter === 'archived' ? 'default' : 'outline'}
                  onClick={() => setArticleStatusFilter('archived')}
                  className="gap-1"
                >
                  <Archive className="h-3 w-3" />
                  Archivés
                  {articles && <Badge variant="secondary" className="ml-1">{articles.filter(a => a.status === 'archived').length}</Badge>}
                </Button>
              </div>

              <CardContent className="p-0">
                {articlesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                  </div>
                ) : articles && articles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Titre</TableHead>
                          <TableHead className="font-semibold">Score SEO</TableHead>
                          <TableHead className="font-semibold">Statut</TableHead>
                          <TableHead className="font-semibold">Vues</TableHead>
                          <TableHead className="font-semibold">Date de création</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articles.map((article) => (
                          <TableRow key={article.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium max-w-md">
                              <div className="flex flex-col gap-1">
                                <span className="line-clamp-1">{article.title}</span>
                                {article.excerpt && (
                                  <span className="text-xs text-muted-foreground line-clamp-1">
                                    {article.excerpt}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  (article.seo_score || 0) >= 80 ? 'default' : 
                                  (article.seo_score || 0) >= 60 ? 'secondary' : 
                                  'destructive'
                                }
                                className="gap-1"
                              >
                                <TrendingUp className="h-3 w-3" />
                                {article.seo_score || 0}/100
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {getStatusBadge(article.status)}
                                {article.generated_by_ai && (
                                  <Badge variant="outline" className="gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    IA
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Eye className="h-3 w-3" />
                                <span className="font-mono text-sm">{article.views_count}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(article.created_at), 'dd/MM/yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(`/blog/${article.slug}`, '_blank')}
                                  title="Prévisualiser"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {article.status === 'draft' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => publishArticle.mutate(article.id)}
                                    title="Publier"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                )}
                                {article.status === 'published' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => unpublishArticle.mutate(article.id)}
                                    title="Dépublier"
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteArticle.mutate(article.id)}
                                  title="Supprimer"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun article généré</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Générez votre premier article en ajoutant des mots-clés et en cliquant sur "Générer Maintenant"
                    </p>
                    <Button onClick={() => generateNow.mutate()} className="bg-red-600 hover:bg-red-700">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Générer le premier article
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Planification */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="text-xl">Génération Automatique (Deno Cron)</CardTitle>
                <CardDescription className="mt-1">
                  Système automatisé via Supabase Scheduled Functions. Exécution quotidienne à 9h00 (Paris).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Activation automatique */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold cursor-pointer">
                        Génération automatique
                      </Label>
                      {schedule?.is_active && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Actif
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Activer la génération automatique d'articles selon la fréquence définie
                    </p>
                  </div>
                  <Switch
                    checked={schedule?.is_active || false}
                    onCheckedChange={handleToggleSchedule}
                    className="ml-4"
                  />
                </div>

                {/* Fréquence */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Fréquence de génération</Label>
                  <Select
                    value={schedule?.frequency_days?.toString() || '2'}
                    onValueChange={(value) => updateSchedule.mutate({ 
                      frequency_days: parseInt(value) 
                    })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tous les jours</SelectItem>
                      <SelectItem value="2">Tous les 2 jours (recommandé)</SelectItem>
                      <SelectItem value="3">Tous les 3 jours</SelectItem>
                      <SelectItem value="5">Toutes les semaines (5 jours)</SelectItem>
                      <SelectItem value="7">Toutes les semaines (7 jours)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Un nouvel article sera généré automatiquement tous les {schedule?.frequency_days || 2} jour(s)
                  </p>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <Label className="text-sm text-blue-800 font-semibold">Dernière génération</Label>
                    <p className="text-lg font-semibold text-blue-900 mt-2">
                      {schedule?.last_generation_at
                        ? formatDistanceToNow(new Date(schedule.last_generation_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })
                        : 'Jamais générée'}
                    </p>
                    {schedule?.last_generation_at && (
                      <p className="text-xs text-blue-700 mt-1">
                        {format(new Date(schedule.last_generation_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <Label className="text-sm text-purple-800 font-semibold">Prochaine génération</Label>
                    <p className="text-lg font-semibold text-purple-900 mt-2">
                      {schedule?.next_generation_at
                        ? formatDistanceToNow(new Date(schedule.next_generation_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })
                        : 'Non planifiée'}
                    </p>
                    {schedule?.next_generation_at && (
                      <p className="text-xs text-purple-700 mt-1">
                        {format(new Date(schedule.next_generation_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info Box */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Système SOTA 2025 Activé</AlertTitle>
                  <AlertDescription className="text-sm mt-2">
                    <strong>Deno Cron (daily-blog-generation)</strong> s'exécute chaque jour à 9h00 (Paris). 
                    Il vérifie <code>blog_generation_schedule</code>, sélectionne intelligemment le mot-clé prioritaire, 
                    puis invoque <code>generate-seo-article</code> pour créer un article enrichi (tableaux, FAQ Schema.org, 
                    internal links). Score SEO cible : <strong>&gt;85/100</strong>.
                  </AlertDescription>
                </Alert>

                {/* Test Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => generateNow.mutate()}
                    disabled={generateNow.isPending || !schedule?.is_active}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {generateNow.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    🎯 Générer Article (generate-seo-article)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('daily-blog-generation');
                        if (error) throw error;
                        toast.success(`Cron testé avec succès: ${JSON.stringify(data)}`);
                      } catch (err: any) {
                        toast.error(`Erreur cron: ${err.message}`);
                      }
                    }}
                  >
                    🧪 Tester Cron (daily-blog-generation)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Monitoring */}
          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Monitoring Génération (SOTA 2025)
                </CardTitle>
                <CardDescription>
                  Statistiques en temps réel et logs détaillés
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {(!logs || logs.length === 0) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Aucune génération détectée</AlertTitle>
                    <AlertDescription>
                      Le système n'a enregistré aucune tentative de génération. Testez manuellement 
                      avec le bouton "🧪 Tester Cron" dans l'onglet Planification pour vérifier que tout fonctionne.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 font-medium">Taux de succès</div>
                    <div className="text-2xl font-bold text-blue-900">{stats?.successRate || 0}%</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 font-medium">Score SEO moyen</div>
                    <div className="text-2xl font-bold text-green-900">{stats?.avgScore || 0}/100</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-700 font-medium">Temps moyen</div>
                    <div className="text-2xl font-bold text-purple-900">{stats?.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-700 font-medium">7 derniers jours</div>
                    <div className="text-2xl font-bold text-orange-900">{stats?.recentActivity || 0}</div>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Statut</TableHead>
                        <TableHead>Mot-clé</TableHead>
                        <TableHead>Score SEO</TableHead>
                        <TableHead>Mots</TableHead>
                        <TableHead>Temps</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs?.slice(0, 20).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {log.status === 'success' && <Badge variant="default">Succès</Badge>}
                            {log.status === 'error' && <Badge variant="destructive">Erreur</Badge>}
                            {log.status === 'started' && <Badge variant="secondary">En cours</Badge>}
                          </TableCell>
                          <TableCell className="font-medium">{log.keyword || 'N/A'}</TableCell>
                          <TableCell>{log.seo_score ? `${log.seo_score}/100` : 'N/A'}</TableCell>
                          <TableCell>{log.word_count || 'N/A'}</TableCell>
                          <TableCell>{log.generation_time_ms ? `${(log.generation_time_ms / 1000).toFixed(1)}s` : 'N/A'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ✅ SOTA 2025: Onglet Santé SEO */}
          <TabsContent value="health" className="space-y-4">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Santé Globale du Blog
                </CardTitle>
                <CardDescription>
                  Monitoring SEO + Performance + Engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* SEO Health Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-700">Score SEO Moyen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-800">
                        {articles && articles.length > 0
                          ? Math.round(
                              articles
                                .filter(a => a.seo_score)
                                .reduce((sum, a) => sum + (a.seo_score || 0), 0) /
                              articles.filter(a => a.seo_score).length
                            )
                          : 'N/A'}
                        /100
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-700">Vues Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-800">
                        {articles?.reduce((sum, a) => sum + (a.views_count || 0), 0) || 0}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-purple-700">Taux Publication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-800">
                        {articles && articles.length > 0
                          ? Math.round((articles.filter(a => a.status === 'published').length / articles.length) * 100)
                          : 0}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Articles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🏆 Top 5 Articles les Plus Vus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {articles
                        ?.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                        .slice(0, 5)
                        .map((article, idx) => (
                          <div key={article.id} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                #{idx + 1}
                              </Badge>
                              <div>
                                <div className="font-medium">{article.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  Publié {formatDistanceToNow(new Date(article.published_at || article.created_at), { addSuffix: true, locale: fr })}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{article.views_count || 0}</div>
                              <div className="text-xs text-muted-foreground">vues</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Alert */}
                <Alert className={
                  articles && articles.filter(a => a.status === 'published').length < 5
                    ? 'border-red-300 bg-red-50'
                    : 'border-green-300 bg-green-50'
                }>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {articles && articles.filter(a => a.status === 'published').length < 5 ? (
                      <>
                        <strong>⚠️ Attention:</strong> Vous avez moins de 5 articles publiés. 
                        Générez plus de contenu pour améliorer votre SEO.
                      </>
                    ) : (
                      <>
                        <strong>✅ Excellent:</strong> Votre blog est bien fourni. 
                        Continuez à publier régulièrement pour maintenir le trafic.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}

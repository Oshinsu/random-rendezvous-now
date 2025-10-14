import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
  BarChart3
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminBlogSEO() {
  const [newKeyword, setNewKeyword] = useState('');
  const [newPriority, setNewPriority] = useState(5);
  const [newNotes, setNewNotes] = useState('');
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const { keywords, isLoading: keywordsLoading, addKeyword, updateKeyword, deleteKeyword } = useBlogKeywords();
  const { articles, isLoading: articlesLoading, publishArticle, deleteArticle, updateArticle } = useBlogArticles();
  const { schedule, generateNow, updateSchedule } = useBlogGeneration();

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
    <AdminLayout>
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
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
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
                  <Dialog open={isAddingKeyword} onOpenChange={setIsAddingKeyword}>
                    <DialogTrigger asChild>
                      <Button className="bg-red-600 hover:bg-red-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un mot-clé
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                          <Plus className="h-5 w-5" />
                          Nouveau mot-clé SEO
                        </DialogTitle>
                        <DialogDescription>
                          Ajoutez un mot-clé pour générer automatiquement un article optimisé SEO
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-5 py-4">
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
                      </div>
                      <DialogFooter className="gap-2">
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
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
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
                              {getStatusBadge(article.status)}
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
                <CardTitle className="text-xl">Configuration de la génération automatique</CardTitle>
                <CardDescription className="mt-1">
                  Paramétrez la fréquence et l'automatisation de la génération d'articles
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
                  <AlertDescription className="text-sm">
                    <strong className="font-semibold">Comment ça marche ?</strong>
                    <p className="mt-2 text-muted-foreground">
                      Un système CRON automatique vérifie la planification. Quand le moment est venu, 
                      l'IA sélectionne intelligemment le mot-clé prioritaire non utilisé récemment et génère 
                      un article optimisé SEO de 1500-2000 mots. L'article est sauvegardé en brouillon pour 
                      relecture avant publication sur le blog.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

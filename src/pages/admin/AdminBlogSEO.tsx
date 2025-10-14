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
} from '@/components/ui/dialog';
import { useBlogKeywords } from '@/hooks/useBlogKeywords';
import { useBlogArticles } from '@/hooks/useBlogArticles';
import { useBlogGeneration } from '@/hooks/useBlogGeneration';
import { Plus, Edit2, Trash2, Eye, Send, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminBlogSEO() {
  const [newKeyword, setNewKeyword] = useState('');
  const [newPriority, setNewPriority] = useState(5);
  const [newNotes, setNewNotes] = useState('');
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);

  const { keywords, isLoading: keywordsLoading, addKeyword, updateKeyword, deleteKeyword } = useBlogKeywords();
  const { articles, isLoading: articlesLoading, publishArticle, deleteArticle } = useBlogArticles();
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

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-red-800">Blog SEO</h1>
            <p className="text-muted-foreground mt-2">
              Génération automatique d'articles optimisés SEO avec IA
            </p>
          </div>
          <Button
            onClick={() => generateNow.mutate()}
            disabled={generateNow.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generateNow.isPending ? 'Génération...' : 'Générer Maintenant'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Mots-clés actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {keywords?.filter(k => k.status === 'active').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Articles générés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {schedule?.total_generated || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Articles publiés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {articles?.filter(a => a.status === 'published').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Prochaine génération</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {schedule?.next_generation_at
                  ? formatDistanceToNow(new Date(schedule.next_generation_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })
                  : 'Non planifiée'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="keywords" className="space-y-4">
          <TabsList>
            <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="schedule">Planification</TabsTrigger>
          </TabsList>

          {/* Onglet Mots-clés */}
          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestion des mots-clés</CardTitle>
                    <CardDescription>
                      Ajoutez des mots-clés pour générer automatiquement des articles SEO
                    </CardDescription>
                  </div>
                  <Dialog open={isAddingKeyword} onOpenChange={setIsAddingKeyword}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un mot-clé
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouveau mot-clé</DialogTitle>
                        <DialogDescription>
                          Ajoutez un mot-clé pour la génération d'articles SEO
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Mot-clé *</Label>
                          <Input
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Ex: rencontrer de nouvelles personnes à Paris"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Priorité (1-10) *</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={newPriority}
                            onChange={(e) => setNewPriority(parseInt(e.target.value))}
                          />
                          <p className="text-xs text-muted-foreground">
                            10 = priorité maximale, sera utilisé en premier
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes (optionnel)</Label>
                          <Textarea
                            value={newNotes}
                            onChange={(e) => setNewNotes(e.target.value)}
                            placeholder="Notes internes sur ce mot-clé..."
                          />
                        </div>
                        <Button 
                          onClick={handleAddKeyword}
                          disabled={!newKeyword.trim() || addKeyword.isPending}
                          className="w-full"
                        >
                          {addKeyword.isPending ? 'Ajout...' : 'Ajouter le mot-clé'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {keywordsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : keywords && keywords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mot-clé</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Utilisations</TableHead>
                        <TableHead>Dernière utilisation</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywords.map((keyword) => (
                        <TableRow key={keyword.id}>
                          <TableCell className="font-medium">{keyword.keyword}</TableCell>
                          <TableCell>
                            <Badge variant={keyword.priority >= 8 ? 'destructive' : 'secondary'}>
                              {keyword.priority}/10
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              keyword.status === 'active' ? 'default' : 
                              keyword.status === 'paused' ? 'secondary' : 'outline'
                            }>
                              {keyword.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{keyword.times_used}</TableCell>
                          <TableCell>
                            {keyword.last_used_at
                              ? formatDistanceToNow(new Date(keyword.last_used_at), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })
                              : 'Jamais'}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateKeyword.mutate({
                                id: keyword.id,
                                updates: { 
                                  status: keyword.status === 'active' ? 'paused' : 'active' 
                                }
                              })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteKeyword.mutate(keyword.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="mb-4">Aucun mot-clé configuré</p>
                    <Button onClick={() => setIsAddingKeyword(true)}>
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
              <CardHeader>
                <CardTitle>Articles générés</CardTitle>
                <CardDescription>
                  Gérez et publiez vos articles générés automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {articlesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : articles && articles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Score SEO</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vues</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {articles.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium max-w-xs truncate">
                            {article.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              (article.seo_score || 0) >= 80 ? 'default' : 
                              (article.seo_score || 0) >= 60 ? 'secondary' : 'destructive'
                            }>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {article.seo_score || 0}/100
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              article.status === 'published' ? 'default' : 
                              article.status === 'draft' ? 'secondary' : 'outline'
                            }>
                              {article.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{article.views_count}</TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(article.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/blog/${article.slug}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {article.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => publishArticle.mutate(article.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteArticle.mutate(article.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="mb-4">Aucun article généré pour le moment</p>
                    <Button onClick={() => generateNow.mutate()}>
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
              <CardHeader>
                <CardTitle>Configuration de la génération automatique</CardTitle>
                <CardDescription>
                  Paramétrez la fréquence de génération des articles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Génération automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer la génération automatique d'articles selon la fréquence définie
                    </p>
                  </div>
                  <Switch
                    checked={schedule?.is_active || false}
                    onCheckedChange={handleToggleSchedule}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fréquence (jours)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={schedule?.frequency_days || 2}
                    onChange={(e) => updateSchedule.mutate({ 
                      frequency_days: parseInt(e.target.value) 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Un nouvel article sera généré tous les {schedule?.frequency_days || 2} jours
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-muted-foreground">Dernière génération</Label>
                    <p className="text-sm font-medium mt-1">
                      {schedule?.last_generation_at
                        ? formatDistanceToNow(new Date(schedule.last_generation_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })
                        : 'Jamais'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Prochaine génération</Label>
                    <p className="text-sm font-medium mt-1">
                      {schedule?.next_generation_at
                        ? formatDistanceToNow(new Date(schedule.next_generation_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })
                        : 'Non planifiée'}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Comment ça marche ?</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Un système CRON automatique vérifie la planification. Quand le moment est venu, 
                        l'IA sélectionne le mot-clé prioritaire non utilisé récemment et génère un article 
                        optimisé SEO de 1500-2000 mots. L'article est sauvegardé en brouillon pour relecture 
                        avant publication.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

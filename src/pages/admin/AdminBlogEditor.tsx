import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RichTextEditor } from '@/components/admin/cms/RichTextEditor';
import { ImageManager } from '@/components/admin/cms/ImageManager';
import { useBlogArticles } from '@/hooks/useBlogArticles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBlogEditor() {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedMetaDesc, setEditedMetaDesc] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');

  const { articles, isLoading, updateArticle } = useBlogArticles();

  const selectedArticle = articles?.find(a => a.id === selectedArticleId);

  const handleSelectArticle = (articleId: string) => {
    const article = articles?.find(a => a.id === articleId);
    if (article) {
      setSelectedArticleId(articleId);
      setEditedTitle(article.title);
      setEditedContent(article.content);
      setEditedMetaDesc(article.meta_description || '');
      setEditedImageUrl(article.featured_image_url || '');
    }
  };

  const handleSave = async () => {
    if (!selectedArticleId) return;

    try {
      await updateArticle.mutateAsync({
        id: selectedArticleId,
        updates: {
          title: editedTitle,
          content: editedContent,
          meta_description: editedMetaDesc,
          featured_image_url: editedImageUrl || null,
        }
      });

      toast.success('Article mis à jour avec succès');
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-red-800 flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Éditeur de Blog
          </h1>
          <p className="text-muted-foreground mt-2">
            Modifiez le contenu des articles de blog avec un éditeur WYSIWYG
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Article Selector */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sélectionner un article</CardTitle>
                <CardDescription>
                  {articles?.length || 0} articles disponibles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {articles?.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleSelectArticle(article.id)}
                    className={`w-full text-left p-4 border rounded-lg transition ${
                      selectedArticleId === article.id 
                        ? 'border-red-600 bg-red-50' 
                        : 'hover:border-red-300 hover:bg-red-50/30'
                    }`}
                  >
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                        {article.status}
                      </Badge>
                      {article.seo_score && (
                        <Badge variant="outline">
                          SEO {article.seo_score}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Editor */}
          <div className="lg:col-span-3 space-y-6">
            {selectedArticle ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Métadonnées de l'article</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre</Label>
                      <Input
                        id="title"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        placeholder="Titre de l'article"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta_desc">Meta Description</Label>
                      <Textarea
                        id="meta_desc"
                        value={editedMetaDesc}
                        onChange={(e) => setEditedMetaDesc(e.target.value)}
                        placeholder="Description SEO (140-160 caractères)"
                        className="min-h-[80px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        {editedMetaDesc.length} / 160 caractères
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image_url">URL de l'image à la une</Label>
                      <Input
                        id="image_url"
                        value={editedImageUrl}
                        onChange={(e) => setEditedImageUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      {editedImageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border">
                          <img 
                            src={editedImageUrl} 
                            alt="Preview" 
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contenu de l'article</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      value={editedContent}
                      onChange={(value) => setEditedContent(value)}
                      onSave={handleSave}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedArticleId(null);
                      setEditedTitle('');
                      setEditedContent('');
                      setEditedMetaDesc('');
                      setEditedImageUrl('');
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateArticle.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {updateArticle.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Sélectionnez un article à gauche pour commencer l'édition
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useBlogArticles } from '@/hooks/useBlogArticles';
import { Calendar, Eye, TrendingUp, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';

export default function Blog() {
  const { articles, isLoading } = useBlogArticles('published');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'seo'>('recent');
  const [page, setPage] = useState(1);
  const articlesPerPage = 9;

  // Sorting logic
  const sortedArticles = articles?.sort((a, b) => {
    if (sortBy === 'popular') return (b.views_count || 0) - (a.views_count || 0);
    if (sortBy === 'seo') return (b.seo_score || 0) - (a.seo_score || 0);
    return new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime();
  });

  // Pagination
  const paginatedArticles = sortedArticles?.slice(
    (page - 1) * articlesPerPage,
    page * articlesPerPage
  );

  const totalPages = Math.ceil((sortedArticles?.length || 0) / articlesPerPage);

  return (
    <AppLayout>
      <Helmet>
        <title>Blog - Random : Conseils, astuces et tendances pour vos sorties à Paris</title>
        <meta name="description" content="Découvrez nos articles sur les rencontres, les sorties entre amis et la vie nocturne parisienne. Tous les conseils pour profiter au maximum de Random." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-white via-brand-50/10 to-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-red-800 mb-4">
              Blog Random
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez nos articles sur les rencontres, les sorties et la vie sociale à Paris
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full md:w-[220px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="popular">Plus populaires</SelectItem>
                <SelectItem value="seo">Meilleur SEO</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-sm text-muted-foreground">
              {sortedArticles?.length || 0} article{(sortedArticles?.length || 0) > 1 ? 's' : ''}
            </p>
          </div>

          {/* Articles Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted"></div>
                  <CardHeader>
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedArticles?.map((article) => (
                <Link key={article.id} to={`/blog/${article.slug}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full">
                    {article.featured_image_url && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={article.featured_image_url} 
                          alt={article.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        {article.seo_score && article.seo_score >= 80 && (
                          <Badge variant="default" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            SEO {article.seo_score}
                          </Badge>
                        )}
                        {article.generated_by_ai && (
                          <Badge variant="secondary">IA</Badge>
                        )}
                      </div>
                      <CardTitle className="line-clamp-2 hover:text-red-600 transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 mt-2">
                        {article.excerpt || article.meta_description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(article.published_at!), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.views_count} vues
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Précédent
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Page {page} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                Aucun article publié pour le moment. Revenez bientôt !
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

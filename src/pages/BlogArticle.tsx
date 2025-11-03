import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBlogArticles, BlogArticle as BlogArticleType } from '@/hooks/useBlogArticles';
import { Calendar, Eye, ArrowLeft, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';

// Table of Contents component
function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = useState<Array<{ id: string; text: string; level: number }>>([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const h2s = Array.from(doc.querySelectorAll('h2'));
    
    setHeadings(
      h2s.map((h, i) => ({
        id: `heading-${i}`,
        text: h.textContent || '',
        level: 2
      }))
    );

    // Add IDs to actual h2 elements in the DOM after render
    setTimeout(() => {
      document.querySelectorAll('article h2').forEach((h, i) => {
        h.id = `heading-${i}`;
      });
    }, 100);
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Table des matières</CardTitle>
      </CardHeader>
      <CardContent>
        <nav>
          <ul className="space-y-2">
            {headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className="text-sm text-muted-foreground hover:text-red-600 transition block"
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  );
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { getArticleBySlug } = useBlogArticles();
  const [article, setArticle] = useState<BlogArticleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      try {
        const data = await getArticleBySlug(slug);
        setArticle(data);
      } catch (error) {
        console.error('Error loading article:', error);
        toast.error('Article non trouvé');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-white via-brand-50/10 to-white py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!article) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-white via-brand-50/10 to-white py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl font-display font-bold text-red-800 mb-4">
              Article non trouvé
            </h1>
            <Link to="/blog">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au blog
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Helmet>
        <title>{article.meta_title}</title>
        <meta name="description" content={article.meta_description} />
        <meta property="og:title" content={article.meta_title} />
        <meta property="og:description" content={article.meta_description} />
        <meta property="og:type" content="article" />
        {article.featured_image_url && (
          <meta property="og:image" content={article.featured_image_url} />
        )}
        <meta property="article:published_time" content={article.published_at || ''} />
        <link rel="canonical" href={`https://random-app.fr/blog/${article.slug}`} />
      </Helmet>

      <article 
        className="min-h-screen bg-gradient-to-br from-white via-brand-50/10 to-white py-16"
        itemScope 
        itemType="http://schema.org/BlogPosting"
      >
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Back button */}
          <Link to="/blog" className="inline-block mb-8">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au blog
            </Button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main content */}
            <div className="lg:col-span-3">
              {/* Header */}
              <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {article.seo_score && article.seo_score >= 80 && (
                <Badge variant="default" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  SEO {article.seo_score}
                </Badge>
              )}
              {article.generated_by_ai && (
                <Badge variant="secondary">Généré par IA</Badge>
              )}
            </div>

            <h1 
              className="text-4xl md:text-5xl font-display font-bold text-red-800 mb-6"
              itemProp="headline"
            >
              {article.title}
            </h1>

            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time 
                  itemProp="datePublished" 
                  dateTime={article.published_at || ''}
                >
                  {formatDistanceToNow(new Date(article.published_at!), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {article.views_count} vues
              </div>
            </div>

            {article.featured_image_url && (
              <div className="mt-8 rounded-2xl overflow-hidden">
                <img 
                  src={article.featured_image_url} 
                  alt={article.title}
                  className="w-full h-auto"
                  itemProp="image"
                />
              </div>
            )}
              </header>

              {/* Content */}
              <div 
                className="prose prose-lg max-w-none prose-headings:font-display prose-h2:text-red-800 prose-h3:text-red-700 prose-a:text-red-600 hover:prose-a:text-red-700 prose-h2:scroll-mt-24"
                itemProp="articleBody"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* CTA */}
              <div className="mt-16 p-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl text-center">
                <h3 className="text-2xl font-display font-bold text-red-800 mb-4">
                  Prêt à vivre l'expérience Random ?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Rejoignez des milliers de Parisiens qui ont déjà fait de nouvelles rencontres grâce à Random.
                </p>
                <Link to="/">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700">
                    Commencer maintenant
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sidebar ToC */}
            <aside className="hidden lg:block">
              <TableOfContents content={article.content} />
            </aside>
          </div>
        </div>
      </article>
    </AppLayout>
  );
}

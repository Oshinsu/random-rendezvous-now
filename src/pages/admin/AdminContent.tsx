import { useSiteContent } from '@/hooks/useSiteContent';
import { ContentEditCard } from '@/components/admin/cms/ContentEditCard';
import { CMSNavigation } from '@/components/admin/cms/CMSNavigation';
import { CMSHeader } from '@/components/admin/cms/CMSHeader';
import { CMSPerformanceDashboard } from '@/components/admin/cms/CMSPerformanceDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Eye } from 'lucide-react';
import HeroSection from '@/components/landing/HeroSection';
import WhyRandomSection from '@/components/landing/WhyRandomSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import Footer from '@/components/landing/Footer';

interface AdminContentProps {
  view?: 'hero' | 'benefits' | 'how_it_works' | 'footer' | 'all';
}

export default function AdminContent({ view = 'all' }: AdminContentProps) {
  const { contents, loading, updateContent, refresh } = useSiteContent();

  const handleUpdateContent = async (id: string, value: any) => {
    const success = await updateContent(id, value);
    if (success) {
      await refresh();
    }
    return success;
  };

  const handleAIAnalyze = async () => {
    toast.info('Lancement de l\'analyse AI...');
    try {
      const textContents = contents.filter(c => c.content_type === 'text');
      for (const content of textContents) {
        await supabase.functions.invoke('calculate-cms-seo', {
          body: { content_id: content.id }
        });
      }
      toast.success(`Analyse complétée pour ${textContents.length} contenus !`);
      await refresh();
    } catch (error) {
      toast.error('Erreur lors de l\'analyse AI');
    }
  };

  const handlePublish = async () => {
    toast.info('Publication en cours...');
    try {
      await supabase.rpc('refresh_cms_engagement');
      toast.success('Contenus publiés avec succès !');
      await refresh();
    } catch (error) {
      toast.error('Erreur lors de la publication');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  const stats = {
    total: contents.length,
    sections: Array.from(new Set(contents.map(c => c.page_section))).length,
    recentlyUpdated: contents.filter(c => {
      const diffDays = Math.ceil((new Date().getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <CMSHeader onRefresh={refresh} onAIAnalyze={handleAIAnalyze} onPublish={handlePublish} />
      <CMSPerformanceDashboard stats={stats} />
      <Separator />
      <CMSNavigation />

      {view === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🎯 Hero Section</CardTitle>
                <p className="text-sm text-muted-foreground">Titre principal et call-to-action</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {contents.filter(c => c.page_section === 'hero').map(content => (
                  <ContentEditCard key={content.id} content={content} onUpdate={handleUpdateContent} />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="sticky top-4 h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu en temps réel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="border-2 border-dashed rounded-lg overflow-hidden bg-neutral-50">
                  <div className="scale-50 origin-top-left w-[200%] h-[400px] overflow-hidden">
                    <HeroSection />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {view === 'benefits' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>✨ Benefits Section</CardTitle>
                <p className="text-sm text-muted-foreground">Les 4 avantages clés de Random</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {contents.filter(c => c.page_section === 'benefits').map(content => (
                  <ContentEditCard key={content.id} content={content} onUpdate={handleUpdateContent} />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="sticky top-4 h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu en temps réel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="border-2 border-dashed rounded-lg overflow-hidden bg-neutral-50">
                  <div className="scale-[0.4] origin-top-left w-[250%] h-[500px] overflow-hidden">
                    <WhyRandomSection />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {view === 'how_it_works' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>⚡ How It Works Section</CardTitle>
                <p className="text-sm text-muted-foreground">Le processus Random en 4 étapes</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {contents.filter(c => c.page_section === 'how_it_works').map(content => (
                  <ContentEditCard key={content.id} content={content} onUpdate={handleUpdateContent} />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="sticky top-4 h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu en temps réel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="border-2 border-dashed rounded-lg overflow-hidden bg-neutral-50">
                  <div className="scale-[0.4] origin-top-left w-[250%] h-[500px] overflow-hidden">
                    <HowItWorksSection />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {view === 'footer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🌍 Footer Section</CardTitle>
                <p className="text-sm text-muted-foreground">Informations de contact et liens footer</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {contents.filter(c => c.page_section === 'footer').map(content => (
                  <ContentEditCard key={content.id} content={content} onUpdate={handleUpdateContent} />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="sticky top-4 h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu en temps réel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white">
                  <Footer />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

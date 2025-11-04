import { useState } from 'react';
import { useSiteContentContext } from '@/contexts/SiteContentContext';
import { ContentEditCard } from '@/components/admin/cms/ContentEditCard';
import { CMSPerformanceDashboard } from '@/components/admin/cms/CMSPerformanceDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Loader2, RefreshCw, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import HeroSection from '@/components/landing/HeroSection';
import WhyRandomSection from '@/components/landing/WhyRandomSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import Footer from '@/components/landing/Footer';

interface AdminContentProps {
  view?: 'hero' | 'benefits' | 'how_it_works' | 'footer' | 'all';
}

export default function AdminContent({ view = 'all' }: AdminContentProps) {
  const { contents, loading, updateContent, deleteContent, refresh, isSaving } = useSiteContentContext();
  const [previewKey, setPreviewKey] = useState(0);

  const handleUpdateContent = async (id: string, value: any) => {
    const success = await updateContent(id, value);
    if (success) {
      setPreviewKey(prev => prev + 1);
    }
    return success;
  };

  const handleDeleteContent = async (id: string) => {
    const success = await deleteContent(id);
    if (success) {
      setPreviewKey(prev => prev + 1);
    }
    return success;
  };

  const handlePublish = async () => {
    try {
      await refresh();
      toast.success("Modifications publiées");
    } catch (error) {
      toast.error("Erreur de publication");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2 mb-6">
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        <Button onClick={handlePublish}>
          <Rocket className="h-4 w-4 mr-2" />
          Publier
        </Button>
      </div>

      <CMSPerformanceDashboard stats={{
        total: contents.length,
        sections: Array.from(new Set(contents.map(c => c.page_section))).length,
        recentlyUpdated: contents.filter(c => {
          const diffDays = Math.ceil((new Date().getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        }).length
      }} />

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
                  <ContentEditCard key={content.id} content={content} onUpdate={handleUpdateContent} onDelete={handleDeleteContent} />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="sticky top-4 h-fit preview-container">
            <Card className={cn(
              "border-2 transition-all duration-300",
              isSaving ? "border-yellow-400 shadow-lg shadow-yellow-400/20" : "border-primary/20"
            )}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full animate-pulse",
                    isSaving ? "bg-yellow-500" : "bg-green-500"
                  )} />
                  <Eye className="h-5 w-5" />
                  <CardTitle>Aperçu en temps réel</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="relative border-2 border-dashed rounded-lg overflow-hidden bg-neutral-50">
                  {isSaving && (
                    <div className="absolute inset-0 bg-yellow-400/10 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
                      <div className="bg-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                        <span className="text-sm font-medium text-neutral-900">
                          Mise à jour du preview...
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="scale-50 origin-top-left w-[200%] h-[400px] overflow-hidden">
                    <HeroSection key={`hero-${previewKey}`} />
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
                  <ContentEditCard key={content.id} content={content} onUpdate={handleUpdateContent} onDelete={handleDeleteContent} />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="sticky top-4 h-fit preview-container">
            <Card className={cn(
              "border-2 transition-all duration-300",
              isSaving ? "border-yellow-400 shadow-lg shadow-yellow-400/20" : "border-primary/20"
            )}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full animate-pulse",
                    isSaving ? "bg-yellow-500" : "bg-green-500"
                  )} />
                  <Eye className="h-5 w-5" />
                  <CardTitle>Aperçu en temps réel</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="relative border-2 border-dashed rounded-lg overflow-hidden bg-neutral-50">
                  {isSaving && (
                    <div className="absolute inset-0 bg-yellow-400/10 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
                      <div className="bg-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                        <span className="text-sm font-medium text-neutral-900">
                          Mise à jour du preview...
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="scale-50 origin-top-left w-[200%] h-[600px] overflow-hidden">
                    <WhyRandomSection key={`benefits-${previewKey}`} />
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
                  <ContentEditCard key={content.id} content={content} onUpdate={handleUpdateContent} onDelete={handleDeleteContent} />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="sticky top-4 h-fit preview-container">
            <Card className={cn(
              "border-2 transition-all duration-300",
              isSaving ? "border-yellow-400 shadow-lg shadow-yellow-400/20" : "border-primary/20"
            )}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full animate-pulse",
                    isSaving ? "bg-yellow-500" : "bg-green-500"
                  )} />
                  <Eye className="h-5 w-5" />
                  <CardTitle>Aperçu en temps réel</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="relative border-2 border-dashed rounded-lg overflow-hidden bg-neutral-50">
                  {isSaving && (
                    <div className="absolute inset-0 bg-yellow-400/10 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
                      <div className="bg-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                        <span className="text-sm font-medium text-neutral-900">
                          Mise à jour du preview...
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="scale-50 origin-top-left w-[200%] h-[600px] overflow-hidden">
                    <HowItWorksSection key={`how-it-works-${previewKey}`} />
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
                  <ContentEditCard key={content.id} content={content} onUpdate={handleUpdateContent} onDelete={handleDeleteContent} />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="sticky top-4 h-fit preview-container">
            <Card className={cn(
              "border-2 transition-all duration-300",
              isSaving ? "border-yellow-400 shadow-lg shadow-yellow-400/20" : "border-primary/20"
            )}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full animate-pulse",
                    isSaving ? "bg-yellow-500" : "bg-green-500"
                  )} />
                  <Eye className="h-5 w-5" />
                  <CardTitle>Aperçu en temps réel</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="relative border-2 border-dashed rounded-lg overflow-hidden bg-neutral-50">
                  {isSaving && (
                    <div className="absolute inset-0 bg-yellow-400/10 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
                      <div className="bg-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                        <span className="text-sm font-medium text-neutral-900">
                          Mise à jour du preview...
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="scale-50 origin-top-left w-[200%] h-[400px] overflow-hidden">
                    <Footer key={`footer-${previewKey}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Global saving indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sauvegarde en cours...
        </div>
      )}
    </div>
  );
}

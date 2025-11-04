import { useNavigate } from 'react-router-dom';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Layout, Target, Zap, Globe, ArrowRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SectionCardProps {
  title: string;
  description: string;
  count: number;
  path: string;
  gradient: string;
  icon: React.ReactNode;
  lastUpdated?: string;
}

const SectionCard = ({ title, description, count, path, gradient, icon, lastUpdated }: SectionCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className={`group relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 cursor-pointer ${gradient}`}
      onClick={() => navigate(path)}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
        {icon}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-foreground">{count}</div>
            <div className="text-xs text-muted-foreground">éléments</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        </div>
        
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="h-3 w-3" />
            <span>Modifié {formatDistanceToNow(new Date(lastUpdated), { locale: fr, addSuffix: true })}</span>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full group-hover:bg-primary/10 transition-colors"
        >
          Éditer la section
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default function AdminContentDashboard() {
  const { contents, loading } = useSiteContent();

  const sections = [
    {
      id: 'hero',
      title: 'Hero Section',
      description: 'Titre principal, sous-titre et call-to-action de la page d\'accueil',
      path: '/admin/content/hero',
      gradient: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50',
      icon: <Layout className="h-8 w-8 text-blue-600" />,
    },
    {
      id: 'benefits',
      title: 'Benefits Section',
      description: 'Les 4 avantages principaux de Random avec images et descriptions',
      path: '/admin/content/benefits',
      gradient: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/50',
      icon: <Target className="h-8 w-8 text-green-600" />,
    },
    {
      id: 'how_it_works',
      title: 'How It Works Section',
      description: 'Les 4 étapes du processus Random expliquées simplement',
      path: '/admin/content/how-it-works',
      gradient: 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50',
      icon: <Zap className="h-8 w-8 text-purple-600" />,
    },
    {
      id: 'footer',
      title: 'Footer Section',
      description: 'Informations de contact, liens légaux et description footer',
      path: '/admin/content/footer',
      gradient: 'border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100/50',
      icon: <Globe className="h-8 w-8 text-neutral-600" />,
    },
  ];

  const getSectionStats = (sectionId: string) => {
    const sectionContents = contents.filter(c => c.page_section === sectionId);
    const lastUpdated = sectionContents.length > 0
      ? sectionContents.reduce((latest, current) => 
          new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest
        ).updated_at
      : undefined;

    return {
      count: sectionContents.length,
      lastUpdated,
    };
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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Content Management System</h1>
        <p className="text-muted-foreground">
          Gérez le contenu de votre site par section pour une organisation optimale
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const stats = getSectionStats(section.id);
          return (
            <SectionCard
              key={section.id}
              title={section.title}
              description={section.description}
              count={stats.count}
              path={section.path}
              gradient={section.gradient}
              icon={section.icon}
              lastUpdated={stats.lastUpdated}
            />
          );
        })}
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">📚 Guide d'utilisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Cliquez sur une section pour éditer son contenu avec aperçu en temps réel</p>
          <p>• Les modifications sont sauvegardées automatiquement</p>
          <p>• Utilisez l'AI Copywriter pour améliorer vos textes</p>
          <p>• Le preview vous montre exactement comment la section apparaît aux visiteurs</p>
        </CardContent>
      </Card>
    </div>
  );
}

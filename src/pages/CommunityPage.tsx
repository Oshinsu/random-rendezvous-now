import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Users, Sparkles } from 'lucide-react';
import { StoryCard } from '@/components/community/StoryCard';
import { SubmitStoryModal } from '@/components/community/SubmitStoryModal';
import { useCommunityStories } from '@/hooks/useCommunityStories';
import { Helmet } from 'react-helmet-async';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CommunityPage() {
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const [selectedVibe, setSelectedVibe] = useState<string | undefined>();

  const { stories, isLoading, refetch } = useCommunityStories({
    city: selectedCity,
    vibe: selectedVibe,
    limit: 50,
  });

  return (
    <>
      <Helmet>
        <title>Community Hub · Random | Témoignages Authentiques</title>
        <meta
          name="description"
          content="Découvre les vraies histoires de la communauté Random. Photos, vidéos et témoignages vérifiés de sorties entre inconnus à Paris."
        />
        <meta property="og:title" content="Community Hub · Random" />
        <meta property="og:description" content="Les vraies stories de sorties Random" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-brand-50/20">
        {/* Hero Section - Video First */}
        <section className="relative h-[60vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10" />
          
          {/* Hero Video Loop */}
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center">
              <div className="text-center space-y-4 relative z-20 px-4">
                <Badge className="bg-primary/90 text-primary-foreground border-0 text-sm px-4 py-2">
                  <Users className="w-4 h-4 mr-2" />
                  {stories.length}+ Stories Vérifiées
                </Badge>
                <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground drop-shadow-glow">
                  Community Hub
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Les vraies histoires de sorties Random · 100% authentique · +50 crédits par story
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters + CTA */}
        <section className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Ville" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" onClick={() => setSelectedCity(undefined)}>
                      Toutes
                    </SelectItem>
                    <SelectItem value="Paris">Paris</SelectItem>
                    <SelectItem value="Lyon">Lyon</SelectItem>
                    <SelectItem value="Marseille">Marseille</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedVibe} onValueChange={setSelectedVibe}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Vibe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" onClick={() => setSelectedVibe(undefined)}>
                      Tous
                    </SelectItem>
                    <SelectItem value="chill">Chill</SelectItem>
                    <SelectItem value="festif">Festif</SelectItem>
                    <SelectItem value="culturel">Culturel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setSubmitModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Partager mon histoire</span>
                <span className="sm:hidden">Partager</span>
                <Badge variant="secondary" className="ml-2">+50</Badge>
              </Button>
            </div>
          </div>
        </section>

        {/* Bento Grid Stories */}
        <section className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune story pour l'instant</h3>
              <p className="text-muted-foreground mb-6">
                Sois le premier à partager ton expérience Random !
              </p>
              <Button onClick={() => setSubmitModalOpen(true)} size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Créer la première story
              </Button>
            </div>
          ) : (
            <>
              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto">
                {stories.map((story, index) => (
                  <div
                    key={story.id}
                    className={`
                      ${index % 7 === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}
                      ${index % 11 === 0 && index !== 0 ? 'lg:col-span-2' : ''}
                      animate-in fade-in slide-in-up
                    `}
                    style={{
                      animationDelay: `${Math.min(index * 50, 500)}ms`,
                      animationFillMode: 'backwards'
                    }}
                  >
                    <StoryCard story={story} onLikeUpdate={refetch} />
                  </div>
                ))}
              </div>

              {/* Live Activity Badge */}
              <div className="fixed bottom-6 left-6 z-40">
                <Badge className="bg-background/95 backdrop-blur-md border-border/50 px-4 py-2 shadow-glow">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-medium">{stories.length} stories live</span>
                </Badge>
              </div>
            </>
          )}
        </section>
      </div>

      <SubmitStoryModal
        open={submitModalOpen}
        onOpenChange={setSubmitModalOpen}
      />
    </>
  );
}

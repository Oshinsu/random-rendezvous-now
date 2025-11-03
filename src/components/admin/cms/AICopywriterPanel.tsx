import { useState } from 'react';
import { Sparkles, RefreshCw, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOScoreCard } from './SEOScoreCard';
import { ToneAnalysisCard } from './ToneAnalysisCard';
import { useCMSAICopywriter } from '@/hooks/useCMSAICopywriter';
import { toast } from 'sonner';

interface AICopywriterPanelProps {
  currentText: string;
  sectionContext: 'hero' | 'benefits' | 'how_it_works' | 'footer' | 'meta';
  onApplySuggestion: (text: string) => void;
}

export const AICopywriterPanel = ({ 
  currentText, 
  sectionContext, 
  onApplySuggestion 
}: AICopywriterPanelProps) => {
  const { improveText, generateABVariants, loading, result } = useCMSAICopywriter();
  const [variants, setVariants] = useState<any[]>([]);

  const handleImprove = async () => {
    try {
      const suggestion = await improveText({
        text: currentText,
        context: sectionContext,
        goal: 'Optimiser pour engagement Gen Z'
      });
      
      toast.success('Suggestion générée avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la génération');
      console.error(error);
    }
  };

  const handleGenerateVariants = async () => {
    try {
      const newVariants = await generateABVariants(currentText);
      setVariants(newVariants);
      toast.success(`${newVariants.length} variants générés !`);
    } catch (error) {
      toast.error('Erreur lors de la génération');
      console.error(error);
    }
  };

  const handleApply = (text: string) => {
    onApplySuggestion(text);
    toast.success('Texte appliqué avec succès !');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Copywriter
        </CardTitle>
        <Badge variant="outline" className="text-xs w-fit">
          Section: {sectionContext}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="improve" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="improve" className="text-xs">Améliorer</TabsTrigger>
            <TabsTrigger value="variants" className="text-xs">Variants</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
            <TabsTrigger value="tone" className="text-xs">Tone</TabsTrigger>
          </TabsList>

          {/* Tab Améliorer */}
          <TabsContent value="improve" className="space-y-3">
            <Button 
              onClick={handleImprove}
              disabled={loading || !currentText}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer version optimisée
                </>
              )}
            </Button>

            {result && (
              <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Version AI :</h4>
                    <Badge variant="secondary" className="text-xs">
                      Score: {result.seo_score}/100
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed">{result.improved_text}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApply(result.improved_text)}
                      className="flex-1"
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Appliquer
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleImprove}
                      disabled={loading}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  {result.reasoning && (
                    <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-muted-foreground">
                        💡 {result.reasoning}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!currentText && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Entrez du texte pour obtenir des suggestions AI
              </p>
            )}
          </TabsContent>

          {/* Tab Variants A/B */}
          <TabsContent value="variants" className="space-y-3">
            <Button 
              onClick={handleGenerateVariants}
              disabled={loading || !currentText}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  Générer 3 variants
                </>
              )}
            </Button>

            {variants.length > 0 && (
              <div className="space-y-2">
                {variants.map((variant, i) => (
                  <Card key={i} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <Badge className="w-fit text-xs">
                        Version {String.fromCharCode(65 + i)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{variant.text}</p>
                      <Button 
                        size="sm" 
                        onClick={() => handleApply(variant.text)}
                        className="w-full"
                      >
                        Utiliser
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab SEO Score */}
          <TabsContent value="seo">
            <SEOScoreCard text={currentText} />
          </TabsContent>

          {/* Tab Tone Check */}
          <TabsContent value="tone">
            <ToneAnalysisCard 
              text={currentText}
              targetTone="Gen Z, fun, spontané"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

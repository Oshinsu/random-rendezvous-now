import { Eye, Target, Type, MousePointer, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCMSSEOScores, useRecalculateSEO } from '@/hooks/useCMSSEOScores';
import { useToast } from '@/hooks/use-toast';

interface SEOScoreCardProps {
  text: string;
  contentId?: string;
}

interface SEOMetrics {
  readabilityScore: number;
  keywordDensity: number;
  lengthOptimal: boolean;
  ctaPresence: boolean;
  emojiCount: number;
  wordCount: number;
}

const calculateSEO = (text: string): SEOMetrics => {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  
  // Flesch-Kincaid simplifié (adapté français)
  const avgWordsPerSentence = sentences > 0 ? wordCount / sentences : 0;
  const readability = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence * 2)));
  
  // Keywords Random
  const keywords = ['random', 'bar', 'sortie', 'spontané', 'fun', 'gratuit', 'rencontre'];
  const textLower = text.toLowerCase();
  const keywordCount = keywords.filter(k => textLower.includes(k)).length;
  
  // Emojis count
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojiCount = (text.match(emojiRegex) || []).length;
  
  // CTA detection
  const ctaWords = ['rejoins', 'découvre', 'essaie', 'inscris', 'télécharge', 'commence'];
  const ctaPresence = ctaWords.some(cta => textLower.includes(cta));
  
  return {
    readabilityScore: Math.round(readability),
    keywordDensity: Math.round((keywordCount / keywords.length) * 100),
    lengthOptimal: wordCount >= 50 && wordCount <= 150,
    ctaPresence,
    emojiCount,
    wordCount
  };
};

const ScoreItem = ({ 
  label, 
  score, 
  target, 
  icon: Icon 
}: { 
  label: string; 
  score: number; 
  target: number; 
  icon: any;
}) => {
  const percentage = Math.min(100, (score / target) * 100);
  const color = percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-orange-600' : 'text-red-600';
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-sm font-bold ${color}`}>{score}/{target}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};

export const SEOScoreCard = ({ text, contentId }: SEOScoreCardProps) => {
  const { toast } = useToast();
  const { data: seoData } = useCMSSEOScores();
  const recalculateMutation = useRecalculateSEO();

  // Try to get stored score first, fallback to real-time calculation
  const storedScore = contentId 
    ? seoData?.scoresBySection.find(s => s.content_id === contentId)
    : null;

  const metrics = storedScore 
    ? {
        readabilityScore: storedScore.readability_score,
        keywordDensity: storedScore.keyword_density,
        lengthOptimal: storedScore.length_score >= 80,
        ctaPresence: storedScore.cta_score >= 80,
        emojiCount: storedScore.emoji_score >= 80 ? 2 : 0,
        wordCount: text.split(/\s+/).length,
      }
    : calculateSEO(text);

  const totalScore = storedScore?.total_score || Math.round(
    (metrics.readabilityScore * 0.25) +
    (metrics.keywordDensity * 0.25) +
    ((metrics.lengthOptimal ? 100 : 50) * 0.2) +
    ((metrics.ctaPresence ? 100 : 0) * 0.15) +
    ((metrics.emojiCount >= 1 && metrics.emojiCount <= 3 ? 100 : 50) * 0.15)
  );

  const handleRecalculate = async () => {
    if (!contentId) {
      toast({
        title: "Erreur",
        description: "Impossible de recalculer le score sans ID de contenu",
        variant: "destructive",
      });
      return;
    }

    try {
      await recalculateMutation.mutateAsync(contentId);
      toast({
        title: "Score recalculé",
        description: "Le score SEO a été mis à jour avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de recalculer le score",
        variant: "destructive",
      });
    }
  };
  
  const scoreColor = totalScore >= 80 ? 'text-green-600' : totalScore >= 60 ? 'text-orange-600' : 'text-red-600';
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">📊 SEO Health Score</CardTitle>
          <div className={`text-4xl font-bold ${scoreColor} mt-2`}>
            {totalScore}/100
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.wordCount} mots • {metrics.emojiCount} emoji{metrics.emojiCount > 1 ? 's' : ''}
          </p>
        </div>
        {contentId && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRecalculate}
            disabled={recalculateMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
            Recalculer
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ScoreItem
          label="Lisibilité"
          score={metrics.readabilityScore}
          target={100}
          icon={Eye}
        />
        <ScoreItem
          label="Mots-clés Random"
          score={metrics.keywordDensity}
          target={100}
          icon={Target}
        />
        <ScoreItem
          label="Longueur optimale"
          score={metrics.lengthOptimal ? 100 : 50}
          target={100}
          icon={Type}
        />
        <ScoreItem
          label="CTA présent"
          score={metrics.ctaPresence ? 100 : 0}
          target={100}
          icon={MousePointer}
        />
        
        <div className="pt-4 space-y-2 border-t">
          <p className="text-xs font-medium text-muted-foreground">Recommandations :</p>
          {!metrics.lengthOptimal && (
            <Badge variant="outline" className="text-xs">
              ⚠️ Viser 50-150 mots ({metrics.wordCount} actuellement)
            </Badge>
          )}
          {!metrics.ctaPresence && (
            <Badge variant="outline" className="text-xs">
              ⚠️ Ajouter un CTA clair (Rejoins, Découvre...)
            </Badge>
          )}
          {metrics.emojiCount === 0 && (
            <Badge variant="outline" className="text-xs">
              💡 Ajouter 1-3 emojis stratégiques
            </Badge>
          )}
          {metrics.emojiCount > 3 && (
            <Badge variant="outline" className="text-xs">
              ⚠️ Trop d'emojis ({metrics.emojiCount}), viser 1-3 max
            </Badge>
          )}
          {storedScore?.suggestions && storedScore.suggestions.length > 0 && (
            <div className="pt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Suggestions AI :</p>
              {storedScore.suggestions.map((suggestion, i) => (
                <Badge key={i} variant="secondary" className="text-xs block">
                  💡 {suggestion}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

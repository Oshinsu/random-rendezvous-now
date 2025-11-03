import { Eye, Target, Type, MousePointer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface SEOScoreCardProps {
  text: string;
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

export const SEOScoreCard = ({ text }: SEOScoreCardProps) => {
  const metrics = calculateSEO(text);
  
  // Calcul du score total
  const scores = [
    metrics.readabilityScore,
    metrics.keywordDensity,
    metrics.lengthOptimal ? 100 : 50,
    metrics.ctaPresence ? 100 : 0,
    metrics.emojiCount >= 1 && metrics.emojiCount <= 3 ? 100 : 50
  ];
  const totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  const scoreColor = totalScore >= 80 ? 'text-green-600' : totalScore >= 60 ? 'text-orange-600' : 'text-red-600';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">📊 Email Health Score</CardTitle>
        <div className={`text-4xl font-bold ${scoreColor}`}>
          {totalScore}/100
        </div>
        <p className="text-xs text-muted-foreground">
          {metrics.wordCount} mots • {metrics.emojiCount} emoji{metrics.emojiCount > 1 ? 's' : ''}
        </p>
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
        </div>
      </CardContent>
    </Card>
  );
};

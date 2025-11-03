import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ToneAnalysisCardProps {
  text: string;
  targetTone?: string;
}

interface ToneCheck {
  rule: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const analyzeTone = (text: string): ToneCheck[] => {
  const checks: ToneCheck[] = [];
  const textLower = text.toLowerCase();
  
  // Check tutoiement vs vouvoiement
  const hasTu = /\btu\b|\bton\b|\bta\b|\btes\b/.test(textLower);
  const hasVous = /\bvous\b|\bvotre\b|\bvos\b/.test(textLower);
  
  if (hasTu && !hasVous) {
    checks.push({
      rule: 'Tutoiement',
      status: 'pass',
      message: 'Tutoiement utilisé ✓'
    });
  } else if (hasVous) {
    checks.push({
      rule: 'Tutoiement',
      status: 'fail',
      message: 'Vouvoiement détecté - Utiliser "tu"'
    });
  } else {
    checks.push({
      rule: 'Tutoiement',
      status: 'warning',
      message: 'Ni tu ni vous - Ajouter du tutoiement'
    });
  }
  
  // Check longueur des phrases
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWords = sentences.reduce((acc, s) => {
    return acc + s.split(/\s+/).length;
  }, 0) / sentences.length;
  
  if (avgWords <= 20) {
    checks.push({
      rule: 'Phrases courtes',
      status: 'pass',
      message: `Phrases courtes (~${Math.round(avgWords)} mots/phrase) ✓`
    });
  } else {
    checks.push({
      rule: 'Phrases courtes',
      status: 'warning',
      message: `Phrases trop longues (~${Math.round(avgWords)} mots/phrase) - Viser < 20`
    });
  }
  
  // Check jargon corporate
  const corporateWords = ['optimiser', 'maximiser', 'valoriser', 'opportunité', 'excellence'];
  const hasCorporate = corporateWords.some(word => textLower.includes(word));
  
  if (!hasCorporate) {
    checks.push({
      rule: 'Zero jargon',
      status: 'pass',
      message: 'Pas de jargon corporate ✓'
    });
  } else {
    checks.push({
      rule: 'Zero jargon',
      status: 'fail',
      message: 'Jargon corporate détecté - Utiliser un langage naturel'
    });
  }
  
  // Check fausses urgences
  const urgencyWords = ['dernière chance', 'ne manquez pas', 'offre limitée', 'urgent'];
  const hasFakeUrgency = urgencyWords.some(word => textLower.includes(word));
  
  if (!hasFakeUrgency) {
    checks.push({
      rule: 'Pas de fausse urgence',
      status: 'pass',
      message: 'Pas de fausse urgence ✓'
    });
  } else {
    checks.push({
      rule: 'Pas de fausse urgence',
      status: 'fail',
      message: 'Fausse urgence détectée - Éviter la pression'
    });
  }
  
  // Check émotions positives
  const positiveWords = ['fun', 'cool', 'génial', 'top', 'sympa', 'chill'];
  const hasPositive = positiveWords.some(word => textLower.includes(word));
  
  if (hasPositive) {
    checks.push({
      rule: 'Émotions positives',
      status: 'pass',
      message: 'Ton positif et fun ✓'
    });
  } else {
    checks.push({
      rule: 'Émotions positives',
      status: 'warning',
      message: 'Ajouter des mots positifs (fun, cool, sympa...)'
    });
  }
  
  return checks;
};

export const ToneAnalysisCard = ({ text, targetTone = 'Gen Z, fun, spontané' }: ToneAnalysisCardProps) => {
  const checks = analyzeTone(text);
  const passCount = checks.filter(c => c.status === 'pass').length;
  const totalChecks = checks.length;
  const toneScore = Math.round((passCount / totalChecks) * 100);
  
  const getStatusIcon = (status: ToneCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };
  
  const getScoreColor = () => {
    if (toneScore >= 80) return 'text-green-600';
    if (toneScore >= 60) return 'text-orange-600';
    return 'text-red-600';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">🎯 Analyse de Ton</CardTitle>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-bold ${getScoreColor()}`}>
            {toneScore}%
          </span>
          <Badge variant="outline" className="text-xs">
            {targetTone}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
            {getStatusIcon(check.status)}
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{check.rule}</p>
              <p className="text-xs text-muted-foreground">{check.message}</p>
            </div>
          </div>
        ))}
        
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            {passCount}/{totalChecks} règles respectées
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

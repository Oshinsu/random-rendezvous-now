import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ModerationResult {
  isToxic: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  flags: string[];
  confidence: number;
}

interface MessageModerationPanelProps {
  message: {
    id: string;
    content: string;
    user_id: string;
  };
  onModerate: (action: 'approve' | 'reject' | 'review') => void;
}

export const MessageModerationPanel = ({ message, onModerate }: MessageModerationPanelProps) => {
  const [moderating, setModerating] = useState(false);
  const [result, setResult] = useState<ModerationResult | null>(null);

  const analyzeMessage = async () => {
    setModerating(true);
    
    // Simulate AI moderation (would call OpenAI Moderation API in production)
    await new Promise(r => setTimeout(r, 1000));
    
    // Basic keyword detection (placeholder for real AI)
    const content = message.content.toLowerCase();
    const toxicKeywords = ['spam', 'hate', 'abuse', 'scam'];
    const isToxic = toxicKeywords.some(kw => content.includes(kw));
    
    const positiveWords = ['great', 'awesome', 'thanks', 'love'];
    const negativeWords = ['bad', 'terrible', 'worst', 'hate'];
    
    const sentiment = positiveWords.some(w => content.includes(w)) ? 'positive' :
                      negativeWords.some(w => content.includes(w)) ? 'negative' : 'neutral';
    
    setResult({
      isToxic,
      sentiment,
      flags: isToxic ? ['potential_spam'] : [],
      confidence: 0.85 + Math.random() * 0.1
    });
    
    setModerating(false);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Content Moderation</h3>
        </div>
        {!result && (
          <Button onClick={analyzeMessage} disabled={moderating} size="sm">
            {moderating ? 'Analyzing...' : 'Analyze Content'}
          </Button>
        )}
      </div>

      <div className="p-3 bg-muted rounded-lg mb-4 text-sm">
        {message.content}
      </div>

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Safety Status</div>
              <Badge variant={result.isToxic ? 'destructive' : 'default'}>
                {result.isToxic ? '⚠️ Flagged' : '✓ Safe'}
              </Badge>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Sentiment</div>
              <div className="flex items-center gap-2">
                {getSentimentIcon(result.sentiment)}
                <span className="text-sm font-medium capitalize">{result.sentiment}</span>
              </div>
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <div className="text-xs text-muted-foreground mb-2">Analysis</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence</span>
                <span className="font-medium">{(result.confidence * 100).toFixed(1)}%</span>
              </div>
              {result.flags.length > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div className="flex flex-wrap gap-1">
                    {result.flags.map(flag => (
                      <Badge key={flag} variant="outline" className="text-xs">
                        {flag.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onModerate('approve')}
              className="flex-1"
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onModerate('review')}
              className="flex-1"
            >
              Review Later
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onModerate('reject')}
              className="flex-1"
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

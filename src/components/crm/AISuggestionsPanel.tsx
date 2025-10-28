import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { Sparkles, Target, Clock, Lightbulb, Loader2 } from 'lucide-react';

interface AISuggestionsPanelProps {
  segments: Array<{ id: string; segment_key: string; segment_name: string }>;
  onUseSuggestion: (suggestion: any) => void;
}

export const AISuggestionsPanel = ({ segments, onUseSuggestion }: AISuggestionsPanelProps) => {
  const [selectedSegmentKey, setSelectedSegmentKey] = useState('');
  const [error, setError] = useState(false);
  const { loading, suggestions, segmentName, fetchSuggestions } = useAISuggestions();

  const handleGenerate = async () => {
    if (!selectedSegmentKey) return;
    try {
      setError(false);
      await fetchSuggestions(selectedSegmentKey);
    } catch (err) {
      setError(true);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Suggestions IA</CardTitle>
          </div>
          <CardDescription>
            Notre IA génère des idées de campagnes innovantes adaptées à chaque segment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedSegmentKey} onValueChange={setSelectedSegmentKey}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choisir un segment" />
              </SelectTrigger>
              <SelectContent>
                {segments.map(seg => (
                  <SelectItem key={seg.id} value={seg.segment_key}>
                    {seg.segment_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleGenerate}
              disabled={!selectedSegmentKey || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer
                </>
              )}
            </Button>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Suggestions pour {segmentName}
                </h3>
                <Badge variant="secondary">{suggestions.length} idées</Badge>
              </div>

              <div className="grid gap-3">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="hover:border-primary transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{suggestion.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          <Target className="h-3 w-3 mr-1" />
                          {suggestion.objective}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {suggestion.subject}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {suggestion.timing}
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                        <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5" />
                        <p className="text-sm">{suggestion.hook}</p>
                      </div>

                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => onUseSuggestion({
                          campaign_name: suggestion.name,
                          subject: suggestion.subject,
                          content: `<h2>${suggestion.name}</h2>\n<p>${suggestion.hook}</p>\n\n<!-- TODO: Compléter le contenu -->`,
                          target_segment_id: segments.find(s => s.segment_key === selectedSegmentKey)?.id
                        })}
                      >
                        Utiliser cette idée
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-amber-600">
              <p className="text-sm">Service IA temporairement indisponible. Utilisez les templates standards.</p>
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && selectedSegmentKey && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Cliquez sur "Générer" pour obtenir des suggestions IA</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
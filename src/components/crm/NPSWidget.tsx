import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown, Meh } from 'lucide-react';

interface NPSWidgetProps {
  groupId?: string;
  barName?: string;
  onComplete?: () => void;
}

export const NPSWidget = ({ groupId, barName, onComplete }: NPSWidgetProps) => {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (score === null) {
      toast.error("Veuillez sélectionner une note");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      await supabase.from('crm_user_feedback').insert({
        user_id: user.id,
        group_id: groupId,
        feedback_type: 'nps',
        rating: score,
        feedback_text: feedback,
        context: { bar_name: barName }
      });

      toast.success("Votre avis nous aide à améliorer Random");

      onComplete?.();
    } catch (error) {
      console.error('Error submitting NPS:', error);
      toast.error("Impossible d'envoyer votre avis");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comment était votre expérience ?</CardTitle>
        <CardDescription>
          Recommanderiez-vous Random à un ami ?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant={score === 0 ? 'default' : 'outline'}
            className="h-24 flex-col"
            onClick={() => setScore(0)}
          >
            <ThumbsDown className="h-8 w-8 mb-2" />
            <span>Pas satisfait</span>
          </Button>
          <Button
            variant={score === 5 ? 'default' : 'outline'}
            className="h-24 flex-col"
            onClick={() => setScore(5)}
          >
            <Meh className="h-8 w-8 mb-2" />
            <span>Neutre</span>
          </Button>
          <Button
            variant={score === 10 ? 'default' : 'outline'}
            className="h-24 flex-col"
            onClick={() => setScore(10)}
          >
            <ThumbsUp className="h-8 w-8 mb-2" />
            <span>Très satisfait</span>
          </Button>
        </div>

        <div className="space-y-2">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Dites-nous en plus (optionnel)..."
            className="min-h-[100px]"
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || score === null}
          className="w-full"
        >
          {isSubmitting ? 'Envoi...' : 'Envoyer mon avis'}
        </Button>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeedbackManagement } from '@/hooks/useFeedbackManagement';
import { MessageSquare, Bug, Lightbulb, Star, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const FeedbackPanel = () => {
  const { feedbacks, stats, loading, resolveFeedback } = useFeedbackManagement(false);

  const handleResolve = async (feedbackId: string) => {
    try {
      await resolveFeedback(feedbackId);
      toast({
        title: 'Feedback résolu',
        description: 'Le feedback a été marqué comme traité'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de résoudre le feedback',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  const npsScore = stats.avgRating;
  const npsCategory = npsScore >= 9 ? 'Promoteurs' : npsScore >= 7 ? 'Passifs' : 'Détracteurs';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalFeedbacks}</p>
              <p className="text-sm text-muted-foreground">Total Feedbacks</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{npsScore.toFixed(1)}/10</p>
              <p className="text-sm text-muted-foreground">Score NPS</p>
              <Badge variant="secondary" className="mt-1">{npsCategory}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Bug className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.bugReportsCount}</p>
              <p className="text-sm text-muted-foreground">Bug Reports</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.featureRequestsCount}</p>
              <p className="text-sm text-muted-foreground">Feature Requests</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedbacks Récents</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="nps">NPS</TabsTrigger>
              <TabsTrigger value="bug">Bugs</TabsTrigger>
              <TabsTrigger value="feature_request">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {feedbacks.slice(0, 10).map(feedback => (
                <div key={feedback.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">
                        {feedback.profile?.first_name} {feedback.profile?.last_name}
                      </p>
                      <Badge variant="outline">{feedback.feedback_type}</Badge>
                      {feedback.rating && (
                        <Badge variant="secondary">⭐ {feedback.rating}/10</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {feedback.profile?.email}
                    </p>
                    {feedback.feedback_text && (
                      <p className="text-sm">{feedback.feedback_text}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(feedback.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  {!feedback.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(feedback.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Résoudre
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="nps" className="space-y-3 mt-4">
              {feedbacks
                .filter(f => f.feedback_type === 'nps')
                .slice(0, 10)
                .map(feedback => (
                  <div key={feedback.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">
                          {feedback.profile?.first_name} {feedback.profile?.last_name}
                        </p>
                        {feedback.rating && (
                          <Badge variant="secondary">⭐ {feedback.rating}/10</Badge>
                        )}
                      </div>
                      {feedback.feedback_text && (
                        <p className="text-sm">{feedback.feedback_text}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(feedback.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="bug">
              <p className="text-muted-foreground text-center py-8">
                Aucun bug report pour le moment
              </p>
            </TabsContent>

            <TabsContent value="feature_request">
              <p className="text-muted-foreground text-center py-8">
                Aucune feature request pour le moment
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

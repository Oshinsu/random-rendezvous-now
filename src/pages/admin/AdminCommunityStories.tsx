import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Story {
  id: string;
  user_id: string;
  story_type: string;
  content: string | null;
  media_url: string | null;
  city: string | null;
  status: string;
  likes_count: number;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export default function AdminCommunityStories() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: stories, isLoading, refetch } = useQuery({
    queryKey: ['admin-community-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profiles
      if (data) {
        const userIds = [...new Set(data.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

        return data.map(story => ({
          ...story,
          profiles: profilesMap.get(story.user_id)
        }));
      }

      return [];
    },
  });

  const handleModerate = async (storyId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase.functions.invoke('moderate-story', {
        body: {
          story_id: storyId,
          action,
          rejection_reason: action === 'reject' ? rejectionReason : undefined,
        },
      });

      if (error) throw error;

      toast.success(action === 'approve' ? '✅ Story approuvée (+50 crédits)' : '❌ Story rejetée');
      setSelectedStory(null);
      setRejectionReason('');
      refetch();
    } catch (error) {
      console.error('Error moderating story:', error);
      toast.error('Erreur lors de la modération');
    }
  };

  const pendingStories = stories?.filter(s => s.status === 'pending') || [];
  const approvedStories = stories?.filter(s => s.status === 'approved') || [];
  const rejectedStories = stories?.filter(s => s.status === 'rejected') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Community Stories
        </h1>
        <p className="text-muted-foreground">
          Modération des stories soumises par les utilisateurs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingStories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedStories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
            <XCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedStories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Stories */}
      <Card>
        <CardHeader>
          <CardTitle>Stories en attente de modération</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : pendingStories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune story en attente
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingStories.map((story) => (
                <Card key={story.id} className="overflow-hidden">
                  {story.media_url && (
                    <div className="aspect-video relative bg-muted">
                      {story.story_type === 'video' ? (
                        <video src={story.media_url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={story.media_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <CardContent className="p-4 space-y-3">
                    {story.content && (
                      <p className="text-sm line-clamp-3">{story.content}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{story.profiles?.first_name} {story.profiles?.last_name}</span>
                      {story.city && <Badge variant="outline">{story.city}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStory(story)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleModerate(story.id, 'approve')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approuver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Story Detail Modal */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modération de la story</DialogTitle>
            <DialogDescription>
              Soumise par {selectedStory?.profiles?.first_name} {selectedStory?.profiles?.last_name} ({selectedStory?.profiles?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedStory?.media_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                {selectedStory.story_type === 'video' ? (
                  <video src={selectedStory.media_url} controls className="w-full h-full" />
                ) : (
                  <img src={selectedStory.media_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            {selectedStory?.content && (
              <div>
                <Label>Contenu</Label>
                <p className="text-sm mt-2">{selectedStory.content}</p>
              </div>
            )}

            <div className="flex gap-2">
              {selectedStory?.city && <Badge>{selectedStory.city}</Badge>}
              <Badge variant="outline">{selectedStory?.story_type}</Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection">Raison du rejet (optionnel)</Label>
              <Textarea
                id="rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi cette story est rejetée..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => selectedStory && handleModerate(selectedStory.id, 'reject')}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
              <Button
                onClick={() => selectedStory && handleModerate(selectedStory.id, 'approve')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approuver (+50 crédits)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

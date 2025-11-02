import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChatbotAnalytics } from '@/hooks/useChatbotAnalytics';
import { MessageSquare, DollarSign, ThumbsUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ChatbotAnalyticsDashboard = () => {
  const { conversations, stats, loading } = useChatbotAnalytics();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Conversations</span>
          </div>
          <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Tokens</span>
          </div>
          <div className="text-2xl font-bold">{stats?.totalTokens.toLocaleString() || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Avg: {Math.round(stats?.avgTokensPerConversation || 0)}/conv
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Cost</span>
          </div>
          <div className="text-2xl font-bold">${stats?.totalCost.toFixed(2) || '0.00'}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Avg: ${stats?.avgCostPerConversation.toFixed(3) || '0.000'}/conv
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Satisfaction</span>
          </div>
          <div className="text-2xl font-bold">
            {stats?.avgSatisfaction ? `${stats.avgSatisfaction.toFixed(1)}/5` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {'⭐'.repeat(Math.round(stats?.avgSatisfaction || 0))}
          </div>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Conversations</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {conversations.map((conv) => (
            <div 
              key={conv.id}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{conv.total_messages} messages</Badge>
                    <Badge variant="secondary">{conv.total_tokens} tokens</Badge>
                    {conv.satisfaction_rating && (
                      <Badge variant="default">
                        {'⭐'.repeat(conv.satisfaction_rating)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">${conv.cost_usd.toFixed(3)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.started_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              {conv.context_used && (
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                  Context: {conv.context_used}
                </div>
              )}
              
              {conv.messages && conv.messages.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Last message: {conv.messages[conv.messages.length - 1]?.content?.substring(0, 100)}...
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

import { Sparkles, RefreshCw, Rocket, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CMSHeaderProps {
  onRefresh: () => void;
  onAIAnalyze?: () => void;
  onPublish?: () => void;
}

export const CMSHeader = ({ onRefresh, onAIAnalyze, onPublish }: CMSHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Random Copy Studio
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Copywriting AI pour Gen Z • Optimisé conversion
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {onAIAnalyze && (
          <Button 
            variant="outline" 
            onClick={onAIAnalyze}
            size="sm"
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Analyser avec AI</span>
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onRefresh}
          className="flex items-center gap-2"
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
        {onPublish && (
          <Button 
            onClick={onPublish} 
            className="flex items-center gap-2" 
            size="sm"
          >
            <Rocket className="h-4 w-4" />
            <span className="hidden sm:inline">Publier</span>
          </Button>
        )}
      </div>
    </div>
  );
};
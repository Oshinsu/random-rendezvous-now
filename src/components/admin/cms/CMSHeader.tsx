import { Edit3, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CMSHeaderProps {
  onRefresh: () => void;
  onNew?: () => void;
}

export const CMSHeader = ({ onRefresh, onNew }: CMSHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <Edit3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <span className="hidden sm:inline">Gestion de Contenu</span>
          <span className="sm:hidden">CMS</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Éditeur de contenu avec prévisualisation en temps réel
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          className="flex items-center gap-2"
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
        {onNew && (
          <Button onClick={onNew} className="flex items-center gap-2" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau</span>
            <span className="sm:hidden">+</span>
          </Button>
        )}
      </div>
    </div>
  );
};
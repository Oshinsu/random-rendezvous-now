import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, RotateCcw } from "lucide-react";

interface ContentVersion {
  id: string;
  version: number;
  updated_at: string;
  updated_by: string;
  changes: string;
}

interface ContentVersionTimelineProps {
  versions: ContentVersion[];
  onRevert: (versionId: string) => void;
}

export const ContentVersionTimeline = ({ versions, onRevert }: ContentVersionTimelineProps) => {
  if (!versions || versions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun historique de versions disponible
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version, index) => (
        <Card key={version.id} className={index === 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>
                    v{version.version}
                  </Badge>
                  {index === 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      Version actuelle
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(version.updated_at).toLocaleString('fr-FR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {version.updated_by}
                  </span>
                </div>
                <p className="text-sm">{version.changes}</p>
              </div>
              {index !== 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRevert(version.id)}
                  className="ml-4"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restaurer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

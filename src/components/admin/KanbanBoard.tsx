import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  [key: string]: any;
}

interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
  color: string;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onItemClick?: (item: KanbanItem) => void;
}

export const KanbanBoard = ({ columns, onItemClick }: KanbanBoardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <Card key={column.id} className={`border-2 ${column.color}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>{column.title}</span>
              <Badge variant="outline" className="ml-2">
                {column.items.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {column.items.map((item) => (
                  <Card
                    key={item.id}
                    className="p-3 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-red-500"
                    onClick={() => onItemClick?.(item)}
                  >
                    <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground mb-2">{item.subtitle}</p>
                    )}
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Card>
                ))}
                {column.items.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Aucun élément
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

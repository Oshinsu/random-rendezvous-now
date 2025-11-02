import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Download, Tag, Ban } from 'lucide-react';

interface BatchActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onExport: () => void;
  onAddToSegment: () => void;
  onSuspend: () => void;
  isProcessing: boolean;
}

export const BatchActions = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onExport,
  onAddToSegment,
  onSuspend,
  isProcessing,
}: BatchActionsProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-accent rounded-lg border">
      <Checkbox
        checked={selectedCount === totalCount}
        onCheckedChange={onSelectAll}
      />
      <span className="text-sm font-medium">
        {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
      </span>

      <div className="flex gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isProcessing}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddToSegment}
          disabled={isProcessing}
        >
          <Tag className="mr-2 h-4 w-4" />
          Add to Segment
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onSuspend}
          disabled={isProcessing}
        >
          <Ban className="mr-2 h-4 w-4" />
          Suspend
        </Button>
      </div>
    </div>
  );
};

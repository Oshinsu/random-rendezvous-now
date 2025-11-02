import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Trash2, Eye } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Block {
  id: string;
  type: 'hero' | 'benefits' | 'cta' | 'text' | 'image';
  content: Record<string, any>;
}

interface SortableBlockProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (id: string) => void;
}

const SortableBlock = ({ block, onEdit, onDelete }: SortableBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'hero': return '🎯';
      case 'benefits': return '✨';
      case 'cta': return '🚀';
      case 'text': return '📝';
      case 'image': return '🖼️';
      default: return '📦';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <Card className="p-4 mb-2 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <button
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{getBlockIcon(block.type)}</span>
              <Badge variant="outline">{block.type}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {block.content.title || block.content.text || 'Empty block'}
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(block)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(block.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const BlockEditor = () => {
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: '1',
      type: 'hero',
      content: { title: 'Welcome to Random', subtitle: 'Connect with locals' }
    },
    {
      id: '2',
      type: 'benefits',
      content: { title: 'Why Random?', items: ['Authentic', 'Local', 'Fun'] }
    }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: {}
    };
    setBlocks([...blocks, newBlock]);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Page Builder</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => addBlock('hero')}>
            <Plus className="h-4 w-4 mr-1" /> Hero
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock('benefits')}>
            <Plus className="h-4 w-4 mr-1" /> Benefits
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock('cta')}>
            <Plus className="h-4 w-4 mr-1" /> CTA
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock('text')}>
            <Plus className="h-4 w-4 mr-1" /> Text
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock('image')}>
            <Plus className="h-4 w-4 mr-1" /> Image
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              onEdit={(b) => console.log('Edit', b)}
              onDelete={deleteBlock}
            />
          ))}
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No blocks yet. Add your first block!</p>
          <Button onClick={() => addBlock('hero')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hero Block
          </Button>
        </Card>
      )}
    </div>
  );
};

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Edit, Check, X, Type, Image as ImageIcon, Code, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteContent } from '@/contexts/SiteContentContext';

interface ContentEditCardProps {
  content: SiteContent;
  onUpdate: (id: string, value: any) => Promise<boolean>;
}

export const ContentEditCard = ({ content, onUpdate }: ContentEditCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content.content_value);
  const [isLoading, setIsLoading] = useState(false);

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4 text-green-600" />;
      case 'image':
        return <ImageIcon className="h-4 w-4 text-blue-600" />;
      case 'html':
        return <Code className="h-4 w-4 text-purple-600" />;
      case 'json':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'border-l-green-500';
      case 'image':
        return 'border-l-blue-500';
      case 'html':
        return 'border-l-purple-500';
      case 'json':
        return 'border-l-orange-500';
      default:
        return 'border-l-neutral-500';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    const success = await onUpdate(content.id, value);
    setIsLoading(false);
    
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setValue(content.content_value);
    setIsEditing(false);
  };

  const getCharacterCount = () => {
    if (typeof value === 'string') {
      return value.length;
    }
    return JSON.stringify(value).length;
  };

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md border-l-4',
        getBorderColor(content.content_type)
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {getContentTypeIcon(content.content_type)}
            <CardTitle className="text-sm font-medium">
              {content.content_key.replace(/_/g, ' ')}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {content.content_type}
            </Badge>
            {!isEditing ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {content.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {content.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-2">
            {content.content_type === 'text' ? (
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={4}
                className="font-mono text-sm"
                disabled={isLoading}
              />
            ) : content.content_type === 'image' ? (
              <Input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="URL de l'image"
                className="font-mono text-sm"
                disabled={isLoading}
              />
            ) : content.content_type === 'html' ? (
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={6}
                className="font-mono text-xs"
                disabled={isLoading}
              />
            ) : (
              <Textarea
                value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    setValue(JSON.parse(e.target.value));
                  } catch {
                    setValue(e.target.value);
                  }
                }}
                rows={6}
                className="font-mono text-xs"
                disabled={isLoading}
              />
            )}
            {content.content_type === 'text' && (
              <div className="text-xs text-muted-foreground text-right">
                {getCharacterCount()} caractères
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {content.content_type === 'image' ? (
              <div className="space-y-2">
                <img
                  src={value}
                  alt={content.content_key}
                  className="w-full h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Image+Error';
                  }}
                />
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {value}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground line-clamp-3">
                {typeof value === 'string' ? value : JSON.stringify(value)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

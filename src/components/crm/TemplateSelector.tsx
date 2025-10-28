import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { campaignTemplates, getTemplatesBySegment, CampaignTemplate } from '@/data/campaignTemplateLibrary';
import { Sparkles, Clock, Repeat, Gift } from 'lucide-react';

interface TemplateSelectorProps {
  segments: Array<{ id: string; segment_key: string; segment_name: string }>;
  onSelectTemplate: (template: CampaignTemplate) => void;
}

export const TemplateSelector = ({ segments, onSelectTemplate }: TemplateSelectorProps) => {
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  
  const filteredTemplates = selectedSegment 
    ? getTemplatesBySegment(selectedSegment)
    : campaignTemplates;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les segments</SelectItem>
              {segments.map(seg => (
                <SelectItem key={seg.id} value={seg.segment_key}>
                  {seg.segment_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredTemplates.length} templates
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <CardDescription className="text-sm line-clamp-1">
                {template.subject}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {template.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.is_recurring && (
                  <Badge variant="secondary" className="text-xs">
                    <Repeat className="h-3 w-3 mr-1" />
                    Récurrent
                  </Badge>
                )}
                {template.tags.includes('incentive') && (
                  <Badge variant="default" className="text-xs bg-green-500">
                    <Gift className="h-3 w-3 mr-1" />
                    Promo
                  </Badge>
                )}
              </div>
              
              {template.delay_hours && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Envoi après {template.delay_hours}h
                </div>
              )}

              <Button 
                size="sm" 
                className="w-full"
                onClick={() => onSelectTemplate(template)}
              >
                Utiliser ce template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun template disponible pour ce segment
        </div>
      )}
    </div>
  );
};
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, MoveVertical, Clock } from 'lucide-react';

interface SequenceStep {
  campaign_id: string;
  delay_hours: number;
}

interface SequenceBuilderProps {
  campaigns: Array<{ id: string; campaign_name: string }>;
  segments: Array<{ id: string; segment_name: string }>;
  onSave: (sequence: any) => void;
}

export const SequenceBuilder = ({ campaigns, segments, onSave }: SequenceBuilderProps) => {
  const [sequenceName, setSequenceName] = useState('');
  const [targetSegmentId, setTargetSegmentId] = useState('');
  const [steps, setSteps] = useState<SequenceStep[]>([
    { campaign_id: '', delay_hours: 0 },
    { campaign_id: '', delay_hours: 24 }
  ]);

  const addStep = () => {
    setSteps([...steps, { campaign_id: '', delay_hours: 48 }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 2) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSave = () => {
    if (!sequenceName || !targetSegmentId || steps.some(s => !s.campaign_id)) {
      return;
    }

    onSave({
      sequence_name: sequenceName,
      target_segment_id: targetSegmentId,
      trigger_type: 'segment',
      steps
    });

    // Reset form
    setSequenceName('');
    setTargetSegmentId('');
    setSteps([
      { campaign_id: '', delay_hours: 0 },
      { campaign_id: '', delay_hours: 24 }
    ]);
  };

  const isValid = sequenceName && targetSegmentId && steps.length >= 2 && steps.every(s => s.campaign_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer une séquence multi-étapes</CardTitle>
        <CardDescription>
          Les utilisateurs recevront automatiquement une série de campagnes espacées dans le temps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nom de la séquence</Label>
            <Input
              value={sequenceName}
              onChange={(e) => setSequenceName(e.target.value)}
              placeholder="Ex: Onboarding nouveaux utilisateurs"
            />
          </div>
          <div>
            <Label>Segment cible</Label>
            <Select value={targetSegmentId} onValueChange={setTargetSegmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un segment" />
              </SelectTrigger>
              <SelectContent>
                {segments.map(seg => (
                  <SelectItem key={seg.id} value={seg.id}>
                    {seg.segment_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Étapes de la séquence</Label>
            <Badge variant="secondary">{steps.length} étapes</Badge>
          </div>

          {steps.map((step, index) => (
            <Card key={index} className="relative">
              <CardContent className="pt-6">
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-primary text-primary-foreground">
                    Étape {index + 1}
                  </Badge>
                </div>

                <div className="grid grid-cols-[1fr,auto,auto] gap-4 items-end">
                  <div>
                    <Label>Campagne</Label>
                    <Select 
                      value={step.campaign_id}
                      onValueChange={(v) => updateStep(index, 'campaign_id', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une campagne" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map(campaign => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.campaign_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-32">
                    <Label>Délai (heures)</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        value={step.delay_hours}
                        onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(index)}
                    disabled={steps.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <MoveVertical className="h-3 w-3" />
                    Puis attendre {steps[index + 1].delay_hours - step.delay_hours}h
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={addStep} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une étape
          </Button>
          <Button onClick={handleSave} disabled={!isValid} className="flex-1">
            Créer la séquence
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TemplateSelector } from './TemplateSelector';
import { CampaignTemplate } from '@/data/campaignTemplateLibrary';
import { Zap, Edit } from 'lucide-react';

interface QuickCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  segments: Array<{ id: string; segment_key: string; segment_name: string }>;
  campaigns?: any[];
  onCreateCampaign: (campaign: any) => void;
}

export const QuickCampaignModal = ({
  open,
  onOpenChange,
  initialDate,
  segments,
  campaigns,
  onCreateCampaign
}: QuickCampaignModalProps) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');
  const [formData, setFormData] = useState({
    campaign_name: '',
    subject: '',
    content: '',
    target_segment_id: '',
    send_at: initialDate?.toISOString().slice(0, 16) || '',
    channels: ['email']
  });

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setFormData({
      ...formData,
      campaign_name: template.name,
      subject: template.subject,
      content: template.html_content,
      target_segment_id: segments.find(s => s.segment_key === template.segment_key)?.id || ''
    });
    setActiveTab('custom');
  };

  const handleSubmit = () => {
    onCreateCampaign({
      ...formData,
      campaign_type: 'email',
      trigger_type: 'manual',
      status: 'scheduled'
    });
    onOpenChange(false);
  };

  // ✅ Validation complète du formulaire
  const isFormValid = 
    formData.campaign_name.trim() !== '' && 
    formData.subject.trim() !== '' && 
    formData.content.trim() !== '' &&
    formData.target_segment_id !== '' &&  // ✅ Segment obligatoire
    formData.send_at !== '' &&  // ✅ Date obligatoire
    new Date(formData.send_at) > new Date();  // ✅ Date dans le futur

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une campagne rapide</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">
              <Zap className="h-4 w-4 mr-2" />
              Depuis un template
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Edit className="h-4 w-4 mr-2" />
              Personnalisé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            <TemplateSelector 
              segments={segments}
              onSelectTemplate={handleTemplateSelect}
            />
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Nom de la campagne</Label>
                <Input
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  placeholder="Ex: Bienvenue nouveaux utilisateurs"
                />
              </div>

              <div>
                <Label>Segment cible</Label>
                <Select 
                  value={formData.target_segment_id}
                  onValueChange={(v) => setFormData({ ...formData, target_segment_id: v })}
                >
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

              <div>
                <Label>Objet</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Objet de l'email"
                />
              </div>

              <div>
                <Label>Date et heure d'envoi</Label>
                <Input
                  type="datetime-local"
                  value={formData.send_at}
                  onChange={(e) => setFormData({ ...formData, send_at: e.target.value })}
                />
              </div>

              <div>
                <Label>Contenu</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Contenu de l'email..."
                  rows={6}
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={!isFormValid}
                title={!isFormValid ? 'Veuillez remplir tous les champs et choisir une date future' : ''}
              >
                Créer la campagne
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
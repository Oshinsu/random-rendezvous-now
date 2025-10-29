import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Mail, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export const EmptyBarOwnersState = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleInvite = () => {
    // Generate mailto link
    const subject = encodeURIComponent('Rejoignez Random en tant que bar partenaire 🍸');
    const defaultMessage = `Bonjour,

Nous aimerions vous inviter à rejoindre Random, la plateforme qui connecte les bars avec des groupes d'aventuriers prêts à découvrir de nouveaux lieux !

En devenant partenaire, vous bénéficierez de :
✅ Visibilité accrue auprès d'une communauté engagée
✅ Groupes confirmés directement dans votre établissement
✅ Dashboard dédié pour gérer vos réservations
✅ 30 jours d'essai gratuit

Pour candidater, rendez-vous sur : ${window.location.origin}/bar-application

À très bientôt,
L'équipe Random`;

    const body = encodeURIComponent(message || defaultMessage);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    
    toast({
      title: "Email généré",
      description: "Votre client email va s'ouvrir avec le message pré-rempli",
    });
    
    setShowInviteModal(false);
    setEmail('');
    setMessage('');
  };

  return (
    <>
      <Card className="p-12 text-center bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-red-200">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-center">
            <Building className="h-24 w-24 text-red-400 animate-pulse" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-red-900 mb-2">
              Aucun gérant partenaire pour l'instant 🍸
            </h3>
            <p className="text-red-700">
              Invitez des bars à rejoindre Random et commencez à recevoir des groupes !
            </p>
          </div>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              <Mail className="mr-2 h-5 w-5" />
              Inviter un gérant
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.open('/bar-application', '_blank')}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Voir le formulaire
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inviter un gérant de bar</DialogTitle>
            <DialogDescription>
              Envoyez une invitation personnalisée par email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email du gérant</label>
              <Input
                type="email"
                placeholder="contact@bar-exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message personnalisé (optionnel)</label>
              <Textarea
                placeholder="Laissez vide pour utiliser le message par défaut..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleInvite} disabled={!email}>
                Générer l'email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
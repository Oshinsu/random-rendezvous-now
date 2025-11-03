import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Chrome, Compass } from 'lucide-react';

interface PushBrowserHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PushBrowserHelp = ({ isOpen, onClose }: PushBrowserHelpProps) => {
  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return {
        icon: Chrome,
        name: 'Chrome',
        steps: [
          'Clique sur le cadenas 🔒 dans la barre d\'adresse',
          'Cherche "Notifications" dans les paramètres du site',
          'Sélectionne "Autoriser"',
          'Recharge la page (F5 ou Cmd+R)'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        icon: Compass,
        name: 'Firefox',
        steps: [
          'Clique sur l\'icône ⓘ ou 🔒 dans la barre d\'adresse',
          'Va dans "Permissions" → "Recevoir des notifications"',
          'Sélectionne "Autoriser"',
          'Recharge la page'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        icon: Compass,
        name: 'Safari',
        steps: [
          'Menu Safari → Réglages pour ce site web',
          'Cherche "Notifications"',
          'Sélectionne "Autoriser"',
          'Recharge la page'
        ]
      };
    }
    
    return {
      icon: AlertCircle,
      name: 'Ton navigateur',
      steps: [
        'Clique sur l\'icône de sécurité dans la barre d\'adresse',
        'Cherche les paramètres de notifications',
        'Autorise les notifications pour ce site',
        'Recharge la page'
      ]
    };
  };

  const instructions = getBrowserInstructions();
  const BrowserIcon = instructions.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Notifications bloquées
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          <p>Les notifications ont été bloquées par ton navigateur.</p>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <BrowserIcon className="h-4 w-4" />
              <span>Pour les réactiver dans {instructions.name} :</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
          
          <p className="text-xs text-muted-foreground">
            C'est une sécurité du navigateur, on ne peut pas contourner ça 🙏
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          J'ai compris
        </Button>
      </DialogContent>
    </Dialog>
  );
};

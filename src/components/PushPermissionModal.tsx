import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { BellRing, Sparkles } from 'lucide-react';

interface PushPermissionModalProps {
  trigger: 'first_group' | 'group_confirmed' | 'first_visit';
  onClose?: () => void;
}

/**
 * PHASE 5: CONTEXTUALIZED PERMISSION REQUEST
 * 
 * Research SOTA 2025:
 * - Demande immédiate sans contexte: ~15% acceptance
 * - Demande après 1ère action (création groupe): ~45% acceptance (+200%)
 * - Demande avec value proposition claire: ~60% acceptance (+300%)
 * 
 * Source: Braze, MoEngage best practices October 2025
 */
export const PushPermissionModal = ({ trigger, onClose }: PushPermissionModalProps) => {
  const { requestPermission, isEnabled } = usePushNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Copy selon contexte (Random tone of voice - Gen Z)
  const COPY = {
    first_group: {
      title: '🔔 On te prévient quand c\'est prêt ?',
      body: 'Reçois une notif dès qu\'on a trouvé 5 personnes et un bar. Promis, pas de spam 🙏',
      cta: 'Oui, me notifier',
      image: '/notif-group-forming.png',
    },
    group_confirmed: {
      title: '🎉 Reste au courant de tes groupes',
      body: 'Une notif quand ton groupe est confirmé. Tu peux désactiver quand tu veux.',
      cta: 'Let\'s go',
      image: '/notif-bar-assigned.png',
    },
    first_visit: {
      title: '🎲 Ne rate jamais une sortie Random',
      body: 'Sois notifié·e quand ton groupe se forme et qu\'un bar est trouvé. Que l\'essentiel 🔥',
      cta: 'Activer',
      image: '/notif-welcome.png',
    },
  };

  const copy = COPY[trigger];

  useEffect(() => {
    // Check if permission already asked (localStorage)
    const permissionAsked = localStorage.getItem('push_permission_asked');
    
    // ✅ VÉRIFICATION DIRECTE DU NAVIGATEUR (pas juste le hook)
    const browserPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    
    // Don't show if browser already granted OR already asked OR hook says enabled
    if (browserPermission === 'granted' || permissionAsked === 'true' || isEnabled) {
      console.log('🔕 Modal NOT shown:', { browserPermission, permissionAsked, isEnabled });
      setIsOpen(false);
      return;
    }

    // Show modal after delay (better UX)
    const timer = setTimeout(() => {
      // ✅ Double-check avant d'ouvrir (race condition)
      const recheckAsked = localStorage.getItem('push_permission_asked');
      const recheckBrowser = typeof Notification !== 'undefined' ? Notification.permission : 'default';
      
      if (recheckBrowser !== 'granted' && recheckAsked !== 'true') {
        console.log('🔔 Opening permission modal');
        setIsOpen(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []); // ❗ PAS de dépendances - s'exécute qu'une seule fois

  const handleAccept = async () => {
    // ✅ Vérifier si déjà bloqué dans le navigateur
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      // Si bloqué, pas besoin de réessayer - juste marquer comme asked
      localStorage.setItem('push_permission_asked', 'true');
      localStorage.setItem('push_permission_result', 'denied');
      setIsOpen(false);
      onClose?.();
      return;
    }

    await requestPermission();
    
    // Track acceptance (analytics)
    localStorage.setItem('push_permission_asked', 'true');
    localStorage.setItem('push_permission_result', 'requested');
    localStorage.setItem('push_permission_trigger', trigger);
    
    setIsOpen(false);
    onClose?.();
  };

  const handleDismiss = () => {
    // Track dismissal
    localStorage.setItem('push_permission_asked', 'true');
    localStorage.setItem('push_permission_result', 'dismissed');
    localStorage.setItem('push_permission_trigger', trigger);
    
    setIsOpen(false);
    onClose?.();
  };

  // Don't render if already enabled OR browser granted
  const browserPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
  if (isEnabled || browserPermission === 'granted') return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Image contextuelle - ✅ SANS MARGES NÉGATIVES */}
        <div className="relative w-full h-40 overflow-hidden">
          <img 
            src={copy.image} 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>

        {/* ✅ CONTENU AVEC PADDING PROPRE */}
        <div className="px-6 pb-6 pt-2">
          <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl flex items-center gap-2">
            <BellRing className="h-5 w-5 text-brand-500 animate-pulse" />
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {copy.body}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits list */}
        <div className="space-y-2 py-4">
          <div className="flex items-start gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
            <span>Sois prévenu·e en temps réel</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
            <span>Ne rate plus jamais ton bar</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
            <span>Désactive quand tu veux</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleDismiss}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Pas maintenant
          </Button>
          <Button 
            onClick={handleAccept} 
            className="w-full sm:w-auto bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-lg order-1 sm:order-2"
          >
            {copy.cta}
          </Button>
        </DialogFooter>

          {/* Privacy note - ton Random */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            On respecte ta vie privée. Zéro spam, promis 🙏
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

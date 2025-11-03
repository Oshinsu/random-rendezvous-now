import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NotificationTypeConfig } from '@/hooks/useNotificationTypesConfig';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NotificationTestSendProps {
  notification: NotificationTypeConfig;
  currentCopy: { title: string; body: string };
}

export const NotificationTestSend = ({ notification, currentCopy }: NotificationTestSendProps) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [variables, setVariables] = useState({
    first_name: 'Alex',
    bar_name: 'Le Perchoir',
    time: '19h30',
    count: '4',
  });

  const handleSendTest = async () => {
    if (!recipientEmail) {
      toast.error('❌ Email requis');
      return;
    }

    setIsSending(true);
    setSent(false);

    try {
      // Récupérer l'user par email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail)
        .maybeSingle();

      if (!profile) {
        toast.error('❌ Utilisateur introuvable');
        return;
      }

      // Remplacer les variables dans le copy
      let finalTitle = currentCopy.title;
      let finalBody = currentCopy.body;
      
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        finalTitle = finalTitle.replace(new RegExp(placeholder, 'g'), value);
        finalBody = finalBody.replace(new RegExp(placeholder, 'g'), value);
      });

      // Appeler l'edge function send-push-notification en mode test
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: profile.id,
          title: finalTitle,
          body: finalBody,
          type: notification.type_key,
          test_mode: true,
          send_email: sendEmail,
        },
      });

      if (error) throw error;

      setSent(true);
      toast.success('✅ Notification test envoyée !');
    } catch (error) {
      console.error('Error sending test:', error);
      toast.error('❌ Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Send className="h-4 w-4" />
          Envoyer un Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="recipient">Email du destinataire</Label>
          <Input
            id="recipient"
            type="email"
            placeholder="admin@random.app"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            L'utilisateur doit exister et avoir un push token actif
          </p>
        </div>

        <div className="space-y-2">
          <Label>Variables d'exemple</Label>
          {Object.entries(variables).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24">
                {`{{${key}}}`}
              </span>
              <Input
                value={value}
                onChange={(e) =>
                  setVariables((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="flex-1"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="send-email"
            checked={sendEmail}
            onCheckedChange={(checked) => setSendEmail(checked as boolean)}
          />
          <Label htmlFor="send-email" className="text-sm cursor-pointer">
            Envoyer aussi par email (backup)
          </Label>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-2">Aperçu du message :</p>
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {currentCopy.title.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key as keyof typeof variables] || `{{${key}}}`)}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentCopy.body.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key as keyof typeof variables] || `{{${key}}}`)}
            </p>
          </div>
        </div>

        <Button
          onClick={handleSendTest}
          disabled={isSending || !recipientEmail}
          className="w-full"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : sent ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Envoyé !
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Envoyer le test
            </>
          )}
        </Button>

        {sent && (
          <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-900 dark:text-green-100">
              ✅ Test envoyé avec succès ! Vérifie la notification sur l'appareil.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

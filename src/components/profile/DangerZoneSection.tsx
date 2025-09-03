import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useAccountDeletion } from '@/hooks/useAccountDeletion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const DangerZoneSection = () => {
  const { deleteAccount, isDeleting } = useAccountDeletion();
  const [confirmationText, setConfirmationText] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'SUPPRIMER') {
      return;
    }

    const success = await deleteAccount();
    if (success) {
      setShowDialog(false);
      setConfirmationText('');
    }
  };

  const isConfirmationValid = confirmationText === 'SUPPRIMER';

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Zone Dangereuse
        </CardTitle>
        <CardDescription>
          Actions irréversibles qui affecteront définitivement votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Supprimer mon compte
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Supprimer définitivement votre compte
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  <strong>Cette action est irréversible.</strong> En supprimant votre compte, vous perdrez :
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Toutes vos informations de profil</li>
                  <li>Votre historique de sorties</li>
                  <li>Vos messages dans les groupes</li>
                  <li>Toutes vos données personnelles</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Pour confirmer, tapez <strong>SUPPRIMER</strong> dans le champ ci-dessous :
                </p>
                <div className="space-y-2">
                  <Label htmlFor="confirmation">Confirmation</Label>
                  <Input
                    id="confirmation"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Tapez SUPPRIMER"
                    className="font-mono"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmationText('')}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={!isConfirmationValid || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useReferralProgram } from '@/hooks/useReferralProgram';
import { Gift, Users, Share2, Copy, Check } from 'lucide-react';

export default function ReferralPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    myReferralCode,
    referrals,
    totalRewards,
    loading,
    shareReferralLink,
  } = useReferralProgram();

  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (myReferralCode) {
      navigator.clipboard.writeText(myReferralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Code copié !',
        description: 'Votre code de parrainage a été copié dans le presse-papier.',
      });
    }
  };

  const handleShare = () => {
    const link = shareReferralLink();
    if (link) {
      toast({
        title: 'Lien copié !',
        description: 'Le lien de parrainage a été copié dans le presse-papier.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      case 'converted':
        return <Badge className="bg-blue-500">Converti</Badge>;
      case 'rewarded':
        return <Badge className="bg-green-500">Récompensé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Programme de Parrainage</h1>
          <p className="text-muted-foreground">
            Invitez vos amis et gagnez des récompenses !
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <div className="space-y-6">
            {/* Mon code de parrainage */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Votre code de parrainage
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Partagez ce code avec vos amis
                  </p>
                </div>
              </div>

              <div className="bg-muted p-6 rounded-lg text-center mb-4">
                <div className="text-4xl font-bold tracking-wider mb-2">
                  {myReferralCode || 'Aucun code'}
                </div>
                <p className="text-sm text-muted-foreground">
                  Chaque ami qui s'inscrit avec votre code vous fait gagner 5€
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier le code
                    </>
                  )}
                </Button>
                <Button onClick={handleShare} className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager le lien
                </Button>
              </div>
            </Card>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Amis invités
                    </p>
                    <p className="text-2xl font-bold">
                      {referrals.filter(r => r.referred_user_id).length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Convertis</p>
                    <p className="text-2xl font-bold">
                      {
                        referrals.filter(
                          r => r.status === 'converted' || r.status === 'rewarded'
                        ).length
                      }
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Récompenses gagnées
                    </p>
                    <p className="text-2xl font-bold">{totalRewards}€</p>
                  </div>
                  <Gift className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Liste des parrainages */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Historique des parrainages
              </h2>

              {referrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Vous n'avez pas encore de parrainages.
                  <br />
                  Partagez votre code pour commencer !
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {referral.referred_user_id
                            ? `Ami parrainé`
                            : 'En attente'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString(
                            'fr-FR'
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {referral.reward_amount > 0 && (
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              +{referral.reward_amount}€
                            </div>
                          </div>
                        )}
                        {getStatusBadge(referral.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Comment ça marche */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
              <h2 className="text-xl font-semibold mb-4">Comment ça marche ?</h2>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <p>
                    Partagez votre code de parrainage unique avec vos amis
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <p>
                    Votre ami s'inscrit sur Random en utilisant votre code
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <p>
                    Dès que votre ami complète sa première sortie, vous gagnez tous les deux 5€ !
                  </p>
                </li>
              </ol>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

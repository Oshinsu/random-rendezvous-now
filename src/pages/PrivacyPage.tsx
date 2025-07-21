
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/')}
            variant="ghost"
            className="flex items-center space-x-2 text-amber-700 hover:text-amber-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à l'accueil</span>
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
              Politique de Confidentialité
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Collecte des données</h2>
              <div className="text-gray-700 space-y-2">
                <p>Nous collectons les données suivantes :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Données d'inscription :</strong> nom, prénom, adresse e-mail</li>
                  <li><strong>Données de géolocalisation :</strong> position actuelle pour la création de groupes</li>
                  <li><strong>Données d'utilisation :</strong> interactions avec l'application, historique des sorties</li>
                  <li><strong>Données de communication :</strong> messages envoyés dans les groupes</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Utilisation des données</h2>
              <div className="text-gray-700 space-y-2">
                <p>Vos données sont utilisées pour :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Créer et gérer votre compte utilisateur</li>
                  <li>Proposer des groupes à proximité de votre position</li>
                  <li>Faciliter la communication entre membres d'un groupe</li>
                  <li>Améliorer la qualité et la sécurité du service</li>
                  <li>Vous envoyer des notifications liées à vos groupes</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Partage des données</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous ne vendons jamais vos données personnelles. Vos informations peuvent être partagées 
                uniquement dans les cas suivants :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                <li>Avec les membres de votre groupe (nom, position approximative)</li>
                <li>Avec nos prestataires techniques pour le fonctionnement du service</li>
                <li>En cas d'obligation légale ou de demande judiciaire</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Géolocalisation</h2>
              <p className="text-gray-700 leading-relaxed">
                Votre position géographique est utilisée exclusivement pour créer des groupes à proximité. 
                Cette donnée n'est stockée que temporairement et n'est partagée qu'avec les membres de votre 
                groupe actuel. Vous pouvez désactiver la géolocalisation à tout moment, mais cela limitera 
                les fonctionnalités de l'application.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Conservation des données</h2>
              <div className="text-gray-700 space-y-2">
                <p>Nous conservons vos données selon les délais suivants :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Données de compte :</strong> tant que votre compte est actif</li>
                  <li><strong>Données de géolocalisation :</strong> supprimées après chaque session</li>
                  <li><strong>Historique des sorties :</strong> conservé pour statistiques personnelles</li>
                  <li><strong>Messages de groupe :</strong> supprimés après fermeture du groupe</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Vos droits</h2>
              <div className="text-gray-700 space-y-2">
                <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Droit d'accès :</strong> consulter vos données personnelles</li>
                  <li><strong>Droit de rectification :</strong> corriger vos informations</li>
                  <li><strong>Droit à l'effacement :</strong> supprimer votre compte et vos données</li>
                  <li><strong>Droit à la portabilité :</strong> récupérer vos données</li>
                  <li><strong>Droit d'opposition :</strong> vous opposer au traitement</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Sécurité</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous mettons en place des mesures techniques et organisationnelles appropriées pour protéger 
                vos données contre l'accès non autorisé, la modification, la divulgation ou la destruction. 
                Toutes les communications sont chiffrées et nos serveurs sont sécurisés.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Cookies et technologies similaires</h2>
              <p className="text-gray-700 leading-relaxed">
                L'application utilise des technologies de stockage local pour maintenir votre session et 
                améliorer votre expérience. Aucun cookie de suivi publicitaire n'est utilisé.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour exercer vos droits ou pour toute question concernant cette politique de confidentialité, 
                contactez-nous à : <span className="font-medium">privacy@random-app.fr</span>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">10. Modifications</h2>
              <p className="text-gray-700 leading-relaxed">
                Cette politique peut être modifiée pour refléter les changements dans nos pratiques ou 
                la réglementation. Nous vous informerons de tout changement significatif via l'application.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPage;

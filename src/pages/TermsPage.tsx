
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsPage = () => {
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
              Conditions Générales d'Utilisation
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Présentation du service</h2>
              <p className="text-gray-700 leading-relaxed">
                Random est une application mobile qui permet aux utilisateurs de créer et rejoindre des groupes 
                spontanés pour des sorties dans des bars. L'application utilise la géolocalisation pour proposer 
                des rencontres locales et favoriser les connexions sociales authentiques.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Acceptation des conditions</h2>
              <p className="text-gray-700 leading-relaxed">
                En utilisant Random, vous acceptez pleinement et sans réserve les présentes conditions générales 
                d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Utilisation responsable</h2>
              <div className="text-gray-700 space-y-2">
                <p>Vous vous engagez à :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Utiliser l'application de manière respectueuse et légale</li>
                  <li>Fournir des informations exactes lors de votre inscription</li>
                  <li>Respecter les autres utilisateurs et maintenir un comportement approprié</li>
                  <li>Ne pas utiliser l'application à des fins commerciales non autorisées</li>
                  <li>Signaler tout comportement inapproprié ou suspect</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Géolocalisation et données</h2>
              <p className="text-gray-700 leading-relaxed">
                L'application utilise votre géolocalisation pour proposer des groupes à proximité. Ces données 
                sont traitées de manière sécurisée et ne sont partagées qu'avec les membres de votre groupe 
                pour faciliter la rencontre. Vous pouvez désactiver la géolocalisation à tout moment dans les 
                paramètres de votre appareil.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Sécurité et rencontres</h2>
              <div className="text-gray-700 space-y-2">
                <p>Random facilite les rencontres mais ne peut garantir la sécurité des interactions physiques. 
                Nous vous recommandons fortement de :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Rencontrer les autres utilisateurs dans des lieux publics</li>
                  <li>Informer un proche de vos plans</li>
                  <li>Faire confiance à votre instinct</li>
                  <li>Quitter immédiatement toute situation inconfortable</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Limitation de responsabilité</h2>
              <p className="text-gray-700 leading-relaxed">
                Random agit uniquement comme plateforme de mise en relation. Nous ne sommes pas responsables 
                des interactions entre utilisateurs, des dommages résultant de rencontres, ou de tout préjudice 
                direct ou indirect lié à l'utilisation de l'application.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Modification des conditions</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous nous réservons le droit de modifier ces conditions à tout moment. Les utilisateurs seront 
                informés des changements importants via l'application. L'utilisation continue après modification 
                constitue une acceptation des nouvelles conditions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question concernant ces conditions d'utilisation, vous pouvez nous contacter à : 
                <span className="font-medium"> contact@random-app.fr</span>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsPage;

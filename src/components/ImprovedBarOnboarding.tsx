import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Circle, 
  Building, 
  FileText, 
  CreditCard, 
  Rocket,
  Clock,
  Star,
  Users,
  TrendingUp
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  current?: boolean;
}

interface ImprovedBarOnboardingProps {
  currentStep: 'application' | 'review' | 'payment' | 'complete';
  onContinue: () => void;
  estimatedReviewTime?: string;
}

export const ImprovedBarOnboarding = ({ 
  currentStep, 
  onContinue, 
  estimatedReviewTime = "2-3 jours ouvrés" 
}: ImprovedBarOnboardingProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(
    currentStep === 'application' ? 0 :
    currentStep === 'review' ? 1 :
    currentStep === 'payment' ? 2 : 3
  );

  const steps: OnboardingStep[] = [
    {
      id: 'application',
      title: 'Candidature',
      description: 'Remplissez le formulaire avec les détails de votre établissement',
      icon: <FileText className="h-5 w-5" />,
      completed: currentStepIndex > 0,
      current: currentStepIndex === 0
    },
    {
      id: 'review',
      title: 'Validation',
      description: `Notre équipe examine votre candidature (${estimatedReviewTime})`,
      icon: <Clock className="h-5 w-5" />,
      completed: currentStepIndex > 1,
      current: currentStepIndex === 1
    },
    {
      id: 'payment',
      title: 'Abonnement',
      description: 'Souscrivez à Bar Manager Premium pour démarrer',
      icon: <CreditCard className="h-5 w-5" />,
      completed: currentStepIndex > 2,
      current: currentStepIndex === 2
    },
    {
      id: 'complete',
      title: 'Lancement',
      description: 'Accédez à votre dashboard et commencez à attirer des clients !',
      icon: <Rocket className="h-5 w-5" />,
      completed: currentStepIndex > 3,
      current: currentStepIndex === 3
    }
  ];

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const benefits = [
    {
      icon: <Users className="h-5 w-5 text-blue-500" />,
      title: "Plus de clients",
      description: "Attirez automatiquement des groupes vers votre bar"
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      title: "Analytics détaillées",
      description: "Suivez vos performances et optimisez votre stratégie"
    },
    {
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      title: "Priorité algorithme",
      description: "Apparaissez en premier dans les suggestions"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header avec progression */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Building className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Devenez Bar Partenaire</h1>
        </div>
        
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Étape {currentStepIndex + 1} sur {steps.length}</span>
            <span>{Math.round(progress)}% complété</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Étapes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {steps.map((step, index) => (
          <Card 
            key={step.id} 
            className={`relative transition-all duration-200 ${
              step.current ? 'border-primary shadow-lg scale-105' : ''
            }`}
          >
            <CardContent className="p-4 text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                step.completed 
                  ? 'bg-green-100 text-green-600' 
                  : step.current 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {step.completed ? <CheckCircle className="h-6 w-6" /> : step.icon}
              </div>
              
              <h3 className="font-semibold mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </CardContent>
            
            {step.current && (
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-primary text-primary-foreground">
                  En cours
                </Badge>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Contenu principal basé sur l'étape actuelle */}
      <Card className="p-6">
        {currentStep === 'application' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Commençons votre candidature</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Remplissez notre formulaire simple pour nous parler de votre établissement. 
                Cela ne prend que quelques minutes et vous permet de rejoindre notre réseau de bars partenaires.
              </p>
            </div>
            
            {/* Avantages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex justify-center">{benefit.icon}</div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Button onClick={onContinue} size="lg" className="px-8">
                Commencer ma candidature
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Processus 100% gratuit • Aucun engagement
              </p>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
              <Clock className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Candidature en cours d'examen</h2>
              <p className="text-muted-foreground">
                Merci pour votre candidature ! Notre équipe examine actuellement votre dossier.
              </p>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Temps d'attente estimé</h3>
              <div className="text-2xl font-bold text-primary mb-2">{estimatedReviewTime}</div>
              <p className="text-sm text-muted-foreground">
                Vous recevrez un email dès que votre candidature sera approuvée.
              </p>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Des questions ? Contactez-nous à <strong>contact@random-app.fr</strong></p>
            </div>
          </div>
        )}

        {currentStep === 'payment' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Félicitations ! Candidature approuvée</h2>
              <p className="text-muted-foreground">
                Votre établissement a été validé. Il ne reste plus qu'à souscrire à l'abonnement Bar Manager Premium.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 max-w-lg mx-auto">
              <h3 className="font-semibold mb-4">Bar Manager Premium</h3>
              <div className="text-3xl font-bold mb-2">29€<span className="text-lg font-normal">/mois</span></div>
              <p className="text-sm text-muted-foreground mb-4">Sans engagement • Annulation à tout moment</p>
              
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Dashboard analytics complet
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Priorité dans l'algorithme
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Support prioritaire
                </li>
              </ul>
            </div>
            
            <Button onClick={onContinue} size="lg" className="px-8">
              Souscrire maintenant
            </Button>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-4">
              <Rocket className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Bienvenue dans le réseau !</h2>
              <p className="text-muted-foreground">
                Votre bar est maintenant actif sur Random. Accédez à votre dashboard pour commencer à attirer des clients.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
              <Button onClick={onContinue} className="w-full">
                <Building className="h-4 w-4 mr-2" />
                Accéder au Dashboard
              </Button>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Guide de démarrage
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ImprovedBarOnboarding;
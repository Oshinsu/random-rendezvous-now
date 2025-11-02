import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { useBarOwner } from '@/hooks/useBarOwner';
import { GooglePlacesAutocomplete } from './GooglePlacesAutocomplete';
import { Loader2, User, Building2, MessageSquare, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const applicationSchema = z.object({
  business_name: z.string().min(2, 'Le nom de l\'établissement est requis'),
  contact_email: z.string().email('Email invalide'),
  contact_phone: z.string().optional(),
  bar_name: z.string().min(2, 'Le nom du bar est requis'),
  bar_address: z.string().min(5, 'L\'adresse complète est requise'),
  bar_place_id: z.string().optional(),
  why_join: z.string().min(10, 'Expliquez pourquoi vous souhaitez nous rejoindre (minimum 10 caractères)'),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

const steps = [
  { id: 1, title: 'Vos informations', icon: User },
  { id: 2, title: 'Votre établissement', icon: Building2 },
  { id: 3, title: 'Votre motivation', icon: MessageSquare },
];

export function MultiStepBarApplication() {
  const [currentStep, setCurrentStep] = useState(1);
  const { applyAsBarOwner } = useBarOwner();
  
  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      business_name: '',
      contact_email: '',
      contact_phone: '',
      bar_name: '',
      bar_address: '',
      bar_place_id: '',
      why_join: '',
    },
    mode: 'onChange',
  });

  const progress = (currentStep / steps.length) * 100;

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof ApplicationForm)[] = [];
    
    switch (step) {
      case 1:
        fieldsToValidate = ['business_name', 'contact_email', 'contact_phone'];
        break;
      case 2:
        fieldsToValidate = ['bar_name', 'bar_address'];
        break;
      case 3:
        fieldsToValidate = ['why_join'];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: ApplicationForm) => {
    // Ensure all required fields are present
    const applicationData = {
      business_name: data.business_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      bar_name: data.bar_name,
      bar_address: data.bar_address,
      bar_place_id: data.bar_place_id,
      why_join: data.why_join,
    };
    applyAsBarOwner.mutate(applicationData);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Étape {currentStep} sur {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps indicator */}
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-2 flex-1",
                    isCurrent && "text-primary",
                    isCompleted && "text-primary"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors",
                      isCurrent && "border-primary bg-primary/10",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      !isCurrent && !isCompleted && "border-muted-foreground/30"
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs font-medium text-center hidden sm:block">
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          <div>
            <CardTitle className="text-2xl">
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Commençons par vos coordonnées professionnelles"}
              {currentStep === 2 && "Parlez-nous de votre établissement"}
              {currentStep === 3 && "Dernière étape : expliquez-nous votre projet"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'établissement *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: SARL Le Bistrot Parisien" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email professionnel *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@monbar.fr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="01 23 45 67 89" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Bar Info */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <FormField
                  control={form.control}
                  name="bar_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du bar *</FormLabel>
                      <FormControl>
                        <Input placeholder="Le Bistrot Parisien" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bar_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse complète du bar *</FormLabel>
                      <FormControl>
                        <GooglePlacesAutocomplete
                          value={field.value}
                          onChange={(address, placeId) => {
                            field.onChange(address);
                            if (placeId) {
                              form.setValue('bar_place_id', placeId);
                            }
                          }}
                          placeholder="Commencez à taper l'adresse..."
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sélectionnez l'adresse dans la liste pour un remplissage automatique
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Motivation */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <FormField
                  control={form.control}
                  name="why_join"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pourquoi souhaitez-vous rejoindre Random ? *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Parlez-nous de votre établissement, votre clientèle cible, vos objectifs de développement..."
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Cette information nous aide à mieux comprendre votre projet et à l'adapter à vos besoins
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    Offre de lancement
                  </h4>
                  <ul className="text-sm space-y-1.5">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>30 jours d'essai gratuit</strong> pour tester nos services</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Puis seulement <strong>150€/mois</strong> (sans engagement)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Dashboard analytics en temps réel inclus</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Support dédié 7j/7</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
              ) : (
                <div />
              )}

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto"
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={applyAsBarOwner.isPending}
                  className="ml-auto"
                >
                  {applyAsBarOwner.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Envoyer ma candidature
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

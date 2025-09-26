import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useBarOwner } from '@/hooks/useBarOwner';
import { Loader2, Building, Euro, Users, TrendingUp } from 'lucide-react';

const applicationSchema = z.object({
  business_name: z.string().min(2, 'Le nom de l\'établissement est requis'),
  contact_email: z.string().email('Email invalide'),
  contact_phone: z.string().optional(),
  bar_name: z.string().min(2, 'Le nom du bar est requis'),
  bar_address: z.string().min(5, 'L\'adresse complète est requise'),
  why_join: z.string().min(10, 'Expliquez pourquoi vous souhaitez nous rejoindre (minimum 10 caractères)'),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export function BarOwnerApplication() {
  const { applyAsBarOwner } = useBarOwner();
  
  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      business_name: '',
      contact_email: '',
      contact_phone: '',
      bar_name: '',
      bar_address: '',
      why_join: '',
    },
  });

  const onSubmit = (data: ApplicationForm) => {
    const { why_join, ...applicationData } = data;
    applyAsBarOwner.mutate({
      business_name: applicationData.business_name,
      contact_email: applicationData.contact_email,
      contact_phone: applicationData.contact_phone,
      bar_name: applicationData.bar_name,
      bar_address: applicationData.bar_address,
    });
  };

  return (
    <div className="space-y-8">
      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h3 className="font-semibold mb-2">Nouveaux clients</h3>
            <p className="text-sm text-muted-foreground">
              Recevez des groupes de 5 personnes automatiquement
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="font-semibold mb-2">Analytics détaillées</h3>
            <p className="text-sm text-muted-foreground">
              Suivez votre CA généré par Random en temps réel
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Euro className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="font-semibold mb-2">ROI garanti</h3>
            <p className="text-sm text-muted-foreground">
              150€/mois - Largement rentabilisé dès le premier mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle>Candidature Gérant de Bar</CardTitle>
          <CardDescription>
            Rejoignez notre réseau de bars partenaires et bénéficiez d'un flux constant de nouveaux clients.
            <strong> Essai gratuit de 30 jours !</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <FormField
                control={form.control}
                name="bar_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse complète du bar *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 rue de la République, 75001 Paris" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="why_join"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pourquoi souhaitez-vous rejoindre Random ?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Parlez-nous de votre établissement, votre clientèle cible, vos objectifs..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">🎉 Offre de lancement</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>30 jours d'essai gratuit</strong> pour tester nos services</li>
                  <li>• Puis seulement <strong>150€/mois</strong> (sans engagement)</li>
                  <li>• Dashboard analytics en temps réel inclus</li>
                  <li>• Support dédié 7j/7</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={applyAsBarOwner.isPending}
              >
                {applyAsBarOwner.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer ma candidature'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
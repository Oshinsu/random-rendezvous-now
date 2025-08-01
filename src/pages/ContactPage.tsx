import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageSquare, User, ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router-dom";
import RandomLogo from "@/components/RandomLogo";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulation d'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message envoyé !",
        description: "Merci pour votre message. Nous vous répondrons bientôt à contact@random-app.fr",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-secondary/30">
      {/* Header avec navigation */}
      <header className="p-4 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="flex items-center space-x-2">
              <RandomLogo size={28} />
              <span className="text-xl font-bold text-primary">Random</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations de contact */}
          <div className="lg:col-span-1">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contactez-nous
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Une question, une suggestion ou juste envie de dire bonjour ?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-sm text-primary-foreground/80">contact@random-app.fr</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Réponse sous</h3>
                  <p className="text-sm text-primary-foreground/80">24-48 heures</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Équipe</h3>
                  <p className="text-sm text-primary-foreground/80">
                    Des passionnés qui bossent dur pour créer des moments magiques ✨
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Envoyez-nous un message
                </CardTitle>
                <CardDescription>
                  Nous serions ravis d'avoir de vos nouvelles ! Dites-nous tout.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nom complet
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="votre@email.fr"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="De quoi voulez-vous parler ?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Racontez-nous tout ! Bug, suggestion, compliment... On est tout ouïe 👂"
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground"
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Envoi en cours...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Envoyer le message
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section FAQ rapide */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Questions fréquentes</CardTitle>
              <CardDescription>
                Peut-être que votre réponse se trouve ici !
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">🐛 J'ai trouvé un bug</h4>
                  <p className="text-sm text-muted-foreground">
                    Merci ! Décrivez-nous le problème en détail, on s'en occupe en priorité.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">💡 J'ai une idée géniale</h4>
                  <p className="text-sm text-muted-foreground">
                    On adore les bonnes idées ! Partagez-nous votre vision.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">❓ Comment ça marche ?</h4>
                  <p className="text-sm text-muted-foreground">
                    Retournez sur la page d'accueil, tout y est expliqué !
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🤝 Partenariat</h4>
                  <p className="text-sm text-muted-foreground">
                    Vous voulez collaborer ? On est ouverts aux discussions !
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
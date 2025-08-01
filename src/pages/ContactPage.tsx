import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import RandomLogo from "@/components/RandomLogo";

const ContactPage = () => {

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
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-center">
          <Card className="bg-primary text-primary-foreground w-full">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Mail className="h-6 w-6" />
                Contactez-nous
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 text-lg">
                Une question, une suggestion ou juste envie de dire bonjour ?
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-xl">Notre adresse email</h3>
                <div className="bg-background/10 rounded-lg p-6 border border-primary-foreground/20">
                  <p className="text-2xl font-mono text-primary-foreground select-all">
                    contact@random-app.fr
                  </p>
                </div>
                <p className="text-primary-foreground/80">
                  Envoyez-nous un email directement, nous vous répondrons sous 24-48 heures !
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Notre équipe</h4>
                <p className="text-sm text-primary-foreground/80">
                  Des passionnés qui bossent dur pour créer des moments magiques ✨
                </p>
              </div>
            </CardContent>
          </Card>
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
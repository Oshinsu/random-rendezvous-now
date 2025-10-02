import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Sparkles, Star, LogOut, User, Building2 } from "lucide-react";
import RandomLogo from "@/components/RandomLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";

const LandingNavigation = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
    setMobileMenuOpen(false);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <RandomLogo size={32} className="sm:w-10 sm:h-10" />
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Random
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium">
                    {i18n.language === 'en' ? 'Features' : 'Découvrir'}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => scrollToSection('how-it-works')}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
                          >
                            <div className="text-sm font-medium leading-none">
                              {i18n.language === 'en' ? 'How it works' : 'Comment ça marche'}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {i18n.language === 'en' ? '1 click, 5 people, 1 bar' : '1 clic, 5 personnes, 1 bar'}
                            </p>
                          </button>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => scrollToSection('why-random')}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
                          >
                            <div className="text-sm font-medium leading-none">
                              {i18n.language === 'en' ? 'Why Random?' : 'Pourquoi Random ?'}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {i18n.language === 'en' ? 'Authentic connections' : 'Des rencontres authentiques'}
                            </p>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    FAQ
                  </button>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <LanguageToggle />

            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center space-x-2 bg-accent px-3 py-2 rounded-lg border">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {user.user_metadata?.first_name || user.email}
                  </span>
                </div>
                <Button 
                  onClick={handleGoToDashboard} 
                  className="shadow-lg hover-scale"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {i18n.language === 'en' ? 'Find Group' : 'Groupe'}
                </Button>
                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {i18n.language === 'en' ? 'Sign out' : 'Déconnexion'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/bar-auth">
                    <Building2 className="h-4 w-4 mr-2" />
                    {i18n.language === 'en' ? 'Bar Owners' : 'Gérants'}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/auth?tab=signin">
                    <User className="h-4 w-4 mr-2" />
                    {i18n.language === 'en' ? 'Sign in' : 'Connexion'}
                  </Link>
                </Button>
                <Button asChild className="shadow-lg hover-scale" size="sm">
                  <Link to="/auth?tab=signup">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {i18n.language === 'en' ? 'Sign up' : 'Inscription'}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <RandomLogo size={24} />
                    Random
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  {user && (
                    <div className="flex items-center gap-2 p-3 bg-accent rounded-lg border mb-4">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {user.user_metadata?.first_name || user.email}
                      </span>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => scrollToSection('how-it-works')}
                  >
                    {i18n.language === 'en' ? 'How it works' : 'Comment ça marche'}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => scrollToSection('why-random')}
                  >
                    {i18n.language === 'en' ? 'Why Random?' : 'Pourquoi Random ?'}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => scrollToSection('faq')}
                  >
                    FAQ
                  </Button>

                  <div className="border-t my-4"></div>

                  {user ? (
                    <>
                      <Button 
                        onClick={handleGoToDashboard}
                        className="w-full"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {i18n.language === 'en' ? 'Find Group' : 'Chercher un Groupe'}
                      </Button>
                      <Button 
                        onClick={handleSignOut}
                        variant="outline"
                        className="w-full"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {i18n.language === 'en' ? 'Sign out' : 'Déconnexion'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="ghost" className="w-full justify-start">
                        <Link to="/bar-auth" onClick={() => setMobileMenuOpen(false)}>
                          <Building2 className="h-4 w-4 mr-2" />
                          {i18n.language === 'en' ? 'Bar Owners' : 'Gérants de Bar'}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/auth?tab=signin" onClick={() => setMobileMenuOpen(false)}>
                          <User className="h-4 w-4 mr-2" />
                          {i18n.language === 'en' ? 'Sign in' : 'Connexion'}
                        </Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link to="/auth?tab=signup" onClick={() => setMobileMenuOpen(false)}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          {i18n.language === 'en' ? 'Sign up' : 'Inscription'}
                        </Link>
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingNavigation;

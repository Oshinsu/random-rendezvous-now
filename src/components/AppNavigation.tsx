
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Home, Users, User, LogOut, Menu, ExternalLink, Clock } from 'lucide-react';
import RandomLogo from './RandomLogo';
import { LanguageToggle } from './LanguageToggle';

const AppNavigation = () => {
  const { user, signOut } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const userName = user?.user_metadata?.first_name || 'Utilisateur';

  return (
    <header className="bg-background border-b border-border/40 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Nouveau logo Random */}
          <div className="flex items-center">
            <NavLink to="/dashboard" className="flex items-center space-x-2">
              <RandomLogo size={38} withTitle={true} className="drop-shadow-lg" />
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <NavLink 
                      to="/dashboard" 
                      className={({ isActive }) => 
                        `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors font-heading ${
                          isActive 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`
                      }
                    >
                      <Home className="h-4 w-4" />
                       <span>{i18n.language === 'en' ? 'Dashboard' : 'Tableau de bord'}</span>
                    </NavLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <NavLink 
                      to="/groups" 
                      className={({ isActive }) => 
                        `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors font-heading ${
                          isActive 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`
                      }
                    >
                      <Users className="h-4 w-4" />
                        <span>{i18n.language === 'en' ? 'Groups' : 'Groupes'}</span>
                    </NavLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <NavLink 
                      to="/scheduled-groups" 
                      className={({ isActive }) => 
                        `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors font-heading ${
                          isActive 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`
                      }
                    >
                      <Clock className="h-4 w-4" />
                        <span>{i18n.language === 'en' ? 'Scheduled Groups' : 'Groupes programmés'}</span>
                    </NavLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <LanguageToggle />
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white font-heading">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-heading font-medium">{userName}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground font-body">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/profile" className="flex items-center font-heading">
                    <User className="mr-2 h-4 w-4" />
                    <span>{i18n.language === 'en' ? 'Profile' : 'Profil'}</span>
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/" className="flex items-center font-heading">
                    <ExternalLink className="mr-2 h-4 w-4" />
                     <span>{i18n.language === 'en' ? 'Homepage' : 'Accueil'}</span>
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="font-heading">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{i18n.language === 'en' ? 'Logout' : 'Déconnexion'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col space-y-2">
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors font-heading ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                <span>{i18n.language === 'en' ? 'Dashboard' : 'Tableau de bord'}</span>
              </NavLink>
              
              <NavLink 
                to="/groups" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors font-heading ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="h-4 w-4" />
                <span>{i18n.language === 'en' ? 'Groups' : 'Groupes'}</span>
              </NavLink>

              <NavLink 
                to="/scheduled-groups" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors font-heading ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <Clock className="h-4 w-4" />
                <span>{i18n.language === 'en' ? 'Scheduled Groups' : 'Groupes programmés'}</span>
              </NavLink>

              <NavLink 
                to="/" 
                className="flex items-center space-x-2 px-4 py-2 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-accent font-heading"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ExternalLink className="h-4 w-4" />
                <span>{i18n.language === 'en' ? 'Homepage' : 'Accueil'}</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppNavigation;

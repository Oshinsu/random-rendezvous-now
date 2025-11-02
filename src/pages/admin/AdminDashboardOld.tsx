import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useComprehensiveAdminStats } from "@/hooks/useComprehensiveAdminStats";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Users, MapPin, CheckCircle, Clock, TrendingUp, UserPlus, Activity, BarChart3, MessageSquare, Calendar, XCircle, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export const AdminDashboard = () => {
  const { stats, loading, error, refetch } = useComprehensiveAdminStats();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: "Données actualisées",
      description: "Les statistiques ont été mises à jour",
    });
  };

  const handleCleanup = async () => {
    try {
      const { error } = await supabase.rpc('dissolve_old_groups');
      if (error) throw error;
      
      toast({
        title: "Nettoyage effectué",
        description: "Les anciens groupes ont été nettoyés",
      });
      
      await refetch();
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du nettoyage",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-4 sm:p-6 lg:p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm sm:text-base text-red-800">Erreur lors du chargement des statistiques: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Utilisateurs totaux",
      value: stats.total_users,
      description: `${stats.total_profiles} profils créés`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Groupes en attente",
      value: stats.waiting_groups,
      description: "Groupes cherchant des membres",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      title: "Groupes confirmés",
      value: stats.confirmed_groups,
      description: "Groupes avec bar assigné",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Groupes terminés",
      value: stats.completed_groups,
      description: "Sorties finalisées",
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      title: "Groupes annulés",
      value: stats.cancelled_groups,
      description: "Groupes supprimés",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      title: "Groupes planifiés",
      value: stats.scheduled_groups,
      description: "En attente d'activation",
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200"
    }
  ];

  const todayCards = [
    {
      title: "Nouveaux groupes",
      value: stats.groups_today,
      description: "Créés aujourd'hui",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200"
    },
    {
      title: "Nouvelles inscriptions", 
      value: stats.signups_today,
      description: "Aujourd'hui",
      icon: UserPlus,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200"
    },
    {
      title: "Messages échangés",
      value: stats.total_messages - stats.system_messages,
      description: `+ ${stats.system_messages} système`,
      icon: MessageSquare,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200"
    },
    {
      title: "Participants actifs",
      value: stats.active_participants,
      description: "Dernières 24h",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className={`${isMobile ? 'space-y-4' : 'flex justify-between items-center'}`}>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-800">Dashboard Admin</h1>
          <p className="text-sm sm:text-base text-red-600 mt-1 sm:mt-2">Vue d'ensemble de l'activité Random en temps réel</p>
        </div>
        <div className={`flex ${isMobile ? 'flex-wrap' : ''} gap-2`}>
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-xs sm:text-sm">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline" 
            size={isMobile ? "sm" : "sm"}
            className="border-red-300 text-red-700 hover:bg-red-50 text-xs sm:text-sm"
          >
            {isRefreshing ? <LoadingSpinner size="sm" /> : "Actualiser"}
          </Button>
          <Button 
            onClick={handleCleanup} 
            variant="outline" 
            size={isMobile ? "sm" : "sm"}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 text-xs sm:text-sm"
          >
            Nettoyer DB
          </Button>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className={`${stat.borderColor} ${stat.bgColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métriques avancées */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-red-800 mb-3 sm:mb-4">Métriques avancées</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <Card className="border-teal-200 bg-teal-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base text-teal-800 flex items-center gap-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                Taille moyenne des groupes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-teal-600">{stats.avg_group_size || 0}</div>
              <p className="text-xs text-teal-700 mt-1">Participants par groupe terminé</p>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base text-amber-800 flex items-center gap-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                Sorties totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600">{stats.total_outings}</div>
              <p className="text-xs text-amber-700 mt-1">Historique complet</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top bars */}
      {stats.top_bars && stats.top_bars.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-red-800 mb-3 sm:mb-4">Bars les plus populaires</h2>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                {stats.top_bars.slice(0, 5).map((bar, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium text-sm sm:text-base truncate mr-2">{bar.bar_name}</span>
                    <Badge variant="secondary" className="text-xs sm:text-sm flex-shrink-0">{bar.visits} visites</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activité du jour */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-red-800 mb-3 sm:mb-4">Activité récente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {todayCards.map((stat) => (
            <Card key={stat.title} className={`${stat.borderColor} ${stat.bgColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-red-800 mb-3 sm:mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Card 
            className="border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
            onClick={() => navigate('/admin/activity')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base text-blue-800 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                Analytics détaillées
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-blue-600">
                Voir les métriques d'usage et de performance
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card 
            className="border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
            onClick={() => navigate('/admin/users')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base text-purple-800 flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Gestion utilisateurs
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-purple-600">
                Modérer et gérer les comptes utilisateurs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer"
            onClick={() => navigate('/admin/groups')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base text-orange-800 flex items-center gap-2">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                Surveillance temps réel
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-orange-600">
                Monitorer l'activité des groupes en live
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-red-800 mb-3 sm:mb-4">État du système</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base text-green-800">Système opérationnel</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-green-600">
                Tous les services fonctionnent normalement
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base text-blue-800">Accès rapide</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-blue-600">
                Utilisez la navigation latérale pour accéder aux différents modules d'administration
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "@/hooks/useAdminStats";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Users, MapPin, CheckCircle, Clock, TrendingUp, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AdminDashboard = () => {
  const { stats, loading, error } = useAdminStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800">Erreur lors du chargement des statistiques: {error}</p>
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
      description: "Utilisateurs enregistrés",
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
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-800">Tableau de bord</h1>
          <p className="text-red-600 mt-2">Vue d'ensemble de l'activité Random</p>
        </div>
        <Badge variant="outline" className="text-red-700 border-red-300">
          Temps réel
        </Badge>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className={`${stat.borderColor} ${stat.bgColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activité du jour */}
      <div>
        <h2 className="text-xl font-semibold text-red-800 mb-4">Activité du jour</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {todayCards.map((stat) => (
            <Card key={stat.title} className={`${stat.borderColor} ${stat.bgColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Messages d'état */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Système opérationnel</CardTitle>
            <CardDescription className="text-green-600">
              Tous les services fonctionnent normalement
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Accès rapide</CardTitle>
            <CardDescription className="text-blue-600">
              Utilisez la navigation latérale pour accéder aux différents modules d'administration
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};
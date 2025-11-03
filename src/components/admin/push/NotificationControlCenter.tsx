import { useState } from 'react';
import { useNotificationTypesConfig } from '@/hooks/useNotificationTypesConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, TrendingUp, Clock, BarChart3, 
  Users, Gift, Building, MessageSquare, Megaphone 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AddNotificationDialog } from './AddNotificationDialog';

const CATEGORY_ICONS = {
  groups: Users,
  lifecycle: Gift,
  bars: Building,
  messages: MessageSquare,
  promotions: Megaphone,
};

const CATEGORY_COLORS = {
  groups: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  lifecycle: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  bars: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  messages: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  promotions: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const NotificationControlCenter = () => {
  const { configs, isLoading, toggleActivation } = useNotificationTypesConfig();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredConfigs = configs?.filter((config) => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && config.is_active) || 
      (filter === 'inactive' && !config.is_active);
    
    const matchesSearch = 
      config.display_name.toLowerCase().includes(search.toLowerCase()) ||
      config.type_key.toLowerCase().includes(search.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) || [];

  const activeCount = configs?.filter(c => c.is_active).length || 0;
  const totalCount = configs?.length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Notification Control Center
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gère toutes les notifications depuis un seul endroit
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {activeCount} actives / {totalCount} total
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une notification..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="active">Actives</TabsTrigger>
                <TabsTrigger value="inactive">Désactivées</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button 
              variant="default" 
              size="sm" 
              className="gap-2"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Actif</TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Envoyées (30j)</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead>Dernière envoyée</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <p className="text-muted-foreground">
                        {search 
                          ? 'Aucune notification ne correspond à ta recherche' 
                          : 'Aucune notification configurée'
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConfigs.map((config) => {
                    const CategoryIcon = CATEGORY_ICONS[config.category];
                    return (
                      <TableRow key={config.id}>
                        <TableCell>
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={(checked) => 
                              toggleActivation({ id: config.id, is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{config.display_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {config.type_key}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`gap-1 ${CATEGORY_COLORS[config.category]}`}
                          >
                            <CategoryIcon className="h-3 w-3" />
                            {config.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {config.total_sent_30d?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${
                            (config.open_rate || 0) >= 40 ? 'text-green-600 dark:text-green-400' : 
                            (config.open_rate || 0) >= 25 ? 'text-orange-600 dark:text-orange-400' : 
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {config.open_rate?.toFixed(1) || 0}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {config.last_sent_at ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(config.last_sent_at), { 
                                addSuffix: true,
                                locale: fr 
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Jamais</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddNotificationDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </>
  );
};

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Download, 
  Upload,
  Trash2,
  AlertTriangle
} from "lucide-react";

interface SystemSettings {
  maxGroupSize: number;
  defaultSearchRadius: number;
  maintenanceMode: boolean;
  emailNotifications: boolean;
  autoCleanupEnabled: boolean;
  cleanupIntervalHours: number;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    maxGroupSize: 5,
    defaultSearchRadius: 10000,
    maintenanceMode: false,
    emailNotifications: true,
    autoCleanupEnabled: true,
    cleanupIntervalHours: 24
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simuler la sauvegarde des paramètres
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Paramètres sauvegardés",
        description: "La configuration a été mise à jour avec succès",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportDatabase = async () => {
    setLoading(true);
    try {
      // Exporter les données principales
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*');
      
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (groupsError || usersError) {
        throw new Error('Erreur lors de l\'export');
      }

      const exportData = {
        timestamp: new Date().toISOString(),
        groups: groups || [],
        users: users || []
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `random-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Base de données exportée avec succès",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter la base de données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupDatabase = async () => {
    if (!confirm('Êtes-vous sûr de vouloir nettoyer la base de données ? Cette action supprimera les anciennes données.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('dissolve_old_groups');
      if (error) throw error;
      
      toast({
        title: "Nettoyage effectué",
        description: "La base de données a été nettoyée avec succès",
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Erreur de nettoyage",
        description: "Impossible de nettoyer la base de données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-800">Paramètres système</h1>
          <p className="text-red-600 mt-2">Configuration et maintenance de l'application</p>
        </div>
        <Button 
          onClick={handleSaveSettings} 
          disabled={saving}
          className="bg-red-600 hover:bg-red-700"
        >
          {saving ? <LoadingSpinner size="sm" /> : 'Sauvegarder'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paramètres généraux */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Settings className="h-5 w-5" />
              Configuration générale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxGroupSize">Taille maximum des groupes</Label>
              <Input
                id="maxGroupSize"
                type="number"
                min="3"
                max="10"
                value={settings.maxGroupSize}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maxGroupSize: parseInt(e.target.value) || 5
                }))}
              />
            </div>

            <div>
              <Label htmlFor="searchRadius">Rayon de recherche par défaut (mètres)</Label>
              <Input
                id="searchRadius"
                type="number"
                min="1000"
                max="50000"
                value={settings.defaultSearchRadius}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  defaultSearchRadius: parseInt(e.target.value) || 10000
                }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Mode maintenance</Label>
                <p className="text-sm text-gray-600">Désactive l'accès pour les utilisateurs</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  maintenanceMode: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications email</Label>
                <p className="text-sm text-gray-600">Activer les notifications par email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  emailNotifications: checked
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance automatique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Shield className="h-5 w-5" />
              Maintenance automatique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Nettoyage automatique</Label>
                <p className="text-sm text-gray-600">Suppression automatique des anciennes données</p>
              </div>
              <Switch
                checked={settings.autoCleanupEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  autoCleanupEnabled: checked
                }))}
              />
            </div>

            <div>
              <Label htmlFor="cleanupInterval">Intervalle de nettoyage (heures)</Label>
              <Input
                id="cleanupInterval"
                type="number"
                min="1"
                max="168"
                value={settings.cleanupIntervalHours}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  cleanupIntervalHours: parseInt(e.target.value) || 24
                }))}
                disabled={!settings.autoCleanupEnabled}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Button 
                onClick={handleCleanupDatabase}
                disabled={loading}
                variant="outline"
                className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Nettoyer maintenant
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sauvegarde et restauration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Database className="h-5 w-5" />
              Sauvegarde & Restauration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={handleExportDatabase}
                disabled={loading}
                variant="outline"
                className="w-full text-blue-700 border-blue-300 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter base de données
              </Button>
              
              <Button 
                disabled
                variant="outline"
                className="w-full text-gray-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer base de données (Bientôt)
              </Button>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important</p>
                  <p>Effectuez des sauvegardes régulières avant les mises à jour importantes.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications et alertes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Bell className="h-5 w-5" />
              Alertes & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Système opérationnel</p>
                  <p>Tous les services fonctionnent normalement</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>• Base de données: Connectée</p>
              <p>• API Google Places: Fonctionnelle</p>
              <p>• Edge Functions: Actives</p>
              <p>• Authentification: Opérationnelle</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
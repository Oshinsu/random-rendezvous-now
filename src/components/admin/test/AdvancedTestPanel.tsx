import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TEST_LOCATIONS = [
  { name: "Fort-de-France", lat: 14.6037, lng: -61.0731, radius: 25000 },
  { name: "Paris", lat: 48.8566, lng: 2.3522, radius: 10000 },
  { name: "Lyon", lat: 45.7640, lng: 4.8357, radius: 15000 },
  { name: "Marseille", lat: 43.2965, lng: 5.3698, radius: 15000 },
  { name: "Bordeaux", lat: 44.8378, lng: -0.5792, radius: 15000 },
  { name: "Toulouse", lat: 43.6047, lng: 1.4442, radius: 15000 },
];

interface TestResult {
  success: boolean;
  test_group_id?: string;
  test_users_ids?: string[];
  location?: any;
  bar_info?: {
    bar_name: string;
    bar_address: string;
    bar_latitude: number;
    bar_longitude: number;
    meeting_time: string;
  };
  wait_time_seconds?: number;
  cleanup_performed?: boolean;
  message?: string;
  error?: string;
  details?: string;
}

export function AdvancedTestPanel() {
  const [selectedCity, setSelectedCity] = useState(TEST_LOCATIONS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const runTest = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      console.log('🧪 Invoking create-test-scenario with location:', selectedCity);
      
      const { data, error } = await supabase.functions.invoke('create-test-scenario', {
        body: {
          scenario_type: 'full_test',
          location: {
            latitude: selectedCity.lat,
            longitude: selectedCity.lng,
            city_name: selectedCity.name,
            search_radius: selectedCity.radius
          },
          cleanup_after: true
        }
      });

      if (error) throw error;
      setResult(data);
    } catch (error: any) {
      setResult({ 
        success: false, 
        error: error.message,
        details: error.toString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Test Géographique Avancé
        </CardTitle>
        <CardDescription>
          Simule un scénario complet avec 5 utilisateurs de test dans la ville de votre choix
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Ville de test
          </label>
          <Select
            value={selectedCity.name}
            onValueChange={(name) => setSelectedCity(TEST_LOCATIONS.find(l => l.name === name)!)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEST_LOCATIONS.map(loc => (
                <SelectItem key={loc.name} value={loc.name}>
                  {loc.name} (rayon {loc.radius / 1000}km)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Coordonnées: {selectedCity.lat.toFixed(4)}, {selectedCity.lng.toFixed(4)}
          </p>
        </div>

        <Button 
          onClick={runTest} 
          disabled={isRunning} 
          className="w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Test en cours...
            </>
          ) : (
            "Lancer Test Complet"
          )}
        </Button>

        {result && (
          <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <AlertDescription className="font-semibold text-base">
                  {result.success ? '✅ Test Réussi' : '❌ Test Échoué'}
                </AlertDescription>
                
                {result.message && (
                  <p className="text-sm">{result.message}</p>
                )}

                {result.bar_info && (
                  <div className="text-sm space-y-1.5 pt-2 border-t">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <strong>Bar:</strong> {result.bar_info.bar_name}
                    </p>
                    <p className="text-muted-foreground pl-6">
                      {result.bar_info.bar_address}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <strong>Temps:</strong> {result.wait_time_seconds}s
                    </p>
                    <p className="text-xs text-muted-foreground pl-6">
                      Coords: {result.bar_info.bar_latitude?.toFixed(4)}, {result.bar_info.bar_longitude?.toFixed(4)}
                    </p>
                  </div>
                )}

                {result.error && (
                  <div className="text-sm text-red-600 pt-2 border-t">
                    <p className="font-semibold">Erreur:</p>
                    <p>{result.error}</p>
                    {result.details && (
                      <p className="text-xs mt-1 font-mono bg-red-100 p-2 rounded">
                        {result.details}
                      </p>
                    )}
                  </div>
                )}

                {result.cleanup_performed && (
                  <p className="text-xs text-muted-foreground pt-2">
                    🧹 Cleanup automatique effectué (users + groupe supprimés)
                  </p>
                )}
              </div>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

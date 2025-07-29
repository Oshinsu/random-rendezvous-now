
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, Clock, Star } from 'lucide-react';
import { useOutingsHistory } from '@/hooks/useOutingsHistory';
import { formatMeetingTime } from '@/components/map/utils';
import BarRatingDialog from '@/components/BarRatingDialog';
import { createTestOutingHistory, cleanupTestData } from '@/utils/testOutingsHistory';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const OutingsHistory = () => {
  const { data: outings, isLoading, error } = useOutingsHistory();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleCreateTestData = async () => {
    if (!user?.id) return;
    
    try {
      await createTestOutingHistory(user.id);
      // Refetch the outings history
      queryClient.invalidateQueries({ queryKey: ['outings-history', user.id] });
    } catch (error) {
      console.error('Failed to create test data:', error);
    }
  };

  const handleCleanupTestData = async () => {
    if (!user?.id) return;
    
    try {
      await cleanupTestData(user.id);
      // Refetch the outings history
      queryClient.invalidateQueries({ queryKey: ['outings-history', user.id] });
    } catch (error) {
      console.error('Failed to cleanup test data:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-1 text-base">
            <Calendar className="h-4 w-4" />
            <span>Historique des Aventures</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-600">Chargement de votre historique...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-red-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-1 text-base text-red-800">
            <Calendar className="h-4 w-4" />
            <span>Historique des Aventures</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Erreur lors du chargement de l'historique</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-1 text-base">
          <Calendar className="h-4 w-4" />
          <span>Historique des Aventures</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Vos dernières sorties avec Random
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!outings || outings.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Aucune aventure pour l'instant</h4>
              <p className="text-xs text-gray-600 mt-1">
                Rejoignez votre premier groupe pour commencer votre aventure !
              </p>
              
              {/* Test buttons for development */}
              <div className="flex gap-2 mt-4 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateTestData}
                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  🧪 Créer test data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanupTestData}
                  className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                >
                  🧹 Nettoyer test data
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {outings.map((outing) => (
              <div
                key={outing.id}
                className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-amber-600" />
                      {outing.bar_name}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{outing.bar_address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-xs">
                      Terminée
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatMeetingTime(outing.meeting_time)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{outing.participants_count} participants</span>
                    </div>
                  </div>
                  <span className="text-amber-600 font-medium">
                    {new Date(outing.completed_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {/* Section de notation */}
                <div className="flex items-center justify-between pt-2 border-t border-amber-200/50">
                  {outing.user_rating ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < outing.user_rating! 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">Votre note</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Pas encore noté</span>
                  )}
                  
                  <BarRatingDialog outing={outing}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 py-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {outing.user_rating ? 'Modifier' : 'Noter'}
                    </Button>
                  </BarRatingDialog>
                </div>
              </div>
            ))}
            
            {outings.length > 0 && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  {outings.length} aventure{outings.length > 1 ? 's' : ''} terminée{outings.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OutingsHistory;

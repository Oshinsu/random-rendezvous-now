import { Check, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface GroupProgressIndicatorProps {
  currentParticipants: number;
  maxParticipants: number;
  hasBar: boolean;
  groupStatus: 'waiting' | 'confirmed' | 'completed' | 'cancelled' | 'full';
}

const GroupProgressIndicator = ({ 
  currentParticipants, 
  maxParticipants, 
  hasBar, 
  groupStatus 
}: GroupProgressIndicatorProps) => {
  const progressPercentage = (currentParticipants / maxParticipants) * 100;
  const isComplete = currentParticipants >= maxParticipants;
  
  const steps = [
    {
      id: 1,
      label: 'Formation',
      completed: currentParticipants > 0,
      active: !isComplete,
      icon: Clock,
    },
    {
      id: 2,
      label: 'Groupe complet',
      completed: isComplete,
      active: isComplete && !hasBar,
      icon: Check,
    },
    {
      id: 3,
      label: 'Bar assigné',
      completed: hasBar,
      active: hasBar,
      icon: MapPin,
    },
  ];

  return (
    <Card className="glass-card border-brand-200">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-heading font-semibold text-neutral-700">
                {isComplete ? '🎉 Groupe complet' : `${currentParticipants}/${maxParticipants} participants`}
              </span>
              <span className="text-xs text-neutral-500 font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2.5 bg-neutral-100"
            />
            {!isComplete && (
              <p className="text-xs text-neutral-600 mt-2">
                ✨ Plus que {maxParticipants - currentParticipants} {maxParticipants - currentParticipants === 1 ? 'personne' : 'personnes'} et on trouve un bar !
              </p>
            )}
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-start relative">
            {/* Connection line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-neutral-200 -z-10" />
            <div 
              className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500 -z-10"
              style={{ 
                width: hasBar ? '100%' : isComplete ? '66%' : '33%' 
              }}
            />

            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center flex-1 relative">
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      transition-all duration-300 shadow-medium
                      ${step.completed 
                        ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white scale-110' 
                        : step.active
                          ? 'bg-white border-2 border-brand-500 text-brand-600 animate-pulse'
                          : 'bg-neutral-100 border-2 border-neutral-300 text-neutral-400'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span 
                    className={`
                      mt-2 text-xs font-heading font-semibold text-center
                      ${step.completed 
                        ? 'text-brand-700' 
                        : step.active 
                          ? 'text-neutral-700' 
                          : 'text-neutral-400'
                      }
                    `}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupProgressIndicator;

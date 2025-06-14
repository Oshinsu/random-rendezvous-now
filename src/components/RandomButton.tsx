
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dice6, Users, Clock } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

const RandomButton = () => {
  const { joinRandomGroup, loading } = useGroups();
  const [isRolling, setIsRolling] = useState(false);

  const handleRandomClick = async () => {
    setIsRolling(true);
    
    // Animation du dé qui roule
    setTimeout(async () => {
      const success = await joinRandomGroup();
      setIsRolling(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-8 bg-background rounded-2xl border border-border/50">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-heading font-bold">Prêt pour l'Aventure ?</h2>
        <p className="text-muted-foreground">
          Un clic, un groupe de 5, un bar mystère. C'est parti !
        </p>
      </div>

      <div className="relative">
        <Button
          onClick={handleRandomClick}
          disabled={loading || isRolling}
          size="lg"
          className={`
            bg-primary hover:bg-primary/90 text-primary-foreground 
            px-12 py-8 text-xl font-bold rounded-full
            transition-all duration-300 transform
            ${isRolling ? 'animate-pulse scale-110' : 'hover:scale-105'}
            shadow-2xl shadow-primary/25
          `}
        >
          <Dice6 
            className={`mr-3 h-8 w-8 ${isRolling ? 'animate-spin' : ''}`} 
          />
          {isRolling ? 'Lancement des dés...' : 'RANDOM !'}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center space-y-1">
          <Users className="h-5 w-5 text-primary" />
          <span>5 Personnes</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <Clock className="h-5 w-5 text-primary" />
          <span>Instant</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <Dice6 className="h-5 w-5 text-primary" />
          <span>100% Random</span>
        </div>
      </div>
    </div>
  );
};

export default RandomButton;

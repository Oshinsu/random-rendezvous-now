import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { pushEvent } from "@/utils/marketingAnalytics";

const StickyCta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    pushEvent('cta_sticky_click', { logged_in: !!user });
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-50">
      <div className="rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg px-3 py-2 flex items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground">
          Gratuit en bêta • 18+
        </div>
        <Button size="sm" onClick={handleClick} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Lancer Random
        </Button>
      </div>
    </div>
  );
};

export default StickyCta;

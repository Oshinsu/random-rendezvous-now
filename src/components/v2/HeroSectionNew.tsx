import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { trackCTAClick } from "@/utils/cmsTracking";
import { EnhancedSearchButtonV2 } from "@/components/v2/EnhancedSearchButtonV2";
import { motion } from 'framer-motion';
import { ArrowRight, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HeroSectionNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveCount, setLiveCount] = useState(0);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalOutings: 0,
    totalBars: 0,
  });

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Count active groups (waiting + confirmed)
        const { count: groupCount } = await supabase
          .from('groups')
          .select('*', { count: 'exact', head: true })
          .in('status', ['waiting', 'confirmed']);
        
        setLiveCount(groupCount || 0);

        // Count total users
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Count total outings (completed groups)
        const { count: outingsCount } = await supabase
          .from('groups')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');

        // Count bar owners
        const { count: barsCount } = await supabase
          .from('bar_owners')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved');

        setStats({
          totalMembers: usersCount || 0,
          totalOutings: outingsCount || 0,
          totalBars: barsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    
    // Refresh every 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMainAction = async () => {
    trackCTAClick('hero', user ? 'go_to_dashboard' : 'signup');
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-[#fffbe8] to-[#f1c232]/20">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-hero opacity-60" style={{ backgroundSize: '200% 200%' }} />
      
      {/* Floating orbs (glassmorphism) */}
      <motion.div 
        className="absolute top-20 left-20 w-96 h-96 bg-[#f1c232]/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-80 h-80 bg-white/20 rounded-full blur-3xl"
        animate={{ 
          x: [0, -80, 0],
          y: [0, 80, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <div className="container relative z-10 px-6">
        {/* Live indicator */}
        {liveCount > 0 && (
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-full border border-[#f1c232]/20 mb-8 shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f1c232] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#f1c232]"></span>
            </span>
            <span className="text-sm font-medium text-neutral-700">
              {liveCount} groupe{liveCount > 1 ? 's' : ''} actif{liveCount > 1 ? 's' : ''} en ce moment
            </span>
          </motion.div>
        )}
        
        {/* Hero title - Vercel-inspired */}
        <motion.h1 
          className="text-6xl md:text-8xl lg:text-9xl font-display font-black tracking-tighter leading-none mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Trouve ton groupe.
          <br />
          <span className="gradient-text-white-gold">
            Ce soir.
          </span>
        </motion.h1>
        
        {/* Subtitle - Problem-first */}
        <motion.p 
          className="text-xl md:text-2xl lg:text-3xl text-neutral-600 dark:text-neutral-400 max-w-3xl mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Pas de ghosting. Pas de messages sans réponse. 
          <br />
          Juste un groupe de 5, un bar, et une soirée vraie.
        </motion.p>
        
        {/* CTA area */}
        <motion.div 
          className="flex flex-col items-center gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {user ? (
            <EnhancedSearchButtonV2
              onSearch={handleMainAction}
              isSearching={false}
              isDisabled={false}
            />
          ) : (
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => {
                  trackCTAClick('hero', 'signup');
                  navigate('/auth?tab=signup');
                }}
                className="group gradient-button hover:shadow-[0_0_60px_rgba(241,194,50,0.5)] text-[#825c16] font-bold text-lg px-8 py-6 h-auto border-2 border-[#f1c232]/30"
              >
                Trouver mon groupe
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                onClick={() => {
                  // Scroll to How It Works
                  document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-2 border-[#f1c232]/30 hover:bg-[#fffbe8]/50 text-neutral-700 dark:text-neutral-300 font-semibold text-lg px-8 py-6 h-auto"
              >
                Comment ça marche ?
              </Button>
            </div>
          )}
        </motion.div>
        
        {/* Social proof - Mini stats */}
        {(stats.totalMembers > 0 || stats.totalOutings > 0 || stats.totalBars > 0) && (
          <motion.div 
            className="flex flex-wrap gap-8 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {stats.totalMembers > 0 && (
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-3 rounded-2xl border border-[#f1c232]/20">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f1c232] to-[#c08a15] border-2 border-white" />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{stats.totalMembers} membres</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">à Paris</p>
                </div>
              </div>
            )}
            
            {stats.totalOutings > 0 && (
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-3 rounded-2xl border border-[#f1c232]/20">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f1c232] to-[#c08a15] flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{stats.totalOutings} sorties</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">ce mois-ci</p>
                </div>
              </div>
            )}
            
            {stats.totalBars > 0 && (
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-3 rounded-2xl border border-[#f1c232]/20">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f1c232] to-[#c08a15] flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{stats.totalBars} bars</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">partenaires</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default HeroSectionNew;


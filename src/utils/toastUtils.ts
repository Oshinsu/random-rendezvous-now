
import { toast } from "@/hooks/use-toast";

// Store des notifications actives pour éviter les doublons
const activeToasts = new Set<string>();

export const showUniqueToast = (message: string, title?: string, variant?: "default" | "destructive") => {
  const toastKey = `${title || ''}_${message}`;
  
  // Si ce toast est déjà affiché, on l'ignore
  if (activeToasts.has(toastKey)) {
    return;
  }
  
  // Marquer ce toast comme actif
  activeToasts.add(toastKey);
  
  // Afficher le toast
  toast({
    title,
    description: message,
    variant,
    duration: 3000, // 3 secondes
  });
  
  // Retirer de la liste après 3 secondes
  setTimeout(() => {
    activeToasts.delete(toastKey);
  }, 3500);
};

export const clearActiveToasts = () => {
  activeToasts.clear();
};

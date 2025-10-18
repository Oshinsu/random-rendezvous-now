-- Désactiver le mode Pay-Per-Use (PPU)
-- Cela permettra aux groupes de 5 personnes de passer directement en 'confirmed'
-- au lieu de 'awaiting_payment', et donc de déclencher l'auto-assignment du bar

UPDATE public.system_settings
SET 
  setting_value = '[false]'::jsonb,
  updated_at = NOW()
WHERE setting_key = 'ppu_mode_enabled';

-- Vérification
SELECT setting_key, setting_value, updated_at
FROM public.system_settings
WHERE setting_key = 'ppu_mode_enabled';
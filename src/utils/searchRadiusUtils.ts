import { supabase } from "@/integrations/supabase/client";

/**
 * Get the default search radius from system settings
 * @returns Promise<number> - Search radius in meters (defaults to 25000 if not found)
 */
export async function getSearchRadius(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'default_search_radius')
      .single();

    if (error) {
      console.warn('⚠️ Could not fetch search radius from settings, using default 25km:', error);
      return 25000; // Default fallback
    }

    const radius = parseInt(data.setting_value as string);
    return isNaN(radius) ? 25000 : radius;
  } catch (error) {
    console.warn('⚠️ Error fetching search radius, using default 25km:', error);
    return 25000; // Default fallback
  }
}
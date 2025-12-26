import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Créer un client Supabase avec la clé SERVICE_ROLE (Admin)
    // Cette clé est injectée automatiquement dans l'environnement Deno
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { query, type } = await req.json()
    let result;

    if (type === 'rpc') {
      // Appel RPC
      const { data, error } = await supabaseAdmin.rpc(query.name, query.params)
      if (error) throw error
      result = data
    } else {
      // Pour l'instant, on ne peut pas exécuter de SQL brut facilement via JS client
      // sauf si on a une fonction RPC 'exec_sql' installée.
      // On va plutôt utiliser les méthodes standard de l'API
      
      if (query.table) {
        let q = supabaseAdmin.from(query.table).select(query.select || '*')
        
        if (query.filter) {
          // Support basique pour filtre simple
          const [col, val] = Object.entries(query.filter)[0]
          q = q.eq(col, val)
        }
        
        if (query.order) {
            q = q.order(query.order.column, { ascending: query.order.ascending })
        }

        const { data, error } = await q
        if (error) throw error
        result = data
      }
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})


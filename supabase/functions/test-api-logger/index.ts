
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Testing API logger functionality...')
    
    // Test data to send to api-logger
    const testData = {
      api_name: 'test-api',
      endpoint: '/test/diagnostic',
      request_type: 'diagnostic',
      status_code: 200,
      response_time_ms: 150,
      cost_usd: 0.001,
      metadata: {
        test_timestamp: new Date().toISOString(),
        diagnostic: true,
        source: 'test-api-logger'
      }
    }

    // Call the api-logger function
    const apiLoggerResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/api-logger`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify(testData)
      }
    )

    const apiLoggerResult = await apiLoggerResponse.json()
    
    console.log('📝 API Logger Response:', apiLoggerResult)

    if (apiLoggerResponse.ok && apiLoggerResult.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'API logger test successful!',
          testData,
          apiLoggerResult 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    } else {
      throw new Error(`API logger test failed: ${JSON.stringify(apiLoggerResult)}`)
    }

  } catch (error) {
    console.error('❌ API logger test failed:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Test failed - check logs for details'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
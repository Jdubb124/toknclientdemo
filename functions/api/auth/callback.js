export async function onRequestPost(context) {
    try {
      const { code, state } = await context.request.json();
      
      if (!code || !state) {
        return new Response(JSON.stringify({
          error: 'Missing required parameters'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
  
      // Exchange code with your Tokn MVP backend
      const response = await fetch(`${context.env.TOKN_API_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${context.env.TOKN_CLIENT_ID}:${context.env.TOKN_CLIENT_SECRET}`)}`
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `https://streamflix-demo.pages.dev/auth/callback`
        })
      });
  
      const tokenData = await response.json();
  
      // Fetch age verification from your Tokn MVP
      const ageResponse = await fetch(`${context.env.TOKN_API_URL}/api/v1/age-verification`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
  
      const ageData = await ageResponse.json();
  
      return new Response(JSON.stringify({
        verified: true,
        ageFlags: ageData.age_flags,
        verificationDate: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
  
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
// Updated functions/api/auth/callback.js
// This now proxies to your REAL Tokn MVP backend

export async function onRequest(context) {
    // Handle CORS preflight
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
  
    if (context.request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
  
    try {
      const { code, code_verifier, client_id } = await context.request.json();
      
      if (!code || !code_verifier || !client_id) {
        return new Response(JSON.stringify({
          error: 'Missing required parameters'
        }), { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
  
      // Forward request to your REAL Tokn MVP backend
      const toknMvpUrl = context.env.TOKN_MVP_URL || 'http://localhost:5001';
      
      const tokenResponse = await fetch(`${toknMvpUrl}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          client_id: client_id,
          code_verifier: code_verifier
        })
      });
  
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }
  
      const tokenData = await tokenResponse.json();
  
      // Fetch age verification from your Tokn MVP
      const verifyResponse = await fetch(`${toknMvpUrl}/api/oauth/verify`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
  
      if (!verifyResponse.ok) {
        throw new Error(`Age verification failed: ${verifyResponse.status}`);
      }
  
      const userData = await verifyResponse.json();
  
      // Return the REAL age flags from your Tokn MVP
      return new Response(JSON.stringify({
        verified: true,
        ageFlags: {
          is_16_plus: userData.is_16_plus || false,
          is_18_plus: userData.is_18_plus || false,
          is_21_plus: userData.is_21_plus || false
        },
        verificationDate: new Date().toISOString(),
        source: 'tokn-mvp'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
  
    } catch (error) {
      console.error('OAuth callback error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  // Updated functions/api/config.js
  // Return real Tokn MVP configuration
  
  export async function onRequest(context) {
    return new Response(JSON.stringify({
      toknClientId: 'demo-client-123', // Your actual OAuth client ID
      toknApiUrl: context.env.TOKN_MVP_URL || 'http://localhost:5001',
      environment: 'production',
      demoMode: false, // Now using real backend!
      redirectUri: `${new URL(context.request.url).origin}/api/auth/callback`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
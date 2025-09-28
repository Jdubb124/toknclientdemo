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
  
    if (context.request.method !== 'POST' && context.request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    console.log('OAuth callback received request:', {
      url: context.request.url,
      method: context.request.method,
      headers: Object.fromEntries(context.request.headers.entries())
    });
  
    try {
      let code, code_verifier, client_id, redirect_uri;
      
      if (context.request.method === 'POST') {
        // Handle POST request from SDK
        const body = await context.request.json();
        console.log('OAuth callback body:', body);
        ({ code, code_verifier, client_id, redirect_uri } = body);
      } else if (context.request.method === 'GET') {
        // Handle GET request from browser redirect
        const url = new URL(context.request.url);
        code = url.searchParams.get('code');
        code_verifier = url.searchParams.get('code_verifier');
        client_id = url.searchParams.get('client_id');
        redirect_uri = url.searchParams.get('redirect_uri');
        console.log('OAuth callback GET params:', { code, code_verifier, client_id, redirect_uri });
      }
      
      if (!code || !code_verifier || !client_id) {
        console.error('Missing required parameters:', { code: !!code, code_verifier: !!code_verifier, client_id: !!client_id });
        return new Response(JSON.stringify({
          error: 'Missing required parameters',
          received: { code: !!code, code_verifier: !!code_verifier, client_id: !!client_id }
        }), { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
  
      // Forward request to your REAL Tokn MVP backend
      const toknMvpUrl = context.env.TOKN_API_URL || 'https://tokn-backend-505250569367.us-east5.run.app';
      
      const tokenResponse = await fetch(`${toknMvpUrl}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          client_id: client_id,
          code_verifier: code_verifier,
          redirect_uri: redirect_uri
        })
      });
  
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('TOKN MVP token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText,
          requestData: {
            grant_type: 'authorization_code',
            code: code ? code.substring(0, 10) + '...' : 'missing',
            client_id: client_id,
            code_verifier: code_verifier ? code_verifier.substring(0, 10) + '...' : 'missing',
            redirect_uri: redirect_uri
          }
        });
        throw new Error(`Token exchange failed: ${errorText}`);
      }
  
      const tokenData = await tokenResponse.json();
  
      // Return the token data from TOKN MVP (OAuth 2.0 standard format)
      return new Response(JSON.stringify({
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_in: tokenData.expires_in || 3600,
        scope: tokenData.scope || 'age_verification'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache'
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
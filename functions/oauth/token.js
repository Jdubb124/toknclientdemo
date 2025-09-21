// functions/oauth/token.js
// This handles the OAuth token exchange endpoint that the TOKN SDK calls

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

    console.log('OAuth token endpoint received request:', {
      url: context.request.url,
      method: context.request.method,
      headers: Object.fromEntries(context.request.headers.entries())
    });
  
    try {
      const body = await context.request.json();
      console.log('OAuth token body:', body);
      
      const { code, code_verifier, client_id, redirect_uri } = body;
      
      if (!code || !code_verifier || !client_id) {
        console.error('Missing required parameters:', { code: !!code, code_verifier: !!code_verifier, client_id: !!client_id });
        return new Response(JSON.stringify({
          error: 'invalid_request',
          error_description: 'Missing required parameters',
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
      
      console.log('Forwarding token request to TOKN MVP:', toknMvpUrl);
      
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
  
      console.log('TOKN MVP token response status:', tokenResponse.status);
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('TOKN MVP token error:', errorText);
        return new Response(JSON.stringify({
          error: 'invalid_grant',
          error_description: errorText
        }), { 
          status: tokenResponse.status,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
  
      const tokenData = await tokenResponse.json();
      console.log('TOKN MVP token data received:', { 
        has_access_token: !!tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in
      });
  
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
      console.error('OAuth token error:', error);
      
      return new Response(JSON.stringify({
        error: 'server_error',
        error_description: 'Internal server error: ' + error.message
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

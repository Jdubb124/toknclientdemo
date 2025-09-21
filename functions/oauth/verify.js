// functions/oauth/verify.js
// This handles the OAuth verify endpoint that the TOKN SDK calls

export async function onRequest(context) {
    // Handle CORS preflight
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
  
    if (context.request.method !== 'GET' && context.request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    console.log('OAuth verify endpoint received request:', {
      url: context.request.url,
      method: context.request.method,
      headers: Object.fromEntries(context.request.headers.entries())
    });
  
    try {
      // Get Authorization header
      const authHeader = context.request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Missing or invalid Authorization header');
        return new Response(JSON.stringify({
          error: 'invalid_token',
          error_description: 'Missing or invalid Authorization header'
        }), { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const accessToken = authHeader.replace('Bearer ', '');
      console.log('Verifying with access token:', accessToken.substring(0, 20) + '...');
  
      // Forward request to your REAL Tokn MVP backend
      const toknMvpUrl = context.env.TOKN_API_URL || 'https://tokn-backend-505250569367.us-east5.run.app';
      
      console.log('Forwarding verify request to TOKN MVP:', toknMvpUrl);
      
      const verifyResponse = await fetch(`${toknMvpUrl}/api/oauth/verify`, {
        method: context.request.method, // Use same method as incoming request
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
  
      console.log('TOKN MVP verify response status:', verifyResponse.status);
      
      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error('TOKN MVP verify error:', errorText);
        return new Response(JSON.stringify({
          error: 'verification_failed',
          error_description: errorText
        }), { 
          status: verifyResponse.status,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
  
      const userData = await verifyResponse.json();
      console.log('TOKN MVP user data received:', {
        has_user_data: !!userData,
        is_16_plus: userData.is_16_plus,
        is_18_plus: userData.is_18_plus,
        is_21_plus: userData.is_21_plus
      });
  
      // Return the age verification data in the format expected by TOKN SDK
      return new Response(JSON.stringify({
        verified: true,
        age_flags: {
          is_16_plus: userData.is_16_plus || false,
          is_18_plus: userData.is_18_plus || false,
          is_21_plus: userData.is_21_plus || false
        },
        verification_date: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
        user_id: userData.id || userData.user_id
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
  
    } catch (error) {
      console.error('OAuth verify error:', error);
      
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

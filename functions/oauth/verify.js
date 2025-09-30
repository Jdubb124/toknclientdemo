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
      console.log('Full access token length:', accessToken.length);
  
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
      console.log('TOKN MVP user data received (full response):', JSON.stringify(userData, null, 2));
      console.log('TOKN MVP user data summary:', {
        has_user_data: !!userData,
        userData_keys: Object.keys(userData || {}),
        user_info: {
          email: userData.email || userData.user_email || 'not provided',
          first_name: userData.first_name || userData.firstName || 'not provided',
          last_name: userData.last_name || userData.lastName || 'not provided',
          full_name: userData.full_name || userData.name || 'not provided',
          user_id: userData.id || userData.user_id || 'not provided'
        },
        age_verification: {
          is_16_plus: userData.is_16_plus,
          is_18_plus: userData.is_18_plus,
          is_21_plus: userData.is_21_plus
        },
        raw_values: {
          is_16_plus_type: typeof userData.is_16_plus,
          is_18_plus_type: typeof userData.is_18_plus,
          is_21_plus_type: typeof userData.is_21_plus
        },
        // Debug the actual values more thoroughly
        debug_values: {
          is_16_plus_raw: userData.is_16_plus,
          is_16_plus_stringified: JSON.stringify(userData.is_16_plus),
          is_16_plus_boolean: Boolean(userData.is_16_plus),
          is_16_plus_truthy: !!userData.is_16_plus,
          is_16_plus_strict_true: userData.is_16_plus === true,
          is_16_plus_strict_string_true: userData.is_16_plus === "true"
        }
      });
      console.log('PRE-CONVERSION Values:', {
        is_16_plus_raw: userData.is_16_plus,
        is_16_plus_type: typeof userData.is_16_plus,
        is_18_plus_raw: userData.is_18_plus,
        is_18_plus_type: typeof userData.is_18_plus,
        is_21_plus_raw: userData.is_21_plus,
        is_21_plus_type: typeof userData.is_21_plus,
        full_userData: JSON.stringify(userData)
      });
      // Convert to proper booleans for frontend
      // Handle different data types that might come from the database
      const convertToBoolean = (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        if (typeof value === 'number') return value !== 0;
        return Boolean(value);
      };

      const ageFlags = {
        is_16_plus: convertToBoolean(
          userData.is_16_plus ?? 
          userData.age_flags?.is_16_plus ?? 
          userData.ageFlags?.is_16_plus ?? 
          false
        ),
        is_18_plus: convertToBoolean(
          userData.is_18_plus ?? 
          userData.age_flags?.is_18_plus ?? 
          userData.ageFlags?.is_18_plus ?? 
          false
        ),
        is_21_plus: convertToBoolean(
          userData.is_21_plus ?? 
          userData.age_flags?.is_21_plus ?? 
          userData.ageFlags?.is_21_plus ?? 
          false
        )
      };
      
      // Add debug log
      console.log('FINAL Converted age flags:', {
        is_16_plus: ageFlags.is_16_plus,
        is_18_plus: ageFlags.is_18_plus,
        is_21_plus: ageFlags.is_21_plus
      });
      
      console.log('Converted age flags for frontend:', {
        original: {
          is_16_plus: userData.is_16_plus,
          is_18_plus: userData.is_18_plus,
          is_21_plus: userData.is_21_plus
        },
        converted: ageFlags,
        types: {
          is_16_plus: typeof ageFlags.is_16_plus,
          is_18_plus: typeof ageFlags.is_18_plus,
          is_21_plus: typeof ageFlags.is_21_plus
        }
      });

      // Return the age verification data in the format expected by TOKN SDK
      return new Response(JSON.stringify({
        verified: true,
        age_flags: ageFlags,
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

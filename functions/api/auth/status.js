export async function onRequest(context) {
    return new Response(JSON.stringify({
      authenticated: false,
      verified: false,
      ageFlags: {
        is_16_plus: false,
        is_18_plus: false,
        is_21_plus: false
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
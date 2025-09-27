export async function onRequest(context) {
    return new Response(JSON.stringify({
      toknClientId: context.env.TOKN_CLIENT_ID || 'demo-client-123',
      toknApiUrl: context.env.TOKN_API_URL || 'https://tokn-backend-505250569367.us-east5.run.app',
      authUrl: context.env.TOKN_AUTH_URL || 'https://toknmvp.web.app',
      environment: context.env.ENVIRONMENT || 'production',
      demoMode: false,
      redirectUri: `${new URL(context.request.url).origin}/`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
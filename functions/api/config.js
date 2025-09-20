export async function onRequest(context) {
    return new Response(JSON.stringify({
      toknClientId: 'demo-client-123',
      toknApiUrl: context.env.TOKN_MVP_URL || 'http://localhost:5001',
      environment: 'production',
      demoMode: false,
      redirectUri: `${new URL(context.request.url).origin}/api/auth/callback`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
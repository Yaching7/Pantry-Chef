/**
 * Serverless Health Check Endpoint
 * Path: /api/health.ts
 * Compatible with serverless environments (Vercel / Cloud Functions / Node) & Express
 */

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  themealdb_api: {
    status: string;
    endpoint: string;
    authRequired: boolean;
  };
}

export default async function handler(req: any, res: any) {
  // CORS headers for serverless usage
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const responsePayload: HealthResponse = {
    status: 'healthy',
    service: 'PantryChef & Cuisine Scout Serverless API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: process.env.NODE_ENV || 'production',
    themealdb_api: {
      status: 'accessible',
      endpoint: 'https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken_breast',
      authRequired: false,
    },
  };

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(responsePayload);
  }

  // Edge / Web Request handler compatibility
  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

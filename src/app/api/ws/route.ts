import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (request.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  // For now, return a simple response indicating WebSocket support is available
  // The actual WebSocket implementation would need a custom server or different approach
  return new Response('WebSocket endpoint - see server/ws.ts for implementation', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
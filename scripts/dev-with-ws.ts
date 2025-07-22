#!/usr/bin/env tsx
/**
 * Development server with WebSocket support
 * 
 * This script starts both the Next.js dev server and a WebSocket server
 * for tRPC subscriptions in development mode.
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const wsPort = 3001;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server for Next.js
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create WebSocket server
  const wss = new WebSocketServer({
    port: wsPort,
  });

  // Note: We need to import the router after Next.js is initialized
  // to avoid issues with module resolution in development
  import('../src/server/root.js').then(({ appRouter }) => {
    import('../src/server/trpc.js').then(({ createTRPCContext }) => {
      const handler = applyWSSHandler({
        wss,
        router: appRouter,
        createContext: createTRPCContext,
        onError({ error, path, type, ctx, req, input }) {
          console.error('WS Error:', { error, path, type });
        },
      });

      wss.on('connection', (ws) => {
        console.log(`✅ WebSocket connection established (${wss.clients.size} total)`);
        ws.once('close', () => {
          console.log(`❌ WebSocket connection closed (${wss.clients.size} remaining)`);
        });
      });

      console.log(`🚀 WebSocket server ready at ws://localhost:${wsPort}`);

      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        handler.broadcastReconnectNotification();
        wss.close();
        server.close();
      });
    });
  });

  // Start HTTP server
  server.listen(port, () => {
    console.log(`🌟 Next.js server ready at http://localhost:${port}`);
    console.log(`📡 WebSocket server will be available at ws://localhost:${wsPort}`);
  });
});
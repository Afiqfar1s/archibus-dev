import Fastify from 'fastify';
import cors from '@fastify/cors';
import dbPlugin from './plugins/db';
import authPlugin from './plugins/auth';
import rbacPlugin from './plugins/rbac';
import authRoutes from './routes/auth';
import serviceRequestRoutes from './routes/service-requests';
import referenceDataRoutes from './routes/reference-data';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

async function start() {
  try {
    // Register CORS
    await server.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    // Register plugins
    await server.register(dbPlugin);
    await server.register(authPlugin);
    await server.register(rbacPlugin);

    // Register routes
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(serviceRequestRoutes, { prefix: '/api/service-requests' });
    await server.register(referenceDataRoutes, { prefix: '/api/reference' });

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Start server
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 Server listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();

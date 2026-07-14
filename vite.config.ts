import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/', // CHANGED: Absolute path to prevent MIME type errors on routing
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'api-gateway',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (req.url && req.url.startsWith('/api/')) {
                const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
                const apiName = parsedUrl.pathname.replace(/^\/api\//, '');
                
                const fs = await import('fs');
                const path = await import('path');
                const apiPath = path.resolve(process.cwd(), 'api', `${apiName}.js`);
                
                if (!fs.existsSync(apiPath)) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: `API route /api/${apiName} not found` }));
                  return;
                }

                // Parse query
                const query: Record<string, string> = {};
                parsedUrl.searchParams.forEach((value, key) => {
                  query[key] = value;
                });
                (req as any).query = query;

                // Parse body if POST/PUT
                let body = {};
                if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                  try {
                    const buffers: any[] = [];
                    for await (const chunk of req) {
                      buffers.push(chunk);
                    }
                    const rawBody = Buffer.concat(buffers).toString();
                    if (rawBody && req.headers['content-type']?.includes('application/json')) {
                      body = JSON.parse(rawBody);
                    } else if (rawBody) {
                      body = rawBody;
                    }
                  } catch (err) {
                    console.error('Error parsing request body in dev proxy:', err);
                  }
                }
                (req as any).body = body;

                // Standard Vercel API response methods
                const mockRes = res as any;
                mockRes.status = function (statusCode: number) {
                  this.statusCode = statusCode;
                  return this;
                };
                mockRes.json = function (jsonBody: any) {
                  this.setHeader('Content-Type', 'application/json');
                  this.end(JSON.stringify(jsonBody));
                  return this;
                };
                mockRes.send = function (data: any) {
                  if (typeof data === 'object') {
                    this.setHeader('Content-Type', 'application/json');
                    this.end(JSON.stringify(data));
                  } else {
                    this.end(data);
                  }
                  return this;
                };

                try {
                  try {
                    delete require.cache[require.resolve(apiPath)];
                  } catch {}
                  const apiHandler = require(apiPath);
                  await apiHandler(req, mockRes);
                } catch (err: any) {
                  console.error(`Error in API route /api/${apiName}:`, err);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }));
                }
                return;
              }
              next();
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve('src'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
              'ui-vendor': ['lucide-react', 'motion', 'react-helmet-async']
            }
          }
        }
      }
    };
});
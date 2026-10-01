import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function marketPricesDevPlugin(): Plugin {
  return {
    name: 'market-prices-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/market-prices')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            const handlerModule = await server.ssrLoadModule('/api/market-prices.ts');
            const handler = handlerModule.default;
            const fakeReq: any = {
              method: req.method,
              query: Object.fromEntries(urlObj.searchParams.entries()),
              headers: req.headers
            };
            const fakeRes: any = {
              statusCode: 200,
              setHeader(k: string, v: string) {
                res.setHeader(k, v);
                return this;
              },
              status(code: number) {
                res.statusCode = code;
                return this;
              },
              json(data: any) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
              end(data?: any) {
                res.end(data);
              }
            };
            return await handler(fakeReq, fakeRes);
          } catch (e: any) {
            console.error('Dev API error:', e);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: e.message }));
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), marketPricesDevPlugin()],
  server: {
    watch: {
      ignored: ['**/.agents/**'],
    },
  },
})

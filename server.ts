import express, {
  Request,
  Response,
  NextFunction,
} from 'express';

import { createServer as createViteServer } from 'vite';

import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

dotenv.config();


// ============================================================
// PATHS
// ============================================================

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


// ============================================================
// CONFIG
// ============================================================

const app = express();

const PORT =
  Number(process.env.PORT || 3000);

const FASTAPI_URL = (
  process.env.FASTAPI_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');


// ============================================================
// BASIC EXPRESS CONFIG
// ============================================================

app.disable('x-powered-by');


// ============================================================
// READ REQUEST BODY
// ============================================================

async function readRequestBody(
  req: Request
): Promise<Buffer | undefined> {

  if (
    req.method === 'GET' ||
    req.method === 'HEAD'
  ) {
    return undefined;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    );
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return Buffer.concat(chunks);
}


// ============================================================
// FASTAPI PROXY
// ============================================================

app.use(
  '/api',
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const targetUrl =
        `${FASTAPI_URL}${req.originalUrl}`;


      const headers =
        new Headers();


      // ------------------------------------------------------
      // Forward headers
      // ------------------------------------------------------

      Object.entries(
        req.headers
      ).forEach(
        ([key, value]) => {

          const lowerKey =
            key.toLowerCase();

          if (
            lowerKey === 'host' ||
            lowerKey === 'content-length' ||
            lowerKey === 'connection'
          ) {
            return;
          }

          if (
            value === undefined
          ) {
            return;
          }

          headers.set(
            key,
            Array.isArray(value)
              ? value.join(', ')
              : value
          );
        }
      );


      // ------------------------------------------------------
      // Read request body
      // ------------------------------------------------------

      const body =
        await readRequestBody(req);


      // ------------------------------------------------------
      // Proxy to FastAPI
      //
      // `as any` is intentional here.
      // Node's fetch typings currently disagree with the
      // Buffer type produced by the Express request stream.
      // At runtime Node fetch accepts the body correctly.
      // ------------------------------------------------------

      const upstream =
        await fetch(
          targetUrl,
          {
            method: req.method,

            headers,

            body: body
              ? (body as any)
              : undefined,

            redirect: 'manual',
          }
        );


      // ------------------------------------------------------
      // Forward status
      // ------------------------------------------------------

      res.status(
        upstream.status
      );


      // ------------------------------------------------------
      // Forward response headers
      // ------------------------------------------------------

      upstream.headers.forEach(
        (value, key) => {

          const lowerKey =
            key.toLowerCase();

          if (
            lowerKey ===
              'transfer-encoding' ||
            lowerKey ===
              'connection'
          ) {
            return;
          }

          res.setHeader(
            key,
            value
          );
        }
      );


      // ------------------------------------------------------
      // Forward response body
      // ------------------------------------------------------

      if (
        upstream.body
      ) {

        const reader =
          upstream.body.getReader();

        try {

          while (true) {

            const {
              done,
              value,
            } = await reader.read();

            if (done) {
              break;
            }

            if (value) {
              res.write(value);
            }
          }

        } finally {

          reader.releaseLock();
        }

        res.end();

        return;
      }


      res.end();

    } catch (error) {

      console.error(
        'FastAPI proxy error:',
        error
      );

      if (!res.headersSent) {

        res.status(502).json({
          error:
            'InterviewIQ FastAPI backend is unavailable.',

          details:
            'Make sure FastAPI is running on port 8000.',
        });

        return;
      }

      next(error);
    }
  }
);


// ============================================================
// BACKEND HEALTH CHECK
// ============================================================

app.get(
  '/backend-health',
  async (
    _req: Request,
    res: Response
  ) => {

    try {

      const response =
        await fetch(
          `${FASTAPI_URL}/health`
        );

      const data =
        await response.json();

      res
        .status(response.status)
        .json(data);

    } catch {

      res.status(503).json({
        status: 'unavailable',
        service: 'InterviewIQ',
        backend:
          'FastAPI is not reachable.',
      });
    }
  }
);


// ============================================================
// VITE DEV / STATIC PROD
// ============================================================

async function startServer() {

  const isDevelopment =
    process.env.NODE_ENV !== 'production';


  if (isDevelopment) {

    const vite =
      await createViteServer({
        server: {
          middlewareMode: true,
        },
        appType: 'spa',
      });

    app.use(
      vite.middlewares
    );

  } else {

    const distPath =
      path.resolve(
        __dirname,
        'dist'
      );

    app.use(
      express.static(
        distPath
      )
    );

    app.get(
      '*',
      (
        _req: Request,
        res: Response
      ) => {

        res.sendFile(
          path.join(
            distPath,
            'index.html'
          )
        );
      }
    );
  }


  // ==========================================================
  // START
  // ==========================================================

  app.listen(
    PORT,
    '0.0.0.0',
    () => {

      console.log(
        `InterviewIQ frontend server listening on http://localhost:${PORT}`
      );

      console.log(
        `FastAPI backend: ${FASTAPI_URL}`
      );
    }
  );
}


// ============================================================
// STARTUP
// ============================================================

startServer().catch(
  (error) => {

    console.error(
      'Failed to start InterviewIQ server:',
      error
    );

    process.exit(1);
  }
);
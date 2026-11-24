import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AnalysisResult } from '../analyzer/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerOptions {
  port?: number;
  host?: string;
  data: AnalysisResult;
}

export class NgLensServer {
  private server: http.Server | null = null;
  private options: ServerOptions;

  constructor(options: ServerOptions) {
    this.options = {
      port: options.port || 4242,
      host: options.host || 'localhost',
      data: options.data
    };
  }

  /**
   * Generates the complete HTML string with analysis data embedded.
   */
  public static getHtmlWithData(data: AnalysisResult): string {
    const htmlTemplatePath = path.resolve(__dirname, '../ui/index.html');
    if (!fs.existsSync(htmlTemplatePath)) {
      throw new Error(`UI bundle not found at ${htmlTemplatePath}. Please run npm run build.`);
    }

    const template = fs.readFileSync(htmlTemplatePath, 'utf-8');
    const safeDataJson = JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
    const dataScript = `window.__NGLENS_DATA__ = ${safeDataJson};`;
    return template.split('/* INJECTED_DATA */').join(dataScript);
  }

  /**
   * Start local HTTP server to serve visual graph.
   */
  public async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      const html = NgLensServer.getHtmlWithData(this.options.data);

      this.server = http.createServer((req, res) => {
        if (req.url === '/api/data') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(this.options.data));
          return;
        }

        // Serve main visual app
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          // Retry on next port
          this.options.port = (this.options.port || 4242) + 1;
          this.server?.listen(this.options.port, this.options.host);
        } else {
          reject(err);
        }
      });

      this.server.listen(this.options.port, this.options.host, () => {
        const url = `http://${this.options.host}:${this.options.port}`;
        resolve(url);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}

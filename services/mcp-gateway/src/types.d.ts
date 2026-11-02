declare module "express" {
  import type { IncomingMessage, ServerResponse } from "node:http";

  export interface Request extends IncomingMessage {
    params: Record<string, string>;
    query: Record<string, string>;
    body: unknown;
    headers: Record<string, string | string[] | undefined>;
    path: string;
  }

  export interface Response extends ServerResponse {
    status(code: number): this;
    json(body: unknown): this;
    send(body: unknown): this;
  }

  export interface Application {
    use(...middlewares: unknown[]): this;
    get(path: string, ...handlers: Array<(req: Request, res: Response) => unknown>): this;
    post(path: string, ...handlers: Array<(req: Request, res: Response) => unknown>): this;
    listen(port: number, host: string, callback?: () => void): unknown;
    listen(port: number, callback?: () => void): unknown;
  }

  function express(): Application;
  namespace express {
    export function json(options?: unknown): unknown;
  }

  export default express;
}

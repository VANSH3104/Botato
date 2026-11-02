declare module "express" {
  import type { IncomingMessage, ServerResponse } from "node:http";

  export interface Request extends IncomingMessage {
    params: Record<string, string>;
    query: Record<string, string>;
    body: any;
    headers: Record<string, string | string[] | undefined>;
    path: string;
  }

  export interface Response extends ServerResponse {
    status(code: number): this;
    json(body: unknown): this;
    send(body: unknown): this;
  }

  export interface Application {
    use(...middlewares: any[]): this;
    get(path: string, ...handlers: Array<(req: Request, res: Response) => any>): this;
    post(path: string, ...handlers: Array<(req: Request, res: Response) => any>): this;
    listen(port: number, host: string, callback?: () => void): any;
    listen(port: number, callback?: () => void): any;
  }

  function express(): Application;
  namespace express {
    export function json(options?: any): any;
  }

  export default express;
}

import { ClientJwtPayload } from '../../src/modules/client/middleware/auth';

declare global {
  namespace Express {
    interface Request {
      client?: ClientJwtPayload;
    }
  }
}
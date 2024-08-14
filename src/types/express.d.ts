import { UserDocument } from "../interfaces";

declare global {
  namespace Express {
    interface Request {
      user: UserDocument;
    }
  }
}

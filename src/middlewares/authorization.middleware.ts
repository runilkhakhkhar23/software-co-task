import { NextFunction, Request, Response } from "express";
import { ErrorResponse, RoleDocument, UserDocument } from "../interfaces";
import { UserModel } from "../models";

export const authorizeAccess = (module: string) => {
  return async (
    req: Request,
    res: Response<ErrorResponse>,
    next: NextFunction
  ) => {
    try {
      const user = req.user as UserDocument;
      const userDoc = (await UserModel.findById(user._id).populate(
        "role"
      )) as unknown as UserDocument & { role: RoleDocument };

      if (!userDoc.role.active) {
        return res.status(401).json({
          message: "Account deactivated, contact admin for further process",
        });
      }

      if (userDoc && userDoc.role.accessModules.includes(module)) {
        if (!userDoc.role.isDefault) {
          return res.status(403).json({ message: "Access denied" });
        }
        next();
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
};

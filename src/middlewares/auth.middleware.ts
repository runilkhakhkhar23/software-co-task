import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envConfigs } from "../configs";
import { UserDocument } from "../interfaces";
import { UserModel } from "../models";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(
      token,
      envConfigs.authentication.jwt_secret!
    ) as any;
    const user = (await UserModel.findById(decoded.id).lean()) as UserDocument;

    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

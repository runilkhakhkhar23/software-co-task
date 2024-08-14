import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envConfigs } from "../configs";
import { createUserSchema } from "../dto";
import {
  CreateUserRequest,
  ErrorResponse,
  RoleDocument,
  SuccessResponse,
  UserDocument,
} from "../interfaces";
import { validate } from "../middlewares";
import { RoleModel, UserModel } from "../models";

export const signup = [
  validate(createUserSchema),
  async (
    req: Request<{}, {}, CreateUserRequest>,
    res: Response<SuccessResponse | ErrorResponse>
  ) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      const user = await UserModel.findOne({ email }, { _id: 1 }).lean();

      if (user)
        return res.status(400).json({
          message:
            "Unable to create account contact us in support for further process",
        } as ErrorResponse);

      const role = (await RoleModel.findOne(
        { isDefault: true },
        { _id: 1 }
      ).lean()) as RoleDocument;

      const hashedPassword = await bcrypt.hash(password, 10);
      await UserModel.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role._id,
      });

      return res
        .status(201)
        .json({ message: "User registration successfully completed" });
    } catch (error) {
      return res.status(400).json({ message: error.message } as ErrorResponse);
    }
  },
];

export const login = async (
  req: Request<{}, {}, { email: string; password: string }>,
  res: Response<
    | (SuccessResponse & { data: { userId: string; token: string } })
    | ErrorResponse
  >
) => {
  try {
    const { email, password } = req.body;
    const user = (await UserModel.findOne(
      { email },
      { _id: 1, email: 1, password: 1 }
    )
      .populate("role")
      .lean()) as UserDocument;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(400)
        .json({ message: "Invalid credentials" } as ErrorResponse);
    }

    if (!(user.role as any).active) {
      return res.status(401).json({
        message: "Account deactivated, contact admin for further process",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      envConfigs.authentication.jwt_secret as string,
      { expiresIn: envConfigs.authentication.expiry_time || "2h" }
    );
    return res.json({
      message: "User logged in successfully",
      data: { userId: user._id, token },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

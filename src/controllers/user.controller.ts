import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { addUserSchema, updateUserSchema } from "../dto";
import {
  AddUserRequest,
  ErrorResponse,
  RoleDocument,
  SuccessResponse,
  UpdateUserRequest,
  UpdateUserRequestForBulkOperation,
  UserDocument,
  UserResponse,
} from "../interfaces";
import { validate } from "../middlewares";
import { UserModel } from "../models";
import {
  validateObjectId,
  validateObjectIdInArray,
} from "../utils/common.helper";

export const getUsers = async (
  req: Request<{}, {}, {}, { search?: string }>,
  res: Response<(SuccessResponse & { data: UserResponse[] }) | ErrorResponse>
) => {
  try {
    const { search = "" } = req.query;
    const users = await UserModel.aggregate([
      {
        $match: {
          $or: [
            { firstName: new RegExp(search, "i") },
            { lastName: new RegExp(search, "i") },
          ],
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleDetails",
        },
      },
      {
        $unwind: {
          path: "$roleDetails",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          role: {
            roleName: "$roleDetails.roleName",
            accessModules: "$roleDetails.accessModules",
          },
        },
      },
    ]);

    return res.status(200).json({
      message: "User list fetched successfully",
      data: users,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

export const readUser = async (
  req: Request<{ id: string }>,
  res: Response<
    (SuccessResponse & { data: Partial<UserDocument> }) | ErrorResponse
  >
) => {
  try {
    const { id } = req.params;
    validateObjectId(id);

    const user = (await UserModel.findById(id, {
      _id: 1,
      firstName: 1,
      lastName: 1,
      email: 1,
      role: 1,
    })
      .populate("role", {
        roleName: 1,
        accessModules: 1,
        active: 1,
        isDefault: 1,
      })
      .lean()) as UserDocument;
    if (!user) return res.status(404).json({ message: "User not found" });
    return res
      .status(200)
      .json({ message: "User details fetched successfully", data: user });
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

export const addUser = [
  validate(addUserSchema),
  async (
    req: Request<{}, {}, AddUserRequest>,
    res: Response<SuccessResponse | ErrorResponse>
  ) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      validateObjectId(role);

      const user = await UserModel.findOne({ email }, { _id: 1 }).lean();

      if (user)
        return res.status(400).json({
          message: "User already exist with this email address",
        });

      const hashedPassword = await bcrypt.hash(password, 10);
      await UserModel.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      });

      return res.status(201).json({ message: "User added successfully" });
    } catch (error) {
      return res.status(400).json({ message: error.message } as ErrorResponse);
    }
  },
];

export const updateUser = [
  validate(updateUserSchema),
  async (
    req: Request<{ id: string }, {}, UpdateUserRequest>,
    res: Response<(SuccessResponse & { data: UserResponse }) | ErrorResponse>
  ) => {
    try {
      const { id } = req.params;
      validateObjectId(id);

      if (req.body.password) {
        const user = await UserModel.findById(id);

        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (isMatch) {
          return res.status(400).json({
            message: "New password must be different from the current password",
          });
        }

        req.body.password = await bcrypt.hash(req.body.password, 10);
      }

      if (req.body.email) {
        const user = await UserModel.findOne({ email: req.body.email });
        if (user && id.toString() !== user._id.toString()) {
          return res
            .status(404)
            .json({ message: "User already exist with this email address" });
        }
      }

      const user = (await UserModel.findByIdAndUpdate(id, req.body, {
        new: true,
      })
        .populate("role")
        .lean()) as UserDocument;

      if (!user) return res.status(404).json({ message: "User not found" });

      return res.json({
        message: "User details updated successfully",
        data: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: {
            roleName: (user.role as unknown as RoleDocument).roleName,
            accessModules: (user.role as unknown as RoleDocument).accessModules,
          },
        },
      });
    } catch (error) {
      return res.status(400).json({ message: error.message } as ErrorResponse);
    }
  },
];

export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response<SuccessResponse | ErrorResponse>
) => {
  try {
    const { id } = req.params;
    validateObjectId(id);

    const user = (await UserModel.findById(req.user._id)) as UserDocument;

    if (user._id.toString() === id.toString()) {
      return res.status(400).json({
        message: "Can't delete yourself",
      });
    }

    const result = await UserModel.deleteOne({ _id: id });

    if (result.deletedCount === 1) {
      return res.status(200).send({ message: "User deleted successfully" });
    } else {
      return res.status(404).json({
        message: "User not found",
      });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

export const updateUsersInBulkSameData = async (
  req: Request<
    {},
    {},
    { ids: string[]; updateData: UpdateUserRequestForBulkOperation }
  >,
  res: Response<{ message: string } | ErrorResponse>
) => {
  try {
    const { ids, updateData } = req.body;
    if (!ids.length) {
      return res.status(400).json({
        message: "Provide user list to update data",
      });
    }
    validateObjectIdInArray(ids);

    if (req.body.updateData.password)
      req.body.updateData.password = await bcrypt.hash(
        req.body.updateData.password,
        10
      );

    await UserModel.updateMany({ _id: { $in: ids } }, updateData);
    return res.status(200).json({ message: "Users updated" });
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

export const updateUsersInBulkDifferentData = async (
  req: Request<
    {},
    {},
    { updates: { id: string; data: UpdateUserRequestForBulkOperation }[] }
  >,
  res: Response<{ message: string } | ErrorResponse>
) => {
  try {
    const updates = req.body.updates;

    const ids = updates.map((obj) => obj.id);

    validateObjectIdInArray(ids);

    for (const obj of updates) {
      if (obj.data.password) {
        obj.data.password = await bcrypt.hash(obj.data.password, 10);
      }
    }

    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: update.data,
      },
    }));
    await UserModel.bulkWrite(bulkOps);
    return res.status(200).json({ message: "Users updated" });
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

export const checkUserAccess = async (
  req: Request<{ userId: string; moduleName: string }>,
  res: Response<
    (SuccessResponse & { data: { hasAccess: boolean } }) | ErrorResponse
  >
) => {
  try {
    const { userId, moduleName } = req.params;

    validateObjectId(userId);

    const userDoc = (await UserModel.findById(userId)
      .populate("role")
      .lean()) as UserDocument;

    if (!userDoc)
      return res
        .status(404)
        .json({ message: "User not found" } as ErrorResponse);

    const role = userDoc.role as any;
    const hasAccess = role.accessModules.includes(moduleName);
    return res.json({
      message: "Response fetched successfully",
      data: { hasAccess },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

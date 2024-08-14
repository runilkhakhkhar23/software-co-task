import { Request, Response } from "express";
import { createRoleSchema, updateRoleSchema } from "../dto";
import { AccessModules } from "../enums";
import {
  CreateRoleRequest,
  ErrorResponse,
  RoleDocument,
  RoleResponse,
  SuccessResponse,
  UpdateRoleRequest,
} from "../interfaces";
import { validate } from "../middlewares";
import { RoleModel, UserModel } from "../models";
import { validateObjectId } from "../utils/common.helper";

export const createRole = [
  validate(createRoleSchema),
  async (
    req: Request<{}, {}, CreateRoleRequest>,
    res: Response<SuccessResponse | ErrorResponse>
  ) => {
    try {
      const role = (await RoleModel.findOne({
        roleName: {
          $regex: new RegExp(`^${req.body.roleName}$`, "i"),
        },
      })) as RoleDocument;
      if (role) {
        return res
          .status(404)
          .json({ message: "Role already exist in system" });
      }

      if (hasDuplicateModules(req.body.accessModules)) {
        return res
          .status(400)
          .json({ message: "Access modules are duplicate" });
      }

      await RoleModel.create(req.body);
      return res.status(201).json({
        message: "Role created successfully",
      });
    } catch (error) {
      return res.status(400).json({ message: error.message } as ErrorResponse);
    }
  },
];

export const getRoleById = async (
  req: Request<{ id: string }>,
  res: Response<(SuccessResponse & { data: RoleResponse }) | ErrorResponse>
) => {
  try {
    const { id } = req.params;
    validateObjectId(id);

    const role = (await RoleModel.findById(id, {
      _id: 1,
      roleName: 1,
      accessModules: 1,
      active: 1,
      isDefault: 1,
    }).lean()) as RoleDocument;
    if (!role) return res.status(404).json({ message: "Role not found" });
    return res.status(200).json({
      message: "Role details fetched successfully",
      data: role,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

export const getRoles = async (
  req: Request,
  res: Response<(SuccessResponse & { data: RoleResponse[] }) | ErrorResponse>
) => {
  try {
    const roles = (await RoleModel.find(
      {},
      { _id: 1, roleName: 1, accessModules: 1, active: 1, isDefault: 1 }
    ).lean()) as RoleDocument[];
    return res.json({
      message: "List of roles fetched successfully",
      data: roles,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

export const updateRole = [
  validate(updateRoleSchema),
  async (
    req: Request<{ id: string }, {}, UpdateRoleRequest>,
    res: Response<(SuccessResponse & { data: RoleResponse }) | ErrorResponse>
  ) => {
    try {
      const { id } = req.params;
      validateObjectId(id);

      if (
        req.body.accessModules?.length &&
        hasDuplicateModules(req.body.accessModules as string[])
      ) {
        return res
          .status(400)
          .json({ message: "Access modules are duplicate" });
      }

      if (req.body.roleName) {
        const role = await RoleModel.findOne({
          roleName: {
            $regex: new RegExp(`^${req.body.roleName}$`, "i"),
          },
        });
        if (role && id.toString() !== role._id.toString()) {
          return res
            .status(400)
            .json({ message: "Role already exist with this name" });
        }
      }

      let role = (await RoleModel.findById(id)) as RoleDocument;

      if (role.isDefault) {
        return res.status(400).json({
          message: "Can't do any updates on default role",
        });
      }

      if (req.body.accessModules?.length) {
        req.body.accessModules = Array.from(
          new Set([...role.accessModules, ...req.body.accessModules])
        );
      }

      role = (await RoleModel.findByIdAndUpdate(id, req.body, {
        new: true,
      }).lean()) as RoleDocument;
      if (!role)
        return res
          .status(404)
          .json({ message: "Role not found" } as ErrorResponse);
      return res.json({
        message: "Role details updated successfully",
        data: {
          _id: role._id,
          roleName: role.roleName,
          accessModules: role.accessModules,
          active: role.active,
          isDefault: role.isDefault,
        },
      });
    } catch (error) {
      return res.status(400).json({ message: error.message } as ErrorResponse);
    }
  },
];

export const deleteRole = async (
  req: Request<{ id: string }>,
  res: Response<SuccessResponse | ErrorResponse>
) => {
  try {
    const { id } = req.params;
    validateObjectId(id);

    const role = (await RoleModel.findById(id)) as RoleDocument;

    if (!role)
      return res.status(404).json({
        message: "Role not found",
      });

    if (role.isDefault) {
      return res.status(400).json({
        message: "Can't delete default role",
      });
    }

    const activeUserCount = await UserModel.countDocuments({ role: id });

    if (activeUserCount) {
      return res.status(400).json({
        message:
          "Users are present in system with this role so can't delete this role",
      });
    }

    const result = await RoleModel.deleteOne({ _id: id });

    if (result.deletedCount === 1) {
      return res.status(200).send({ message: "Role deleted successfully" });
    } else {
      return res.status(404).json({
        message: "Role not found",
      });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

export const updateAccessModules = async (
  req: Request<
    { id: string },
    {},
    { addModules?: string[]; removeModule?: string }
  >,
  res: Response<(SuccessResponse & { data: RoleResponse }) | ErrorResponse>
) => {
  try {
    const { addModules, removeModule } = req.body;

    if (!addModules?.length && !removeModule) {
      return res.status(400).json({
        message: "Module names are missing",
      });
    }

    const { id } = req.params;
    validateObjectId(id);

    if (req.body.addModules?.length || req.body.removeModule?.length) {
      const accessModules: string[] = Object.values(AccessModules);
      let modules: string[] = [];
      if (req.body.addModules?.length) {
        const invalidModules = req.body.addModules.filter(
          (module) => !accessModules.includes(module)
        );
        if (invalidModules.length)
          return res.status(400).json({
            message: "Invalid modules provided in add modules field",
          });

        modules = [...modules, ...req.body.addModules];
      }
      if (req.body.removeModule) {
        if (!accessModules.includes(req.body.removeModule))
          return res.status(400).json({
            message: "Invalid module provided in remove module field",
          });
        modules = [...modules, req.body.removeModule];
      }
      if (hasDuplicateModules(modules)) {
        return res
          .status(400)
          .json({ message: "Access modules are duplicate" });
      }
    }

    const role = (await RoleModel.findById(id).lean()) as RoleDocument;

    if (!role)
      return res
        .status(404)
        .json({ message: "Role not found" } as ErrorResponse);

    if (role.isDefault) {
      return res.status(400).json({
        message: "Can't do any updates on default role",
      });
    }

    if (addModules?.length) {
      role.accessModules = [...new Set([...role.accessModules, ...addModules])];
    }

    if (removeModule?.length) {
      role.accessModules = role.accessModules.filter(
        (module: string) => module !== removeModule
      );
    }

    await RoleModel.updateOne(
      { _id: req.params.id },
      {
        accessModules: role.accessModules,
      }
    );

    return res.json({
      message: "Access modules are updated",
      data: {
        _id: role._id,
        roleName: role.roleName,
        accessModules: role.accessModules,
        active: role.active,
        isDefault: role.isDefault,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message } as ErrorResponse);
  }
};

export const createDefaultRole = async () => {
  try {
    const role = await RoleModel.findOne({ roleName: "Admin" });
    if (!role) {
      await RoleModel.create({
        roleName: "Admin",
        accessModules: Object.values(AccessModules),
        active: true,
        isDefault: true,
      });
      console.error("Default role is added");
    }
  } catch (error) {
    console.error(
      "Error in creating default role on server start:",
      error.message
    );
    process.exit(1);
  }
};

export const hasDuplicateModules = (modules: string[]) => {
  return new Set(modules).size !== modules.length;
};

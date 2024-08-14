import Joi from "joi";
import { AccessModules } from "../enums";
import { CreateRoleRequest, UpdateRoleRequest } from "../interfaces";

export const createRoleSchema = Joi.object<CreateRoleRequest>({
  roleName: Joi.string().required(),
  accessModules: Joi.array()
    .items(Joi.string().valid(...Object.values(AccessModules)))
    .required()
    .length(1),
  active: Joi.boolean().default(true),
});

export const updateRoleSchema = Joi.object<UpdateRoleRequest>({
  roleName: Joi.string().min(1),
  accessModules: Joi.array().items(
    Joi.string().valid(...Object.values(AccessModules))
  ),
  active: Joi.boolean(),
});

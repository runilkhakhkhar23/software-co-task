import Joi from "joi";
import {
  AddUserRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserRequestForBulkOperation,
} from "../interfaces";

export const createUserSchema = Joi.object<CreateUserRequest>({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
});

export const addUserSchema = Joi.object<AddUserRequest>({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().required().min(8),
});

export const updateUserSchema = Joi.object<UpdateUserRequest>({
  email: Joi.string().email(),
  password: Joi.string().min(6),
  firstName: Joi.string().min(1),
  lastName: Joi.string().min(1),
  role: Joi.string().min(8),
});

export const updateUserSchemaForBulkOperation =
  Joi.object<UpdateUserRequestForBulkOperation>({
    password: Joi.string().min(6),
    firstName: Joi.string().min(1),
    lastName: Joi.string().min(1),
    role: Joi.string().min(8),
  });

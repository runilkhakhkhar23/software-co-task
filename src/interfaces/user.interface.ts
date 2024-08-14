import { RoleDocument } from "./role.interface";

export interface User {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: RoleDocument["_id"];
}

export interface UserDocument extends User, Document {
  _id: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AddUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface UpdateUserRequestForBulkOperation {
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface UserResponse {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    roleName: string;
    accessModules: string[];
  };
}

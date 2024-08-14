export interface Role {
  roleName: string;
  accessModules: string[];
  createdAt: Date;
  active: boolean;
  isDefault: boolean;
}

export interface RoleDocument extends Role, Document {
  _id: string;
}

export interface CreateRoleRequest {
  roleName: string;
  accessModules: string[];
  active: boolean;
}

export interface UpdateRoleRequest {
  roleName?: string;
  accessModules?: string[];
  active?: boolean;
}

export interface RoleResponse {
  _id: string;
  roleName: string;
  accessModules: string[];
  active: boolean;
  isDefault: boolean;
}

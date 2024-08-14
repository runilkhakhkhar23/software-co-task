import mongoose, { Schema } from "mongoose";
import { AccessModules } from "../enums";
import { RoleDocument } from "../interfaces";

const RoleSchema = new Schema(
  {
    roleName: { type: String, required: true, unique: true },
    accessModules: { type: [String], required: true, enum: AccessModules },
    active: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const RoleModel = mongoose.model<RoleDocument>("Role", RoleSchema);

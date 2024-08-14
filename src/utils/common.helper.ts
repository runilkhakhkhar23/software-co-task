import { isValidObjectId, Types } from "mongoose";

export const validateObjectId = (id: Types.ObjectId | string) => {
  if (!isValidObjectId(id)) throw new Error("Invalid data");
};

export const validateObjectIdInArray = (ids: Types.ObjectId[] | string[]) => {
  if (!ids.every((id) => isValidObjectId(id))) throw new Error("Invalid data");
};

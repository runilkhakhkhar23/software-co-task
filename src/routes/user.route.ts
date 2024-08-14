import { Router } from "express";
import {
  addUser,
  checkUserAccess,
  deleteUser,
  getUsers,
  readUser,
  updateUser,
  updateUsersInBulkDifferentData,
  updateUsersInBulkSameData,
} from "../controllers";
import { AccessModules } from "../enums";
import { authMiddleware, authorizeAccess } from "../middlewares";

const router = Router();

router.get(
  "/",
  authMiddleware,
  authorizeAccess(AccessModules.USER_LIST),
  getUsers
);
router.post(
  "/",
  authMiddleware,
  authorizeAccess(AccessModules.USER_CREATE),
  addUser
);
router.get(
  "/:id",
  authMiddleware,
  authorizeAccess(AccessModules.USER_READ),
  readUser
);
router.put(
  "/:id",
  authMiddleware,
  authorizeAccess(AccessModules.USER_UPDATE),
  updateUser
);
router.delete(
  "/:id",
  authMiddleware,
  authorizeAccess(AccessModules.USER_DELETE),
  deleteUser
);
router.put(
  "/bulk/same",
  authMiddleware,
  authorizeAccess(AccessModules.USER_BULK_UPDATE_SAME),
  updateUsersInBulkSameData
);
router.put(
  "/bulk/different",
  authMiddleware,
  authorizeAccess(AccessModules.USER_BULK_UPDATE_PER_USER),
  updateUsersInBulkDifferentData
);
router.get(
  "/:userId/access/:moduleName",
  authMiddleware,
  authorizeAccess(AccessModules.ACCESS_CHECK),
  checkUserAccess
);

export { router as userRoutes };

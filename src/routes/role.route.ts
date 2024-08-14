import { Router } from "express";
import {
  createRole,
  deleteRole,
  getRoleById,
  getRoles,
  updateAccessModules,
  updateRole,
} from "../controllers";
import { AccessModules } from "../enums";
import { authMiddleware, authorizeAccess } from "../middlewares";

const router = Router();

router.post(
  "/",
  authMiddleware,
  authorizeAccess(AccessModules.ROLE_CREATE),
  createRole
);
router.get(
  "/",
  authMiddleware,
  authorizeAccess(AccessModules.ROLE_LIST),
  getRoles
);
router.get(
  "/:id",
  authMiddleware,
  authorizeAccess(AccessModules.ROLE_READ),
  getRoleById
);
router.put(
  "/:id",
  authMiddleware,
  authorizeAccess(AccessModules.ROLE_UPDATE),
  updateRole
);
router.delete(
  "/:id",
  authMiddleware,
  authorizeAccess(AccessModules.ROLE_DELETE),
  deleteRole
);
router.put(
  "/:id/access",
  authMiddleware,
  authorizeAccess(AccessModules.ROLE_UPDATE_ACCESS_MODULE),
  updateAccessModules
);

export { router as roleRoutes };

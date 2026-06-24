import { Router } from "express";
import { validate } from "../../middleware/validate";
import { RegisterSchema, LoginSchema } from "./auth.schemas";
import { register, login } from "./auth.controller";

const router = Router();

router.post("/register", validate(RegisterSchema), register);
router.post("/login", validate(LoginSchema), login);

export { router as authRouter };

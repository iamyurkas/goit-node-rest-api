import { Router } from "express";

import authControllers from "../controllers/authControllers.js";

import authenticate from "../middleware/authenticate.js";

import validateBody from "../helpers/validateBody.js";

import { authSignupSchemas } from "../schemas/authSchemas.js";

const signupMiddleware = validateBody(authSignupSchemas);

const authRouter = Router();

authRouter.post("/register", signupMiddleware, authControllers.signup);
authRouter.post("/login", signupMiddleware, authControllers.signin);
authRouter.post("/logout", authenticate, authControllers.signout);
authRouter.get("/current", authenticate, authControllers.current);

export default authRouter;

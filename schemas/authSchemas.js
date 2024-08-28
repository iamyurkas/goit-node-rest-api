import Joi from "joi";

import { emailRegexp } from "../constants/authConstants.js";

export const authSignupSchemas = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
});
export const emailSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
});

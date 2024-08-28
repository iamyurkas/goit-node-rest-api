import * as authServices from "../services/authServices.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import path from "path";
import { nanoid } from "nanoid";
import * as fs from "node:fs/promises";

import ctrlWrapper from "../helpers/ctrlWrapper.js";
import HttpError from "../helpers/HttpError.js";
import { sendEmail, getVerifyEmailData } from "../helpers/sendEmail.js";

const { JWT_SECRET } = process.env;

const updateAvatar = async (req, res) => {
  const { id } = req.user;
  const { path: oldPath, filename } = req.file;
  const newPath = path.join(path.resolve("public", "avatars"), filename);
  const avatarURL = `/avatars/${filename}`;
  await fs.rename(oldPath, newPath);
  const updatedUser = await authServices.updateUser(id, { avatarURL });
  res.json({
    avatarURL: updatedUser.avatarURL,
  });
};

const signup = async (req, res) => {
  const email = req.body.email;
  const avatarURL = gravatar.url(
    email,
    { s: "200", r: "pg", d: "retro" },
    true
  );

  const verificationToken = nanoid();

  const user = await authServices.signup({
    ...req.body,
    avatarURL,
    verificationToken,
  });

  const verifyEmail = getVerifyEmailData({ email, verificationToken });

  await sendEmail(verifyEmail);

  res.status(201).json({
    user: {
      email: user.email,
      subscription: user.subscription,
      avatarURL: avatarURL,
    },
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await authServices.findUser(email);
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user.id,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  authServices.updateUser(user.id, { token });

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const signout = async (req, res, next) => {
  const { id } = req.user;
  await authServices.updateUser(id, { token: null });
  res.status(204).send();
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;

    const user = await authServices.findUser(verificationToken);

    if (!user) {
      throw HttpError(404, "User not found");
    }

    user.verify = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    next(error);
  }
};
export const reverifyEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw HttpError(400, "Missing required field email");
    }

    const user = await authServices.findUser(email);

    if (!user) {
      throw HttpError(404, "User not found");
    }

    if (user.verify) {
      throw HttpError(400, "Verification has already been passed");
    }

    const verificationToken = user.verificationToken;

    const verifyEmail = getVerifyEmailData({ email, verificationToken });

    await sendEmail(verifyEmail);

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
};

export default {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  signout: ctrlWrapper(signout),
  current: ctrlWrapper(getCurrent),
  updateAvatar: ctrlWrapper(updateAvatar),
  verifyEmail: ctrlWrapper(verifyEmail),
  reverifyEmail: ctrlWrapper(reverifyEmail),
};

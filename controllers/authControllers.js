import * as authServices from "../services/authServices.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import path from "path";
import * as fs from "node:fs/promises";

import ctrlWrapper from "../helpers/ctrlWrapper.js";
import HttpError from "../helpers/HttpError.js";

const { JWT_SECRET } = process.env;
const avatarPath = path.resolve("public", "avatars");

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
  const avatarURL = gravatar.url(
    req.body.email,
    { s: "200", r: "pg", d: "retro" },
    true
  );

  const user = await authServices.signup({
    ...req.body,
    avatarURL,
  });

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
  const user = await authServices.findUser({ email });
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

export default {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  signout: ctrlWrapper(signout),
  current: ctrlWrapper(getCurrent),
  updateAvatar: ctrlWrapper(updateAvatar),
};

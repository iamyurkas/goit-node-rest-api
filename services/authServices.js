import bcrypt from "bcrypt";
import User from "../db/models/User.js";

export const findUser = (query) => User.findOne({ query });

export const signup = async (data) => {
  try {
    const { password } = data;
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ ...data, password: hashPassword });
    return newUser;
  } catch (error) {
    if (error?.parent?.code === "23505") {
      error.message = "Email in use";
      throw error;
    }
  }
};

export const updateUser = async (query, data) => {
  const user = await findUser(query);
  if (!user) {
    return null;
  }
  return user.update(data, {
    returning: true,
  });
};

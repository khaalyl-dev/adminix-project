import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import UserModel from "../models/user.model";
import { Roles } from "../enums/role.enum";
import AccountModel from "../models/account.model";
import { ProviderEnum } from "../enums/account-provider.enums";

const MONGO_URL = process.env.MONGO_URL;

async function seedSuperAdmin() {
  await mongoose.connect(MONGO_URL!);

  const email = "contact@digix.tn";
  const password = "SuperSecurePassword123";
  const name = "Digixi";

  let user = await UserModel.findOne({ email });
  if (!user) {
    user = await UserModel.create({
      name,
      email,
      password,
      isActive: true,
      profilePicture: null,
      role: Roles.SUPER_ADMIN,
    });
    console.log("Super Admin created:", user.email);
  } else {
    console.log("Super Admin already exists:", user.email);
  }

  const account = await AccountModel.findOne({ provider: ProviderEnum.EMAIL, providerId: email });
  if (!account) {
    await AccountModel.create({
      userId: user._id,
      provider: ProviderEnum.EMAIL,
      providerId: email,
      refreshToken: null,
      tokenExpiry: null,
    });
    console.log("Super Admin account created in AccountModel.");
  }

  await mongoose.disconnect();
}

seedSuperAdmin().catch(console.error); 
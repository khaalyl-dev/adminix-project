import mongoose from "mongoose";
import UserModel from "../models/user.model";
import AccountModel from "../models/account.model";
import WorkspaceModel from "../models/workspace.model";
import RoleModel from "../models/roles-permission.model";
import { Roles } from "../enums/role.enum";
import { BadRequestException, NotFoundException, UnauthorizedException } from "../utils/app.error";
import MemberModel from "../models/member.model";
import { ProviderEnum } from "../enums/account-provider.enums";



export const loginOrCreateAccountService = async(data: {
    provider:string; 
    displayName:string; 
    providerId: string; 
    picture?:string; 
    email?:string; 
}) => {
    const {providerId, provider, displayName, email, picture} = data ;

    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        console.log("Start Session ...");
        let user = await UserModel.findOne({email}).session(session)

        let isNewUser = false;
        if(!user) {
            //create new user if doesn't exist
            user = new UserModel({
                   email, 
                   name:displayName, 
                   profilePicture: picture || null, 
            });
            await user.save({session});

            const account = new AccountModel({
                userId: user._id,
                provider: provider,
                providerId:providerId, 
            });
            await account.save({session});
            isNewUser = true;
        }

        // If the user is new and has no currentWorkspace, create a default workspace
        if (!user.currentWorkspace) {
            const ownerRole = await RoleModel.findOne({ name: Roles.OWNER });
            if (!ownerRole) {
                throw new Error("Owner role not found");
            }
            const workspace = new WorkspaceModel({
                name: `${user.name || "My Workspace"}`,
                description: "Default workspace",
                owner: user._id,
            });
            await workspace.save({ session });

            const member = new MemberModel({
                userId: user._id,
                workspaceId: workspace._id,
                role: ownerRole._id,
                joinedAt: new Date(),
            });
            await member.save({ session });

            user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
            await user.save({ session });
        }

        await session.commitTransaction();
        session.endSession();
        console.log("End Session ...");

        return {user};
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    } finally {
        session.endSession();
    }
};

export const registerUserService = async(body:{
    email:string;
    name:string;
    password: string; 
}) => {
const {email, name, password} = body ;
const session = await mongoose.startSession(); 

try {
    session.startTransaction();
    const existingUser = await UserModel.findOne({email}).session(session); 
    if(existingUser){
        throw new BadRequestException("email already exists!");
    }

    const user = new UserModel ({
      email, 
      name, 
      password,
    });
    await user.save({session}); 

    const account = new AccountModel({
        userId: user._id,
        provider:ProviderEnum.EMAIL,
        providerId: email,
    });
    await account.save({session});

    // Do NOT create workspace, member, or set currentWorkspace here

    await session.commitTransaction(); 
    session.endSession(); 
    console.log("End Session ...");
    
    return {
        userId:user._id
    };

} catch (error) {
    await session.abortTransaction(); 
    session.endSession(); 

    throw error;
}
}

export const verifyUserService = async({
   email,
   password,
   provider = ProviderEnum.EMAIL, 
}: {
    email:string;
    password:string;
    provider?:string; 
}) => {
   const account = await AccountModel.findOne({provider,providerId: email});
   if(!account){
    throw new NotFoundException("invalid email or password"); 
   }


   const user = await UserModel.findById(account.userId);

   if(!user) {
    throw new NotFoundException("user not found for the given account");
   }

   const isMatch = await user.comparePassword(password); 
   if (!isMatch) {
    throw new UnauthorizedException("invalid email or password");
   }
   return user.omitPassword(); 
};
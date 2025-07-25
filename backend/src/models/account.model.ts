// Mongoose model for user accounts in the backend application.
import mongoose, {Document, Schema} from "mongoose" ; 
import { ProviderEnum, ProviderEnumType } from "../enums/account-provider.enums";

export interface AccountDocument extends Document {
    provider: ProviderEnumType;
    providerId: string; 
    userId: mongoose.Types.ObjectId;
    refreshToken?: string | null; 
    accessToken?: string | null;
    tokenExpiry:Date | null; 
    createdAt:Date; 
}

const accountSchema = new Schema<AccountDocument>(
    {   
        userId: {
            type:Schema.Types.ObjectId, 
            ref:"User",
            required:true,
        },
        provider: {
           type:String,
           enum:Object.values(ProviderEnum),
           required:true,
        },
        providerId: {
            type :String,
            required:true,
            unique:true,
        },
        refreshToken: {type:String, default: null},
        accessToken: {type:String, default: null},
        tokenExpiry: {type:Date, default:null},
      
    }, 
    {
        timestamps: true,
        toJSON: {
            transform(doc,ret) {
                delete ret.refreshToken;
                delete ret.accessToken;
            },
        },
        
    }
); 

const AccountModel = mongoose
      .model<AccountDocument>("Account", accountSchema);
export default AccountModel;

import passport from "passport";
import { Request } from "express";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {Strategy as LocalStrategy} from "passport-local"; 
import {config} from "./app.config";
import { NotFoundException } from "../utils/app.error";
import { ProviderEnum } from "../enums/account-provider.enums";
import { loginOrCreateAccountService, verifyUserService } from "../services/auth.service";
import { emailSchema } from "../validation/auth.validation";
import AccountModel from "../models/account.model";


passport.use(
    new GoogleStrategy(
     {
    clientID: config.GOOGLE_CLIENT_ID, 
    clientSecret:config.GOOGLE_CLIENT_SECRET, 
    callbackURL: config.GOOGLE_CALLBACK_URL, 
    scope:["profile", "email", "https://www.googleapis.com/auth/calendar.events"],
    passReqToCallback:true,
}, 
async(req: Request, accessToken, refreshToken, profile, done ) => {
     try {
        const {email, sub:googleId, picture } = profile._json;
        console.log(profile, "profile");
        console.log(googleId,"googleId");
        if(!googleId) {
            throw new NotFoundException("Google ID (sub) is missing");
        }
        const {user}= await loginOrCreateAccountService({
            provider:ProviderEnum.GOOGLE,
            displayName:profile.displayName, 
            providerId:googleId,
            picture:picture,
            email:email,
        });
        // Store accessToken and refreshToken in AccountModel
        await AccountModel.findOneAndUpdate(
          { provider: ProviderEnum.GOOGLE, providerId: googleId },
          {
            $set: {
              refreshToken: refreshToken || null,
              accessToken: accessToken || null,
              // tokenExpiry: ... (if available)
            }
          },
          { upsert: false }
        );
        done(null,user); 
     } catch (error) {
        done(error,false); 
     }
   }
 )
);

passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField:"password",
    session:true,
},
async(email,password, done) => {
    try {
    const user = await verifyUserService({email,password});
    return done(null,user);
    } catch (error: any) {
        return done(error, false, {message: error?.message});
    }
}
));


passport.serializeUser((user:any, done) => done(null, user));

passport.deserializeUser((user:any, done) => done(null, user));
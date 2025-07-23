import mongoose from "mongoose";
import {config} from "./app.config"; 

const connectDatabase = async () => {
    try{
        await mongoose.connect(config.MONGO_URL);
        console.log("Jaweek behy el database ala 3ajla");
    } catch (error) {
        console.log("bro 7yetek 3adheb");
        process.exit(1);
    }
};

export default connectDatabase ;    
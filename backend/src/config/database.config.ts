import mongoose from "mongoose";
import {config} from "./app.config"; 

const connectDatabase = async () => {
    try{
        await mongoose.connect(config.MONGO_URL);
        console.log("oumourek mrygla");
    } catch (error) {
        console.log("error o raja3 rou7ek ");
        process.exit(1);
    }
};

export default connectDatabase ;    
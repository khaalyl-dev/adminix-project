export const getEnv = (Key:string, defaultValue:string=""):string =>{
  const value=process.env[Key];
if (value === undefined) {
    if(defaultValue){
        return defaultValue;
    }
    throw new Error (`Environment variable ${Key} is not set`);
  } 
  return value; 
};

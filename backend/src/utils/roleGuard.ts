import { PermissionType } from "../enums/role.enum";
import { UnauthorizedException } from "./app.error";
import { RolePermissions } from "./role-permission";

export const roleGuard = (
   role: keyof typeof RolePermissions, 
   requiredPermissions: PermissionType[]
)=> {
    const permissions = RolePermissions[role];

    const hasPermission = requiredPermissions.some((permission)=>
         permissions.includes(permission)
    ); 
    if(!hasPermission) {
        throw new UnauthorizedException(
            "You don't have the necessary permissions to perform this action"
        ); 
    }


}
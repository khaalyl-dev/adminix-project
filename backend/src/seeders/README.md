# Adminix Backend

## Super Admin Functionality

### What is Super Admin?
A Super Admin is a special user role with the ability to view all workspaces in the system, regardless of ownership or membership. The Super Admin cannot create, edit, or delete workspaces, projects, or tasks—only view them.

---

## How Super Admin Works
- **Role:** `SUPER_ADMIN` is defined in `src/enums/role.enum.ts` and added to the user model.
- **Permissions:** Only has `VIEW_ONLY` permission, as set in `src/utils/role-permission.ts`.
- **Workspace Access:** Can view all workspaces, even if not a member, via updated logic in `getAllWorkspacesUserIsMemberService` and `getMemberRoleInWorkspace`.
- **Cannot Modify:** All create/edit/delete actions are denied for SUPER_ADMIN by permission checks.

---

## How to Seed a Super Admin
1. Ensure your `.env` file has a valid `MONGO_URL`.
2. Run the seeder script:
   ```sh
   npx ts-node src/seeders/superadmin.seeder.ts
   ```
3. This will create a user with:
   - Email: `contact@digix.tn`
   - Password: `SuperSecurePassword123`
   - Role: `SUPER_ADMIN`

---

## Key Code Updates

### 1. User Model (`src/models/user.model.ts`)
- Added `role` field to the schema and interface.
- Default role is `MEMBER`.

### 2. Role Enum (`src/enums/role.enum.ts`)
- Added `SUPER_ADMIN` to the `Roles` object and `RoleType`.

### 3. Role Permissions (`src/utils/role-permission.ts`)
- Added `SUPER_ADMIN` with only `VIEW_ONLY` permission.

### 4. Seeder Script (`src/seeders/superadmin.seeder.ts`)
- Seeds a Super Admin user and creates an associated account for login.

### 5. Workspace Fetching (`src/services/workspace.service.ts`)
- `getAllWorkspacesUserIsMemberService` returns all workspaces for SUPER_ADMIN.

### 6. Membership Check (`src/services/member.service.ts`)
- `getMemberRoleInWorkspace` allows SUPER_ADMIN to access any workspace, even if not a member.

---

## Comments in Code
- All new logic for SUPER_ADMIN is commented in the relevant files for clarity.

---

## Usage
- Log in as super admin using the seeded credentials.
- You will be able to view all workspaces and their contents, but not modify them.

---

## Security Note
- Change the default super admin password after first login.
- Do not share super admin credentials. 
// auth.route.tsx
// This file defines the authentication route logic for the AdminiX client application, handling access to auth pages and redirecting authenticated users.
import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import useAuth from "@/hooks/api/use-auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthRoute } from "./common/routePaths";

const AuthRoute = () => {
  const location = useLocation(); 
  const {data: authData, isLoading} = useAuth(); 
  const user = authData?.user; 

  const _isAuthRoute = isAuthRoute(location.pathname); 

  if (isLoading && !_isAuthRoute) return <DashboardSkeleton/>

  if(!user) return  <Outlet />; 

  // Remove any redirect to ProjectSetup for users with no workspace
  // Instead, always redirect to the dashboard or workspace
  return <Navigate to="/workspace" replace />;
};

export default AuthRoute;

// protected.route.tsx
// This file defines the protected route logic for the AdminiX client application, ensuring only authenticated users can access certain pages.
import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import useAuth from "@/hooks/api/use-auth";
import { Navigate, Outlet } from "react-router-dom";
const ProtectedRoute = () => {
  const {data: authData, isLoading} = useAuth(); 
  const user = authData?.user; 

  if(isLoading) {
    return <DashboardSkeleton/>
  }
  return user ? <Outlet/> : <Navigate to="/" replace />;
};

export default ProtectedRoute;

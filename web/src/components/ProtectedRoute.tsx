import React, { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface ProtectedRouteProps {
  requiredRole?: "admin" | "seller";
  children?: ReactNode; // cho phép nhận JSX bên trong
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const auth = useSelector((state: RootState) => state.auth);

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && auth.user?.role !== requiredRole) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children || <Outlet />}</>; // nếu có children render children, không thì render Outlet
};

export default ProtectedRoute;

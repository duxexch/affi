import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import type { ComponentType } from "react";

export function withAdminAuth<P extends object>(Component: ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const [, navigate] = useLocation();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) navigate("/admin/login");
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!isAuthenticated) return null;

    return <Component {...props} />;
  };
}

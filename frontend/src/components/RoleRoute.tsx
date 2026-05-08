// src/components/RoleRoute.tsx
// Componente de protección de rutas por cargo (RBAC).
// Si el usuario autenticado no tiene el cargo requerido, lo redirige a su página de inicio.

import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];   // Ej. ["Administrador", "Vendedor"]
  fallback?: string;        // Ruta de fallback si no tiene permiso
}

// Mapa: cargo → ruta de inicio natural
const HOME_BY_ROLE: Record<string, string> = {
  Administrador: "/dashboard/pos",
  Vendedor:      "/dashboard/pos",
  Almacenero:    "/dashboard/inventory",
};

export function RoleRoute({ children, allowedRoles, fallback }: RoleRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;  // Esperar a que cargue la sesión

  const cargo = user?.nombre_cargo ?? "";

  // Administrador siempre tiene acceso total
  if (cargo === "Administrador") return <>{children}</>;

  if (!allowedRoles.includes(cargo)) {
    const redirect = fallback ?? HOME_BY_ROLE[cargo] ?? "/dashboard/pos";
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}

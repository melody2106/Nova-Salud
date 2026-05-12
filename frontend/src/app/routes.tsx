import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout.tsx";
import { ProtectedRoute } from "../components/ProtectedRoute.tsx";
import { RoleRoute } from "../components/RoleRoute.tsx";
import { Login } from "./pages/Login.tsx";
import { Pos } from "./pages/Pos.tsx";
import { Inventory } from "./pages/Inventory.tsx";
import { Compras } from "./pages/Compras.tsx";
import { HR } from "./pages/HR.tsx";
import { Config } from "./pages/Config.tsx";
import { Register } from "./pages/register.tsx";

// ── Control de acceso por cargo (nombre_cargo de Cargos) ────────────────────
// Administrador → todo
// Vendedor      → POS
// Almacenero    → Inventario + Compras

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    Component: Login,
  },
  { path: "/register", element: <Register /> },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard/pos" replace /> },

      // POS — Administrador + Vendedor
      {
        path: "pos",
        element: (
          <RoleRoute allowedRoles={["Administrador", "Vendedor"]}>
            <Pos />
          </RoleRoute>
        ),
      },

      // Inventario — Administrador + Almacenero
      {
        path: "inventory",
        element: (
          <RoleRoute allowedRoles={["Administrador", "Almacenero"]} fallback="/dashboard/pos">
            <Inventory />
          </RoleRoute>
        ),
      },

      // Compras — Administrador + Almacenero
      {
        path: "compras",
        element: (
          <RoleRoute allowedRoles={["Administrador", "Almacenero"]} fallback="/dashboard/pos">
            <Compras />
          </RoleRoute>
        ),
      },

      // RRHH — solo Administrador
      {
        path: "hr",
        element: (
          <RoleRoute allowedRoles={["Administrador"]} fallback="/dashboard/pos">
            <HR />
          </RoleRoute>
        ),
      },

      // Configuración — solo Administrador
      {
        path: "config",
        element: (
          <RoleRoute allowedRoles={["Administrador"]} fallback="/dashboard/pos">
            <Config />
          </RoleRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

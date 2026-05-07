import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RoleRoute } from "../components/RoleRoute";
import { Login } from "./pages/Login";
import { Pos } from "./pages/Pos";
import { Inventory } from "./pages/Inventory";
import { Compras } from "./pages/Compras";
import { HR } from "./pages/HR";
import { Config } from "./pages/Config";

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

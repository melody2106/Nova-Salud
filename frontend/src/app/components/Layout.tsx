// src/app/components/Layout.tsx
// Sidebar con RBAC — renderizado condicional según Cargos.nombre_cargo del usuario logueado

import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Users,
  Settings,
  LogOut,
  Cross,
  ShoppingBag,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.tsx";

// ── Definición de rutas por módulo ──────────────────────────────────────────
interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles: string[];   // qué cargos pueden ver este ítem
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    name: "Punto de Venta",
    path: "/dashboard/pos",
    icon: ShoppingCart,
    roles: ["Administrador", "Vendedor"],
  },
  {
    name: "Inventario",
    path: "/dashboard/inventory",
    icon: Package,
    roles: ["Administrador", "Almacenero"],
  },
  {
    name: "Compras",
    path: "/dashboard/compras",
    icon: ShoppingBag,
    roles: ["Administrador", "Almacenero"],
  },
  {
    name: "Recursos Humanos",
    path: "/dashboard/hr",
    icon: Users,
    roles: ["Administrador"],
  },
  {
    name: "Configuración",
    path: "/dashboard/config",
    icon: Settings,
    roles: ["Administrador"],
  },
];

// ── Colores del badge por cargo ──────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  Administrador: "text-amber-400",
  Vendedor:      "text-teal-400",
  Almacenero:    "text-sky-400",
};

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const cargo = user?.nombre_cargo ?? "";

  // Filtrar solo los ítems que el cargo actual puede ver
  const navItems = ALL_NAV_ITEMS.filter(
    (item) => cargo === "" || item.roles.includes(cargo)
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleColor = ROLE_COLORS[cargo] ?? "text-slate-400";

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg">
            <Cross className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-tight">Nova Salud</span>
            <span className="text-xs text-teal-400">Sistema de Gestión</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-teal-500/10 text-teal-400 font-medium"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-teal-400" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Info del usuario */}
          {user && (
            <div className="px-3 py-2 bg-slate-800 rounded-lg text-xs">
              <div className="flex items-center gap-2 mb-1">
                <UserCircle className="w-4 h-4 text-slate-400" />
                <p className="text-slate-400">Conectado como:</p>
              </div>
              <p className="text-white font-semibold">{user.nombres} {user.apellidos}</p>
              <p className={`font-medium mt-0.5 ${roleColor}`}>{cargo || "Sin cargo asignado"}</p>
            </div>
          )}

          {/* Botón logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

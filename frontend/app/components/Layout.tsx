import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  LogOut,
  Cross
} from "lucide-react";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Punto de Venta", path: "/pos", icon: ShoppingCart },
    { name: "Inventario", path: "/inventory", icon: Package },
    { name: "Recursos Humanos", path: "/hr", icon: Users },
    { name: "Configuración", path: "/config", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg">
            <Cross className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-tight">Nova Salud</span>
            <span className="text-xs text-teal-400">Punto de Venta</span>
          </div>
        </div>

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

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 w-full rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-slate-400 hover:text-white" onClick={() => navigate("/login")}>
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </div>
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

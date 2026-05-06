import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Cross, User, Lock, AlertCircle } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Por requerimiento de diseño, mostramos el estado de error por defecto
  const [hasError, setHasError] = useState(true); 

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setHasError(false); // Hide error on try
    setLoading(true);
    // Simular validación
    setTimeout(() => {
      setLoading(false);
      navigate("/pos");
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Panel Izquierdo: Corporativo (Split Screen) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-center items-center overflow-hidden">
        {/* Patrón de fondo sutil */}
        <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="w-24 h-24 bg-teal-500 rounded-[1.5rem] flex items-center justify-center shadow-2xl mb-8 transform -rotate-6 transition-transform hover:rotate-0 duration-500">
            <Cross className="w-14 h-14 text-white transform rotate-6" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Nova Salud</h1>
          <p className="text-xl text-slate-400 font-light max-w-md leading-relaxed">
            El sistema integral más ágil para el Punto de Venta y Control de Inventario de tu botica.
          </p>
        </div>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200">
          
          {/* Logo visible solo en móviles (cuando se oculta el panel izquierdo) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden justify-center">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <Cross className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Nova Salud</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Acceso al Sistema POS
            </h2>
            <p className="text-slate-500 text-sm">
              Ingresa tus credenciales para comenzar tu turno.
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Input Usuario */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Ej. jperez"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition-all text-sm text-slate-800 bg-slate-50 focus:bg-white shadow-sm
                    ${hasError ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                  required
                />
              </div>
            </div>
            
            {/* Input Contraseña */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-12 py-3 rounded-xl border outline-none transition-all text-sm text-slate-800 bg-slate-50 focus:bg-white shadow-sm
                    ${hasError ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-teal-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mensaje de Error (Se muestra por defecto para cumplir el requerimiento de diseño) */}
            {hasError && (
              <div className="flex items-center gap-1.5 text-red-500 pt-1">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">
                  Usuario o contraseña incorrectos
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-base py-3.5 px-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
            >
              {loading ? "Verificando..." : "Iniciar Sesión"}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}

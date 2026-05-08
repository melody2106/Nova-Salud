import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Cross, User, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.js";
import { Link } from "react-router-dom";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/dashboard/pos");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Usuario o contraseña incorrectos";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
                  placeholder="Ej. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition-all text-sm text-slate-800 bg-slate-50 focus:bg-white shadow-sm
                    ${error ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                  required
                  disabled={loading}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-11 pr-12 py-3 rounded-xl border outline-none transition-all text-sm text-slate-800 bg-slate-50 focus:bg-white shadow-sm
                    ${error ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-teal-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="flex items-center gap-1.5 text-red-500 pt-1">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold text-base py-3.5 px-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  Verificando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
            
            {/* Credenciales de prueba */}
            <div className="mt-6 pt-6 border-t border-slate-200 text-xs text-slate-500">
              <p className="font-medium mb-2">📝 Credenciales de prueba:</p>
              <p>Usuario: <span className="font-mono bg-slate-100 px-1 rounded">admin</span></p>
              <p>Contraseña: <span className="font-mono bg-slate-100 px-1 rounded">password123</span></p>
            </div>

            <p className="text-center text-sm text-slate-500 pt-2">
              ¿No tienes cuenta?{" "}
              <Link to="/register" className="text-teal-600 font-semibold hover:underline">Regístrate</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

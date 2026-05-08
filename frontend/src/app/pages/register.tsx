import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Cross, User, Lock, Box, Stethoscope, AlertCircle, CheckCircle2 } from "lucide-react";
import { registrarApi } from "../../services/api";

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    dni: "", nombres: "", apellidos: "",
    id_cargo: 0, username: "", password: "", confirmar: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === "id_cargo" ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden."); return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres."); return;
    }

    setLoading(true);
    try {
      const res = await registrarApi({
        dni: form.dni,
        nombres: form.nombres,
        apellidos: form.apellidos,
        username: form.username,
        password: form.password,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setError(res.message || "Error al registrar.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Panel izquierdo igual que Login */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-center items-center overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="w-24 h-24 bg-teal-500 rounded-[1.5rem] flex items-center justify-center shadow-2xl mb-8 transform -rotate-6 hover:rotate-0 duration-500 transition-transform">
            <Cross className="w-14 h-14 text-white transform rotate-6" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Nova Salud</h1>
          <p className="text-xl text-slate-400 font-light max-w-md leading-relaxed">
            Crea tu cuenta para acceder al sistema de gestión de botica.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 my-6">

          <div className="flex items-center gap-3 mb-6 lg:hidden justify-center">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <Cross className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Nova Salud</h1>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Crear cuenta</h2>
            <p className="text-slate-500 text-sm">Completa tus datos para registrarte.</p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="w-16 h-16 text-teal-500" />
              <p className="text-lg font-semibold text-slate-800">¡Cuenta creada!</p>
              <p className="text-slate-500 text-sm text-center">Redirigiendo al login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* DNI */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">DNI</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Box className="w-5 h-5 text-slate-400" />
                  </div>
                  <input name="dni" type="text" maxLength={8} placeholder="12345678"
                    value={form.dni} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 outline-none text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                    required disabled={loading} />
                </div>
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombres</label>
                  <input name="nombres" type="text" placeholder="Juan"
                    value={form.nombres} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                    required disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Apellidos</label>
                  <input name="apellidos" type="text" placeholder="Pérez"
                    value={form.apellidos} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                    required disabled={loading} />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Usuario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <input name="username" type="text" placeholder="Ej. jperez"
                    value={form.username} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 outline-none text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                    required disabled={loading} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={form.password} onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-300 outline-none text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                    required disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-teal-600 transition-colors" disabled={loading}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input name="confirmar" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={form.confirmar} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 outline-none text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                    required disabled={loading} />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold text-base py-3.5 px-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Registrando...</>
                ) : "Crear cuenta"}
              </button>

              <p className="text-center text-sm text-slate-500 pt-2">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="text-teal-600 font-semibold hover:underline">Iniciar sesión</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
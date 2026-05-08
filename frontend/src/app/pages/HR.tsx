import axios from "axios";
import { useState, type FormEvent } from "react";
import { Users, UserCircle, Search, Plus, Save, X } from "lucide-react";

export function HR() {
  const [activeTab, setActiveTab] = useState<"empleados" | "usuarios">("empleados");
  const [showModal, setShowModal] = useState(false);
  const [nombresRH, setNombresRH] = useState("");
  const [apellidosRH, setApellidosRH] = useState("");
  const [dniRH, setDniRH] = useState("");
  const [usernameRH, setUsernameRH] = useState("");
  const [passwordRH, setPasswordRH] = useState("");
  const [idCargoRH, setIdCargoRH] = useState("2");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const handleOpenModal = () => {
    setFormError(null);
    setFormMessage(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmitRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormMessage(null);

    if (!nombresRH || !apellidosRH || !dniRH || !usernameRH || !passwordRH || !idCargoRH) {
      setFormError("Completa todos los campos obligatorios.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          nombres: nombresRH,
          apellidos: apellidosRH,
          dni: dniRH,
          username: usernameRH,
          password: passwordRH,
          id_cargo: Number(idCargoRH),
        }
      );

      if (response.data?.success) {
        setFormMessage("Empleado registrado con éxito.");
        setNombresRH("");
        setApellidosRH("");
        setDniRH("");
        setUsernameRH("");
        setPasswordRH("");
        setIdCargoRH("2");
        setShowModal(false);
      } else {
        setFormError(response.data?.message || "No se pudo registrar el empleado.");
      }
    } catch (error: any) {
      console.error("Error al registrar empleado:", error);
      setFormError(error?.response?.data?.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <h1 className="text-xl font-bold text-slate-800">Recursos Humanos</h1>
        <p className="text-sm text-slate-500">Gestión de personal y accesos al sistema</p>
      </header>

      {/* Tabs & Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Tab Navigation */}
        <div className="bg-white px-6 border-b border-slate-200 flex gap-6 shrink-0">
          <button 
            onClick={() => setActiveTab("empleados")}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "empleados" 
                ? "border-teal-600 text-teal-700" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            Empleados
          </button>
          <button 
            onClick={() => setActiveTab("usuarios")}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "usuarios" 
                ? "border-teal-600 text-teal-700" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserCircle className="w-4 h-4" />
            Usuarios del Sistema
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            
            {activeTab === "empleados" && (
              <>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-teal-600" />
                        Registrar Nuevo Empleado
                      </h2>
                      <p className="text-sm text-slate-500">Registra un empleado y crea sus credenciales de acceso.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenModal}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Registrar Empleado
                    </button>
                  </div>
                </div>

                {showModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
                    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Registrar empleado</h3>
                          <p className="text-sm text-slate-500">Completa los datos para crear el empleado y usuario del sistema.</p>
                        </div>
                        <button type="button" onClick={handleCloseModal} className="text-slate-500 hover:text-slate-900">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleSubmitRegister}>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombres *</label>
                          <input
                            value={nombresRH}
                            onChange={(e) => setNombresRH(e.target.value)}
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Nombres completos"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos *</label>
                          <input
                            value={apellidosRH}
                            onChange={(e) => setApellidosRH(e.target.value)}
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Apellidos completos"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">DNI *</label>
                          <input
                            value={dniRH}
                            onChange={(e) => setDniRH(e.target.value)}
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Número de DNI"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                          <input
                            value={usernameRH}
                            onChange={(e) => setUsernameRH(e.target.value)}
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Nombre de usuario"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                          <input
                            value={passwordRH}
                            onChange={(e) => setPasswordRH(e.target.value)}
                            type="password"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Contraseña"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Cargo *</label>
                          <select
                            value={idCargoRH}
                            onChange={(e) => setIdCargoRH(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                          >
                            <option value="">Seleccione un cargo...</option>
                            <option value="1">Administrador</option>
                            <option value="2">Vendedor</option>
                            <option value="3">Almacenero</option>
                          </select>
                        </div>

                        {formError && (
                          <div className="col-span-1 md:col-span-2 text-sm text-red-600 font-medium">{formError}</div>
                        )}
                        {formMessage && (
                          <div className="col-span-1 md:col-span-2 text-sm text-teal-700 font-medium">{formMessage}</div>
                        )}

                        <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4">
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-60"
                          >
                            {isSubmitting ? 'Registrando...' : 'Registrar Empleado'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Directorio de Empleados</h3>
                    <div className="relative w-64">
                      <input type="text" placeholder="Buscar empleado..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-teal-500 outline-none" />
                      <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                    </div>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-600">DNI</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Nombre Completo</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Cargo</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Teléfono</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3">72635481</td>
                        <td className="px-4 py-3 font-medium text-slate-800">Juan Carlos Pérez Gómez</td>
                        <td className="px-4 py-3 text-slate-600">Técnico de Farmacia</td>
                        <td className="px-4 py-3 text-slate-600">987654321</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3">45871236</td>
                        <td className="px-4 py-3 font-medium text-slate-800">María Elena Salas Ruiz</td>
                        <td className="px-4 py-3 text-slate-600">Administrador</td>
                        <td className="px-4 py-3 text-slate-600">912345678</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === "usuarios" && (
              <>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-teal-600" />
                    Crear Credenciales de Acceso
                  </h2>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Empleado Vinculado *</label>
                      <div className="relative">
                        <input type="text" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Buscar por DNI o Nombre..." />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">El usuario debe estar registrado como empleado previamente.</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Usuario *</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="ej. jperez" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                      <input type="password" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="••••••••" />
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                      <label className="block text-sm font-medium text-slate-700 mb-3">Rol del Sistema *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50">
                          <input type="radio" name="rol" className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300" />
                          <div>
                            <span className="block font-medium text-sm text-slate-800">Administrador</span>
                            <span className="block text-xs text-slate-500">Acceso total al sistema y configuraciones.</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50">
                          <input type="radio" name="rol" className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300" defaultChecked />
                          <div>
                            <span className="block font-medium text-sm text-slate-800">Vendedor (Caja)</span>
                            <span className="block text-xs text-slate-500">Acceso a POS y consulta de inventario.</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50">
                          <input type="radio" name="rol" className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300" />
                          <div>
                            <span className="block font-medium text-sm text-slate-800">Almacenero</span>
                            <span className="block text-xs text-slate-500">Gestión de stock e ingresos de mercadería.</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 pt-4 flex justify-end">
                      <button type="button" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                        <Save className="w-4 h-4" />
                        Crear Usuario
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

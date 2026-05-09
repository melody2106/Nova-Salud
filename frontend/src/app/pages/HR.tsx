import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { Users, UserCircle, Search, Plus, Save, X, CheckCircle, AlertCircle, Loader2, Filter } from "lucide-react";
import {
  registrarEmpleadoConUsuario, getUsuarios, buscarEmpleadoPorDni, crearCredencialApi,
  type UsuarioListado, type EmpleadoBuscado
} from "../../services/api";

export function HR() {
  const [activeTab, setActiveTab] = useState<"empleados" | "usuarios">("empleados");
  const [showModal, setShowModal] = useState(false);
  const [nombresRH, setNombresRH] = useState("");
  const [apellidosRH, setApellidosRH] = useState("");
  const [dniRH, setDniRH] = useState("");
  const [usernameRH, setUsernameRH] = useState("");
  const [passwordRH, setPasswordRH] = useState("");
  const [idCargoRH, setIdCargoRH] = useState("2");
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Lista de empleados ─────────────────────────────────────
  const [empleados, setEmpleados] = useState<UsuarioListado[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // ── Toast interno (sin librerías externas) ─────────────────
  const [toast, setToast] = useState<{ tipo: "exito" | "error"; mensaje: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (tipo: "exito" | "error", mensaje: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ tipo, mensaje });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  // ── Estados del tab "Usuarios del Sistema" ─────────────
  const [dniBusqueda, setDniBusqueda] = useState("");
  const [buscandoDni, setBuscandoDni] = useState(false);
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState<EmpleadoBuscado | null>(null);
  const [credUsername, setCredUsername] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credError, setCredError] = useState("");
  const [isSubmittingCred, setIsSubmittingCred] = useState(false);
  // ── Filtro dropdown Cargo (client-side sobre los resultados del SP) ──
  const [filtroCargoHR, setFiltroCargoHR] = useState("");
  const [showFiltrosHR, setShowFiltrosHR] = useState(false);
  const filtrosHRRef = useRef<HTMLDivElement>(null);

  // ── Fetch de empleados con normalización del wrapper de MySQL ──
  const fetchEmpleados = useCallback(async (termino = "") => {
    setLoadingEmpleados(true);
    try {
      const rows = await getUsuarios(termino);
      // getUsuarios ya normaliza el anidado; garantizamos array válido
      setEmpleados(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("[HR] Error al listar empleados:", err);
      setEmpleados([]);
    } finally {
      setLoadingEmpleados(false);
    }
  }, []);

  // Carga inicial al montar el componente
  useEffect(() => { fetchEmpleados(); }, [fetchEmpleados]);

  // Búsqueda con debounce de 350 ms (delega en el SP del backend)
  useEffect(() => {
    const timer = setTimeout(() => fetchEmpleados(busqueda), 350);
    return () => clearTimeout(timer);
  }, [busqueda, fetchEmpleados]);

  // Filtro de Cargo client-side sobre los empleados ya devueltos por el backend
  const empleadosFiltrados = filtroCargoHR
    ? empleados.filter(e => (e.nombre_cargo ?? '').toLowerCase() === filtroCargoHR.toLowerCase())
    : empleados;

  // Valores únicos de cargo para el select
  const cargosUnicos = [...new Set(empleados.map(e => e.nombre_cargo).filter(Boolean))];

  const handleOpenModal = () => {
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const resetForm = () => {
    setNombresRH(""); setApellidosRH(""); setDniRH("");
    setUsernameRH(""); setPasswordRH(""); setIdCargoRH("2");
    setFormError(null);
  };

  const handleSubmitRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!nombresRH || !apellidosRH || !dniRH || !usernameRH || !passwordRH || !idCargoRH) {
      setFormError("Completa todos los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registrarEmpleadoConUsuario({
        nombres: nombresRH, apellidos: apellidosRH, dni: dniRH,
        username: usernameRH, password: passwordRH, id_cargo: Number(idCargoRH),
      });
      if (res.success) {
        showToast("exito", `✅ Empleado "${nombresRH} ${apellidosRH}" registrado con éxito.`);
        setShowModal(false);
        resetForm();
        fetchEmpleados(busqueda);
      } else {
        setFormError(res.message || "No se pudo registrar el empleado.");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Error al conectar con el servidor.";
      setFormError(msg);
      showToast("error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handlers tab Usuarios del Sistema ────────────────
  const handleBuscarDni = async () => {
    if (!dniBusqueda.trim()) return;
    setBuscandoDni(true);
    setEmpleadoEncontrado(null);
    setCredError("");
    try {
      const emp = await buscarEmpleadoPorDni(dniBusqueda.trim());
      if (emp) {
        setEmpleadoEncontrado(emp);
      } else {
        // El SP devolvió 200 pero sin datos — caso inesperado
        const msg = `No se encontró un empleado con DNI "${dniBusqueda}".`;
        setCredError(msg);
        showToast("error", msg);
      }
    } catch (err: any) {
      // Extrae el mensaje del backend (404, 500, etc.) o usa un fallback
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Error al buscar. Verifica la conexión.";
      setCredError(msg);
      showToast("error", msg);
    } finally {
      setBuscandoDni(false);
    }
  };

  const handleSubmitCredencial = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCredError("");
    if (!empleadoEncontrado) { setCredError("Busca un empleado primero."); return; }
    if (!credUsername || !credPassword) { setCredError("Completa el username y la contraseña."); return; }
    setIsSubmittingCred(true);
    try {
      const res = await crearCredencialApi({
        id_empleado: empleadoEncontrado.id_empleado,
        username: credUsername,
        password: credPassword,
      });
      if (res.success) {
        showToast("exito", `Credenciales creadas para "${empleadoEncontrado.nombre_completo}".`);
        setDniBusqueda(""); setEmpleadoEncontrado(null);
        setCredUsername(""); setCredPassword(""); setCredError("");
        fetchEmpleados(busqueda); // Refresca la tabla
      } else {
        setCredError(res.message || "Error al crear credencial.");
      }
    } catch (err: any) {
      setCredError(err?.response?.data?.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmittingCred(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Toast de notificación */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all animate-in slide-in-from-top-2 ${toast.tipo === "exito" ? "bg-teal-600" : "bg-red-500"
            }`}
        >
          {toast.tipo === "exito"
            ? <CheckCircle className="w-5 h-5 shrink-0" />
            : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.mensaje}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
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
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "empleados"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            <Users className="w-4 h-4" />
            Empleados
          </button>
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "usuarios"
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
                          <div className="col-span-1 md:col-span-2 text-sm text-teal-700 font-medium">{formMessage.text}</div>
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
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center gap-3 bg-slate-50 flex-wrap">
                    <h3 className="font-semibold text-slate-800">
                      Directorio de Empleados
                      {loadingEmpleados && <Loader2 className="inline ml-2 w-4 h-4 animate-spin text-teal-600" />}
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* Buscador omnipotente (delega en SP backend) */}
                      <div className="relative w-64">
                        <input
                          type="text"
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          placeholder="Buscar por nombre, DNI, cargo, usuario..."
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                      </div>

                      {/* Dropdown filtro Cargo */}
                      <div className="relative" ref={filtrosHRRef}>
                        <button
                          onClick={() => setShowFiltrosHR(v => !v)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                            filtroCargoHR
                              ? 'bg-teal-50 border-teal-400 text-teal-700'
                              : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Filter className="w-3.5 h-3.5" />
                          Cargo
                          {filtroCargoHR && <span className="w-2 h-2 rounded-full bg-teal-500" />}
                        </button>
                        {showFiltrosHR && (
                          <div className="absolute right-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-52 flex flex-col gap-3">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtrar por Cargo</label>
                            <select
                              value={filtroCargoHR}
                              onChange={e => { setFiltroCargoHR(e.target.value); setShowFiltrosHR(false); }}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 outline-none bg-slate-50"
                            >
                              <option value="">Todos los cargos</option>
                              {cargosUnicos.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {filtroCargoHR && (
                              <button
                                onClick={() => { setFiltroCargoHR(""); setShowFiltrosHR(false); }}
                                className="text-xs text-red-500 hover:text-red-700 text-left"
                              >
                                ✕ Limpiar filtro
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-600">DNI</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Nombre Completo</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Cargo</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Usuario del Sistema</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingEmpleados ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                            <Loader2 className="inline w-5 h-5 animate-spin mr-2" />
                            Cargando empleados...
                          </td>
                        </tr>
                      ) : empleadosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                            {busqueda || filtroCargoHR
                              ? `No se encontraron resultados para "${[busqueda, filtroCargoHR].filter(Boolean).join(' / ')}".`
                              : "No hay empleados registrados."}
                          </td>
                        </tr>
                      ) : (
                        empleadosFiltrados.map((emp) => (
                          <tr key={emp.id_empleado} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-600">{emp.dni}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{emp.nombre_completo}</td>
                            <td className="px-4 py-3">
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                                {emp.nombre_cargo}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {emp.username
                                ? <span className="font-mono text-slate-700">{emp.username}</span>
                                : <span className="italic text-slate-400 text-xs">Sin usuario</span>}
                            </td>
                          </tr>
                        ))
                      )}
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
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleSubmitCredencial}>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Buscar Empleado por DNI *</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={dniBusqueda}
                            onChange={e => { setDniBusqueda(e.target.value); setEmpleadoEncontrado(null); }}
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleBuscarDni())}
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Ej. 72635481"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>
                        <button type="button" onClick={handleBuscarDni} disabled={buscandoDni || !dniBusqueda.trim()}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors">
                          {buscandoDni ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          Buscar
                        </button>
                      </div>
                      {empleadoEncontrado && (
                        <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-teal-800">{empleadoEncontrado.nombre_completo}</p>
                            <p className="text-xs text-teal-600">{empleadoEncontrado.nombre_cargo} · DNI: {empleadoEncontrado.dni}</p>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-1">El empleado debe estar registrado previamente en el sistema.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Usuario *</label>
                      <input type="text" value={credUsername} onChange={e => setCredUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="ej. jperez" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                      <input type="password" value={credPassword} onChange={e => setCredPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="••••••••" />
                    </div>

                    {credError && (
                      <div className="col-span-1 md:col-span-2 flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 shrink-0" />{credError}
                      </div>
                    )}

                    <div className="col-span-1 md:col-span-2 pt-4 flex justify-end">
                      <button type="submit" disabled={isSubmittingCred || !empleadoEncontrado}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                        {isSubmittingCred ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar Credenciales</>}
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

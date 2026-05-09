import { useState, useEffect, useRef } from "react";
import { Search, Plus, Filter, AlertTriangle, X, Check, PackageOpen, Clock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  getProductos,
  getAlertasInventario,
  registrarProductoApi,
  type Producto,
  type AlertasInventario,
} from "../../services/api";

export function Inventory() {
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  // ── Filtros dropdown ──────────────────────────────
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroLaboratorio, setFiltroLaboratorio] = useState("");
  const [showFiltros, setShowFiltros] = useState(false);
  const filtrosRef = useRef<HTMLDivElement>(null);

  // ── Datos reales ─────────────────────────────────────
  const [productos, setProductos] = useState<Producto[]>([]);
  const [alertas, setAlertas] = useState<AlertasInventario>({ lotesPorVencer: [], productosStockBajo: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Toast interno ──────────────────────────────────
  const [toast, setToast] = useState<{ tipo: "exito" | "error"; msg: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (tipo: "exito" | "error", msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ tipo, msg });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  // ── Estados del modal "Nuevo Producto" ──────────────────
  const [prod, setProd] = useState({
    nombre_comercial: "",
    principio_activo: "",
    id_laboratorio: "",
    id_categoria: "",
    id_presentacion: "",
    stock_minimo: "10",
  });
  const [modalError, setModalError] = useState("");
  const [isSubmittingProd, setIsSubmittingProd] = useState(false);

  const resetModal = () => {
    setProd({ nombre_comercial: "", principio_activo: "", id_laboratorio: "", id_categoria: "", id_presentacion: "", stock_minimo: "10" });
    setModalError("");
  };

  const openModal = () => { resetModal(); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prods, alts] = await Promise.all([getProductos(), getAlertasInventario()]);
      setProductos(prods);
      setAlertas(alts);
    } catch (err: any) {
      setError("No se pudieron cargar los datos. Verifica la conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmitProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (!prod.nombre_comercial || !prod.id_laboratorio || !prod.id_categoria || !prod.id_presentacion) {
      setModalError("Completa los campos obligatorios: Nombre, Laboratorio, Categoría y Presentación.");
      return;
    }
    setIsSubmittingProd(true);
    try {
      const res = await registrarProductoApi({
        nombre_comercial: prod.nombre_comercial,
        principio_activo: prod.principio_activo || undefined,
        id_laboratorio: Number(prod.id_laboratorio),
        id_categoria: Number(prod.id_categoria),
        id_presentacion: Number(prod.id_presentacion),
        stock_minimo: Number(prod.stock_minimo) || 10,
      });
      if (res.success) {
        showToast("exito", `Producto "${prod.nombre_comercial}" registrado con éxito.`);
        closeModal();
        fetchData(); // Refresca la tabla
      } else {
        setModalError(res.message || "Error al registrar el producto.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al conectar con el servidor.";
      setModalError(msg);
      showToast("error", msg);
    } finally {
      setIsSubmittingProd(false);
    }
  };

  const productosFiltrados = productos.filter((p) => {
    if (!p) return false;
    const q = busqueda.toLowerCase().trim();
    // Búsqueda omnipotente: todas las columnas visuales
    const passSearch = !q || [
      p.nombre_comercial,
      p.principio_activo,
      p.nombre_categoria,
      p.nombre_laboratorio,
      p.nombre_presentacion,
      String(p.stock_actual_unidades ?? ''),
      p.proximo_vencimiento ? formatDate(p.proximo_vencimiento) : '',
      p.proximo_vencimiento ?? '',
    ].some(v => (v ?? '').toLowerCase().includes(q));
    // Filtros exactos del dropdown
    const passCategoria  = !filtroCategoria  || (p.nombre_categoria  ?? '').toLowerCase() === filtroCategoria.toLowerCase();
    const passLaboratorio = !filtroLaboratorio || (p.nombre_laboratorio ?? '').toLowerCase() === filtroLaboratorio.toLowerCase();
    return passSearch && passCategoria && passLaboratorio;
  });

  // Valores únicos para los selects del dropdown
  const categorias   = [...new Set(productos.map(p => p.nombre_categoria).filter(Boolean))];
  const laboratorios = [...new Set(productos.map(p => p.nombre_laboratorio).filter(Boolean))];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "2-digit" });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${
          toast.tipo === "exito" ? "bg-teal-600" : "bg-red-500"}`}>
          {toast.tipo === "exito" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Gestión de Inventario</h1>
          <p className="text-sm text-slate-500">Administra tus productos, stock y precios</p>
        </div>
        <button
          onClick={openModal}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </header>

      <div className="flex-1 p-6 overflow-auto flex flex-col gap-4">

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ALERTAS CARDS */}
        {!loading && (alertas.productosStockBajo.length > 0 || alertas.lotesPorVencer.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">

            {/* Stock Bajo */}
            {alertas.productosStockBajo.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-800">Stock Bajo ({alertas.productosStockBajo.length})</h3>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {alertas.productosStockBajo.map((p) => (
                    <div key={p.id_producto} className="flex justify-between items-center bg-white/70 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-red-900 truncate">{p.nombre_comercial}</span>
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full ml-2 shrink-0">
                        {p.stock_actual_unidades} / mín {p.stock_minimo_unidades}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Por Vencer */}
            {alertas.lotesPorVencer.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Por Vencer — próx. 3 meses ({alertas.lotesPorVencer.length} lotes)</h3>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {alertas.lotesPorVencer.map((l, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/70 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-amber-900 block truncate">{l.nombre_comercial}</span>
                        <span className="text-xs text-amber-600">Lote: {l.codigo_lote}</span>
                      </div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full ml-2 shrink-0">
                        {formatDate(l.fecha_vencimiento)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por nombre, categoría, laboratorio, vencimiento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Dropdown Filtros */}
          <div className="relative" ref={filtrosRef}>
            <button
              onClick={() => setShowFiltros(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                (filtroCategoria || filtroLaboratorio)
                  ? 'bg-teal-50 border-teal-400 text-teal-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {(filtroCategoria || filtroLaboratorio) && (
                <span className="w-2 h-2 rounded-full bg-teal-500" />
              )}
            </button>

            {showFiltros && (
              <div className="absolute left-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-64 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Categoría</label>
                  <select
                    value={filtroCategoria}
                    onChange={e => setFiltroCategoria(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 outline-none bg-slate-50"
                  >
                    <option value="">Todas</option>
                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Laboratorio</label>
                  <select
                    value={filtroLaboratorio}
                    onChange={e => setFiltroLaboratorio(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 outline-none bg-slate-50"
                  >
                    <option value="">Todos</option>
                    {laboratorios.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                {(filtroCategoria || filtroLaboratorio) && (
                  <button
                    onClick={() => { setFiltroCategoria(""); setFiltroLaboratorio(""); }}
                    className="text-xs text-red-500 hover:text-red-700 text-left"
                  >
                    ✕ Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex gap-2">
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-100">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Stock Bajo ({alertas.productosStockBajo.length})
            </div>
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Por Vencer ({alertas.lotesPorVencer.length})
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Cargando productos...</span>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Comercial</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Principio Activo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Próx. Vencimiento</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                        {busqueda ? `Sin resultados para "${busqueda}"` : "No hay productos registrados."}
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((p) => {
                      const isLowStock = alertas.productosStockBajo.some((a) => a.id_producto === p.id_producto);
                      const isExpiring = alertas.lotesPorVencer.some((l) => l.id_producto === p.id_producto);
                      const isOutOfStock = p.stock_actual_unidades === 0;

                      return (
                        <tr key={p.id_producto} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{p.nombre_comercial}</span>
                              {isExpiring && <Clock className="w-3.5 h-3.5 text-amber-500" aria-label="Lote por vencer" />}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{p.principio_activo}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{p.nombre_categoria}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-bold ${
                              isOutOfStock
                                ? "bg-red-100 text-red-700"
                                : isLowStock
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {p.stock_actual_unidades}
                              {isLowStock && !isOutOfStock && <AlertTriangle className="w-3 h-3 ml-1" />}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {isExpiring ? (
                              <span className="text-amber-600 font-medium">{formatDate(p.proximo_vencimiento)}</span>
                            ) : (
                              formatDate(p.proximo_vencimiento)
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-teal-600 hover:text-teal-800 font-medium text-sm">
                              <Check className="w-4 h-4 inline mr-1" />
                              Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Producto */}
      {showModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-lg"><PackageOpen className="w-5 h-5" /></div>
                <h2 className="text-xl font-bold text-slate-800">Registrar Nuevo Producto</h2>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitProducto} className="p-6 overflow-y-auto flex-1 space-y-8">
              <section>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">1. Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nombre Comercial *</label>
                    <input value={prod.nombre_comercial} onChange={e => setProd(p => ({ ...p, nombre_comercial: e.target.value }))} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ej. Panadol Extra Fuerte" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Principio Activo</label>
                    <input value={prod.principio_activo} onChange={e => setProd(p => ({ ...p, principio_activo: e.target.value }))} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ej. Paracetamol + Cafeína" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ID Laboratorio *</label>
                    <input value={prod.id_laboratorio} onChange={e => setProd(p => ({ ...p, id_laboratorio: e.target.value }))} type="number" min="1" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ej. 1" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ID Categoría *</label>
                    <input value={prod.id_categoria} onChange={e => setProd(p => ({ ...p, id_categoria: e.target.value }))} type="number" min="1" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ej. 2" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ID Presentación *</label>
                    <input value={prod.id_presentacion} onChange={e => setProd(p => ({ ...p, id_presentacion: e.target.value }))} type="number" min="1" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ej. 1" />
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">2. Control de Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stock Mínimo Alerta</label>
                    <input value={prod.stock_minimo} onChange={e => setProd(p => ({ ...p, stock_minimo: e.target.value }))} type="number" min="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                </div>
              </section>
              {modalError && <p className="text-sm text-red-600 font-medium">{modalError}</p>}
              <div className="border-t border-slate-200 pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmittingProd} className="px-6 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                  {isSubmittingProd ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Check className="w-4 h-4" /> Guardar Producto</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

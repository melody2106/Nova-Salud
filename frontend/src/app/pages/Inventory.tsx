import { useState, useEffect } from "react";
import { Search, Plus, Filter, AlertTriangle, X, Check, PackageOpen, Clock, Loader2 } from "lucide-react";
import {
  getProductos,
  getAlertasInventario,
  type Producto,
  type AlertasInventario,
} from "../../services/api";

export function Inventory() {
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // --- Datos reales ---
  const [productos, setProductos] = useState<Producto[]>([]);
  const [alertas, setAlertas] = useState<AlertasInventario>({ lotesPorVencer: [], productosStockBajo: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
    fetchData();
  }, []);

  const productosFiltrados = productos.filter((p) => {
    if (!p) return false;
    const nombre = (p.nombre_comercial ?? '').toLowerCase();
    const principio = (p.principio_activo ?? '').toLowerCase();
    const query = busqueda.toLowerCase();
    return nombre.includes(query) || principio.includes(query);
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "2-digit" });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Gestión de Inventario</h1>
          <p className="text-sm text-slate-500">Administra tus productos, stock y precios</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
              placeholder="Buscar por nombre o principio activo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <div className="ml-auto flex gap-2">
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-100">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Stock Bajo ({alertas.productosStockBajo.length})
            </div>
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
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
                <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                  <PackageOpen className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Registrar Nuevo Producto</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form className="space-y-8">
                <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">1. Información General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nombre Comercial *</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ej. Panadol Extra Fuerte" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Principio Activo</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ej. Paracetamol + Cafeína" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Código de Barras</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Escanear..." />
                    </div>
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">2. Control de Stock</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Stock Actual</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" defaultValue="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Stock Mínimo Alerta</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" defaultValue="10" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de Vencimiento</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-700" />
                    </div>
                  </div>
                </section>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button className="px-6 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
                <Check className="w-4 h-4" />
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

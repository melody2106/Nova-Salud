import { useState } from "react";
import { Plus, Trash2, ShoppingBag, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { registrarCompra, type CompraRequest, type DetalleCompraRequest } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// ===== INTERFACES LOCALES =====

interface DetalleForm {
  id: number; // solo para key local
  id_producto: number | "";
  codigo_lote: string;
  fecha_vencimiento: string;
  cantidad: number;
  precio_unitario: number;
}

type ToastType = "success" | "error";
interface Toast { type: ToastType; message: string }

// ===== COMPONENTE =====

export function Compras() {
  const { user } = useAuth();

  // Cabecera
  const [id_laboratorio, setIdLaboratorio] = useState<number | "">("");
  const [numero_factura, setNumeroFactura] = useState("");

  // Detalles
  const [detalles, setDetalles] = useState<DetalleForm[]>([
    { id: Date.now(), id_producto: "", codigo_lote: "", fecha_vencimiento: "", cantidad: 1, precio_unitario: 0 },
  ]);

  // UI
  const [procesando, setProcesando] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // ===== HELPERS =====

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const agregarFila = () => {
    setDetalles((prev) => [
      ...prev,
      { id: Date.now(), id_producto: "", codigo_lote: "", fecha_vencimiento: "", cantidad: 1, precio_unitario: 0 },
    ]);
  };

  const eliminarFila = (id: number) => {
    if (detalles.length === 1) return;
    setDetalles((prev) => prev.filter((d) => d.id !== id));
  };

  const actualizarFila = (id: number, field: keyof DetalleForm, value: any) => {
    setDetalles((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const totalCompra = detalles.reduce(
    (acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0),
    0
  );

  // ===== SUBMIT =====

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!id_laboratorio) return showToast("error", "Selecciona un laboratorio.");
    if (!numero_factura.trim()) return showToast("error", "Ingresa el número de factura.");

    const detallesInvalidos = detalles.filter(
      (d) => !d.id_producto || !d.codigo_lote || !d.fecha_vencimiento || d.cantidad <= 0 || d.precio_unitario <= 0
    );
    if (detallesInvalidos.length > 0) {
      return showToast("error", "Completa todos los campos de cada fila de detalle.");
    }

    const payload: CompraRequest = {
      id_laboratorio: Number(id_laboratorio),
      id_usuario: user?.id_usuario ?? 2,
      numero_factura_compra: numero_factura.trim(),
      total_compra: parseFloat(totalCompra.toFixed(2)),
      detalles: detalles.map((d): DetalleCompraRequest => ({
        id_producto: Number(d.id_producto),
        codigo_lote: d.codigo_lote,
        fecha_vencimiento: d.fecha_vencimiento,
        cantidad: Number(d.cantidad),
        precio_unitario: parseFloat(Number(d.precio_unitario).toFixed(2)),
      })),
    };

    try {
      setProcesando(true);
      const res = await registrarCompra(payload);
      if (res.success) {
        showToast("success", `✅ Compra registrada exitosamente (ID #${res.data?.id_compra ?? "—"}). Stock actualizado.`);
        // Reset formulario
        setIdLaboratorio("");
        setNumeroFactura("");
        setDetalles([{ id: Date.now(), id_producto: "", codigo_lote: "", fecha_vencimiento: "", cantidad: 1, precio_unitario: 0 }]);
      } else {
        showToast("error", res.message ?? "Error al registrar la compra.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Error de conexión con el servidor.";
      showToast("error", msg);
    } finally {
      setProcesando(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="h-full flex flex-col bg-slate-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border max-w-sm animate-in slide-in-from-top-5 duration-300 ${
          toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.type === "success"
            ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          }
          <p className="text-sm font-medium leading-snug">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Registro de Compras</h1>
            <p className="text-sm text-slate-500">Ingresa mercadería y actualiza el inventario automáticamente</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">

          {/* CABECERA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              1. Datos de la Compra
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Laboratorio / Proveedor *
                </label>
                <select
                  value={id_laboratorio}
                  onChange={(e) => setIdLaboratorio(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                >
                  <option value="">Seleccione...</option>
                  <option value="1">Laboratorio 1</option>
                  <option value="2">Laboratorio 2</option>
                  <option value="3">Laboratorio 3</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">ID enviado al backend como id_laboratorio</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  N° Factura Proveedor *
                </label>
                <input
                  type="text"
                  value={numero_factura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  placeholder="Ej. F001-00012345"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha de Compra</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-700"
                  disabled
                />
                <p className="text-xs text-slate-400 mt-1">Generada automáticamente por el servidor</p>
              </div>
            </div>
          </div>

          {/* DETALLES */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                2. Detalle de Productos
              </h2>
              <button
                type="button"
                onClick={agregarFila}
                className="flex items-center gap-1.5 text-teal-600 hover:text-teal-800 text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar producto
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase">ID Producto *</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Código Lote *</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Fecha Vencimiento *</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase w-28">Cantidad *</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase w-32">P. Unitario (S/) *</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase w-28 text-right">Subtotal</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detalles.map((d) => {
                    const subtotal = (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            value={d.id_producto}
                            onChange={(e) => actualizarFila(d.id, "id_producto", e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="ID"
                            min="1"
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                            required
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={d.codigo_lote}
                            onChange={(e) => actualizarFila(d.id, "codigo_lote", e.target.value)}
                            placeholder="LOTE-001"
                            className="w-36 px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                            required
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="date"
                            value={d.fecha_vencimiento}
                            onChange={(e) => actualizarFila(d.id, "fecha_vencimiento", e.target.value)}
                            className="px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none text-slate-700"
                            required
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            value={d.cantidad}
                            onChange={(e) => actualizarFila(d.id, "cantidad", Number(e.target.value))}
                            min="1"
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                            required
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            value={d.precio_unitario}
                            onChange={(e) => actualizarFila(d.id, "precio_unitario", parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-24 px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                            required
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                          S/ {subtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => eliminarFila(d.id)}
                            disabled={detalles.length === 1}
                            className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-4">
              <span className="text-sm font-semibold text-slate-600">Total Compra:</span>
              <span className="text-2xl font-bold text-teal-700">S/ {totalCompra.toFixed(2)}</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pb-4">
            <button
              type="button"
              onClick={() => {
                setIdLaboratorio("");
                setNumeroFactura("");
                setDetalles([{ id: Date.now(), id_producto: "", codigo_lote: "", fecha_vencimiento: "", cantidad: 1, precio_unitario: 0 }]);
              }}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={procesando}
              className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              {procesando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
              ) : (
                <><ShoppingBag className="w-4 h-4" /> Registrar Compra</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

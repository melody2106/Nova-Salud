import { useState, useEffect, useCallback } from "react";
import {
  Search, User, FileText, Receipt, Trash2,
  CreditCard, Banknote, ArrowRightLeft, ScanLine,
  CheckCircle, XCircle, Loader2,
} from "lucide-react";
import {
  getProductos, getPreciosProducto, registrarVenta,
  buscarClientePorDni, getClienteGenerico,
  type Producto, type DetalleVentaRequest, type VentaRequest, type Cliente,
} from "../../services/api.ts";
import { useAuth } from "../../contexts/AuthContext.tsx";

interface CarritoItem {
  id_producto: number;
  id_producto_precio: number | null;
  producto: string;
  presentacion: string;
  cant: number;
  precio: number;
  subtotal: number;
}

type ToastType = "success" | "error";
interface Toast { type: ToastType; message: string }

function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = toast.type === "success";
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border max-w-sm animate-in slide-in-from-top-5 duration-300 ${
      isSuccess ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
    }`}>
      {isSuccess
        ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </div>
  );
}

export function Pos() {
  const { user } = useAuth();

  const [comprobante, setComprobante] = useState<"boleta" | "factura">("boleta");
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("0.00");

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  // ── Cliente ──────────────────────────────────────────────────
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [dniBusquedaCliente, setDniBusquedaCliente] = useState("");
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  const [procesando, setProcesando] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  
  // 1. NUEVO ESTADO PARA RECORDAR EL ID DE LA ÚLTIMA VENTA
  const [ultimaVentaId, setUltimaVentaId] = useState<number | null>(null);

  const showToast = (type: ToastType, message: string) => setToast({ type, message });

  // FUNCIÓN AUXILIAR PARA LA DESCARGA DEL PDF
  const descargarComprobantePDF = async (idVenta: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/reportes/pdf/${idVenta}`);
      if (!response.ok) throw new Error('Error al obtener el documento');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Comprobante_NovaSalud_${idVenta}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
      showToast("error", "Error al procesar la descarga del PDF.");
    }
  };

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoadingProductos(true);
        const data = await getProductos();
        setProductos(data);
      } catch {
        showToast("error", "No se pudieron cargar los productos. Verifica la conexión.");
      } finally {
        setLoadingProductos(false);
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    getClienteGenerico()
      .then(setCliente)
      .catch(() => setCliente({ id_cliente: 1, nombres: "PÚBLICO", apellidos: "EN GENERAL", dni: "00000000" }));
  }, []);

  const handleUsarClienteGenerico = async () => {
    try {
      const c = await getClienteGenerico();
      setCliente(c);
      setDniBusquedaCliente("");
    } catch {
      setCliente({ id_cliente: 1, nombres: "PÚBLICO", apellidos: "EN GENERAL", dni: "00000000" });
    }
  };

  const handleBuscarCliente = async () => {
    if (!dniBusquedaCliente.trim()) return;
    setBuscandoCliente(true);
    try {
      const c = await buscarClientePorDni(dniBusquedaCliente.trim());
      if (c) {
        setCliente(c);
      } else {
        showToast("error", `No se encontró cliente con DNI "${dniBusquedaCliente}"`);
      }
    } catch {
      showToast("error", "Error al buscar cliente.");
    } finally {
      setBuscandoCliente(false);
    }
  };

  const productosFiltrados = productos.filter((p) => {
    if (!p) return false;
    const q = busqueda.toLowerCase();
    return (
      (p.nombre_comercial ?? "").toLowerCase().includes(q) ||
      (p.principio_activo ?? "").toLowerCase().includes(q)
    );
  });

  const agregarAlCarrito = async (producto: Producto) => {
    if (producto.stock_actual_unidades <= 0) {
      showToast("error", `${producto.nombre_comercial} no tiene stock disponible.`);
      return;
    }

    const existente = carrito.find((i) => i.id_producto === producto.id_producto);
    if (existente) {
      if (existente.cant >= producto.stock_actual_unidades) {
        showToast("error", `Stock máximo disponible: ${producto.stock_actual_unidades} unidades.`);
        return;
      }
      setCarrito((prev) =>
        prev.map((i) =>
          i.id_producto === producto.id_producto
            ? { ...i, cant: i.cant + 1, subtotal: parseFloat(((i.cant + 1) * i.precio).toFixed(2)) }
            : i
        )
      );
      setBusqueda("");
      return;
    }

    let precio = 0;
    let id_producto_precio: number | null = null;
    try {
      const precios = await getPreciosProducto(producto.id_producto);
      if (precios.length > 0) {
        precio = parseFloat(String(precios[0].precio_venta ?? 0)) || 0;
        id_producto_precio = Number(precios[0].id_producto_precio) || null;
      } else {
        showToast("error", `${producto.nombre_comercial} no tiene precio configurado. Ingrésalo manualmente.`);
      }
    } catch {
      showToast("error", "No se pudo obtener el precio. Ingrésalo manualmente.");
    }

    setCarrito((prev) => [
      ...prev,
      {
        id_producto: producto.id_producto,
        id_producto_precio,
        producto: producto.nombre_comercial,
        presentacion: producto.nombre_presentacion,
        cant: 1,
        precio,
        subtotal: precio,
      },
    ]);
    setBusqueda("");
  };

  const actualizarCantidad = (id_producto: number, rawCant: number) => {
    const nuevaCant = Math.max(1, Math.floor(Number(rawCant) || 1));
    const prod = productos.find((p) => p.id_producto === id_producto);
    if (prod && nuevaCant > prod.stock_actual_unidades) {
      showToast("error", `Stock máximo disponible: ${prod.stock_actual_unidades} unidades.`);
      return;
    }
    setCarrito((prev) =>
      prev.map((i) =>
        i.id_producto === id_producto
          ? { ...i, cant: nuevaCant, subtotal: Number((nuevaCant * i.precio).toFixed(2)) }
          : i
      )
    );
  };

  const actualizarPrecio = (id_producto: number, rawVal: string | number) => {
    const nuevoPrecio = Math.max(0, parseFloat(String(rawVal)) || 0);
    setCarrito((prev) =>
      prev.map((i) =>
        i.id_producto === id_producto
          ? { ...i, precio: nuevoPrecio, subtotal: Number((i.cant * nuevoPrecio).toFixed(2)) }
          : i
      )
    );
  };

  const eliminarDelCarrito = (id_producto: number) =>
    setCarrito((prev) => prev.filter((i) => i.id_producto !== id_producto));

  const limpiarCarrito = () => {
    setCarrito([]);
    setMontoRecibido("0.00");
  };

  const subtotal = carrito.reduce((acc, i) => acc + i.cant * i.precio, 0);
  const igv      = subtotal * 0.18;
  const total    = subtotal + igv;
  const vuelto   = (parseFloat(montoRecibido || "0") || 0) - total;

  const procesarVenta = useCallback(async () => {
    if (carrito.length === 0) {
      showToast("error", "Agrega al menos un producto al carrito.");
      return;
    }
    const sinPrecio = carrito.filter((i) => !(Number(i.precio) > 0));
    if (sinPrecio.length > 0) {
      showToast("error", `Asigna un precio a: ${sinPrecio.map((i) => i.producto).join(", ")}`);
      return;
    }
    if (metodoPago === "efectivo" && (parseFloat(montoRecibido) || 0) < total) {
      showToast("error", "El monto recibido es menor al total a pagar.");
      return;
    }

    const detalles: DetalleVentaRequest[] = carrito.map((item) => {
      const cantidad        = Math.floor(Number(item.cant)) || 1;
      const precio_unitario = Number(item.precio) || 0;
      const subtotalItem    = Number((cantidad * precio_unitario).toFixed(2));
      return {
        id_producto:        Number(item.id_producto),
        id_producto_precio: item.id_producto_precio !== null ? Number(item.id_producto_precio) : null,
        cantidad,
        precio_unitario,
        subtotal: subtotalItem,
      };
    });

    const totalFinal = Number(detalles.reduce((a, d) => a + d.subtotal, 0).toFixed(2));
    if (!isFinite(totalFinal) || totalFinal <= 0) {
      showToast("error", "El total de la venta debe ser mayor a cero.");
      return;
    }

    const ventaPayload: VentaRequest = {
      id_tipo_comprobante: comprobante === "boleta" ? 1 : 2,
      id_cliente:          cliente?.id_cliente ?? 1,
      id_usuario:          Number(user?.id_usuario) || 1,
      total:               totalFinal,
      metodo_pago:         metodoPago,
      detalles,
    };

    try {
      setProcesando(true);
      const res = await registrarVenta(ventaPayload);
      if (res.success) {
        // 2. MODIFICAR PARA GUARDAR EL ID DE LA VENTA PARA LA DESCARGA MANUAL
        const idVentaGenerada = res.data?.id_venta;
        showToast("success", `✅ Venta registrada (ID #${idVentaGenerada ?? "—"})`);
        
        if (idVentaGenerada) {
          setUltimaVentaId(idVentaGenerada);
        }
        
        limpiarCarrito();
      } else {
        showToast("error", res.message ?? "Error al registrar la venta.");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error de conexión con el servidor.";
      showToast("error", msg.toLowerCase().includes("stock") ? `⚠️ Stock insuficiente: ${msg}` : msg);
    } finally {
      setProcesando(false);
    }
  }, [carrito, comprobante, total, metodoPago, montoRecibido, user, cliente]);

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold text-slate-800">Caja Principal</h1>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex flex-col text-right">
            <span className="font-semibold text-slate-800">
              {user ? `${user.nombres} ${user.apellidos}` : "—"}
            </span>
            <span className="text-slate-500">{user?.nombre_cargo ?? "Vendedor"}</span>
          </div>
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
            {user ? user.nombres.charAt(0) + user.apellidos.charAt(0) : "??"}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* LEFT — Cliente y Comprobante */}
        <div className="w-72 flex flex-col gap-4 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-full">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Datos de Venta
            </h2>

            <div className="space-y-4">
              {/* Búsqueda de cliente */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Cliente</label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="DNI / RUC"
                      value={dniBusquedaCliente}
                      onChange={(e) => setDniBusquedaCliente(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleBuscarCliente()}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    onClick={handleBuscarCliente}
                    disabled={buscandoCliente || !dniBusquedaCliente.trim()}
                    className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {buscandoCliente ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                  </button>
                </div>
                <button
                  onClick={handleUsarClienteGenerico}
                  className="w-full border border-dashed border-teal-300 text-teal-700 bg-teal-50 hover:bg-teal-100 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Usar Cliente Genérico
                </button>
              </div>

              {/* Cliente seleccionado */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Cliente Seleccionado:</span>
                {cliente ? (
                  <>
                    <span className="font-medium text-slate-800 text-sm">
                      {cliente.nombres} {cliente.apellidos}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">DNI: {cliente.dni}</span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 italic">Cargando...</span>
                )}
              </div>

              {/* Tipo comprobante */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  Tipo de Comprobante
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setComprobante("boleta")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      comprobante === "boleta"
                        ? "bg-teal-50 border-teal-200 text-teal-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Receipt className="w-4 h-4" /> Boleta
                  </button>
                  <button
                    onClick={() => setComprobante("factura")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      comprobante === "factura"
                        ? "bg-teal-50 border-teal-200 text-teal-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Factura
                  </button>
                </div>

                {/* 3. INTEGRACIÓN DEL BOTÓN DE DESCARGA MANUAL */}
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <button
                    onClick={() => ultimaVentaId && descargarComprobantePDF(ultimaVentaId)}
                    disabled={!ultimaVentaId}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold border transition-all ${
                      ultimaVentaId 
                        ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 shadow-sm" 
                        : "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    {ultimaVentaId ? "DESCARGAR ÚLTIMA VENTA" : "SIN VENTA PENDIENTE"}
                  </button>
                  {ultimaVentaId && (
                    <p className="text-[10px] text-center text-amber-600 mt-1 animate-pulse">
                      ID listo para descargar: #{ultimaVentaId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER — Buscador y Carrito */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 shrink-0">
            <div className="p-2 flex items-center gap-2">
              <div className="bg-teal-100 p-2 rounded-lg">
                <ScanLine className="w-5 h-5 text-teal-700" />
              </div>
              <input
                type="text"
                placeholder={loadingProductos ? "Cargando productos..." : "Buscar por nombre o principio activo..."}
                className="flex-1 px-3 py-2 text-lg outline-none bg-transparent"
                autoFocus
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                disabled={loadingProductos}
              />
              {loadingProductos && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
            </div>

            {!loadingProductos && productos.length > 0 && (
              <div className="border-t border-slate-100 max-h-52 overflow-y-auto">
                {busqueda.length > 0 && productosFiltrados.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Sin resultados para "{busqueda}"
                  </p>
                ) : (
                  <>
                    {busqueda.length === 0 && (
                      <p className="text-xs text-slate-400 px-4 py-2 bg-slate-50 border-b border-slate-100 font-medium">
                        📦 {productos.length} productos disponibles — escribe para filtrar
                      </p>
                    )}
                    {(busqueda.length > 0 ? productosFiltrados : productos)
                      .slice(0, 10)
                      .map((p) => (
                        <button
                          key={p.id_producto}
                          onClick={() => agregarAlCarrito(p)}
                          disabled={p.stock_actual_unidades <= 0}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-teal-50 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <div>
                            <span className="text-sm font-medium text-slate-800">
                              {p.nombre_comercial}
                            </span>
                            <span className="text-xs text-slate-400 ml-2">
                              {p.principio_activo ?? "—"}
                            </span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ml-2 ${
                            p.stock_actual_unidades > 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            Stock: {p.stock_actual_unidades}
                          </span>
                        </button>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Carrito */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">Producto</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">Presentación</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 w-24 text-center">Cant.</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 w-28 text-right">P. Unit</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 w-28 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 w-16 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {carrito.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                        Busca y selecciona productos para agregarlos al carrito
                      </td>
                    </tr>
                  ) : (
                    carrito.map((item) => (
                      <tr key={item.id_producto} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{item.producto}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                            {item.presentacion}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={item.cant}
                            onChange={(e) => actualizarCantidad(item.id_producto, parseInt(e.target.value) || 1)}
                            className="w-16 text-center border border-slate-300 rounded p-1 text-sm outline-none focus:border-teal-500"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            value={item.precio}
                            onChange={(e) => actualizarPrecio(item.id_producto, parseFloat(e.target.value) || 0)}
                            className="w-20 text-right border border-slate-300 rounded p-1 text-sm outline-none focus:border-teal-500"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                          S/ {item.subtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => eliminarDelCarrito(item.id_producto)}
                            className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
              {carrito.length} {carrito.length === 1 ? "item" : "items"} en el carrito
            </div>
          </div>
        </div>

        {/* RIGHT — Resumen y Pago */}
        <div className="w-80 flex flex-col gap-4 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full">
            <h2 className="font-semibold text-slate-800 mb-4">Resumen de Venta</h2>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>IGV (18%)</span>
                <span>S/ {igv.toFixed(2)}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-end">
                <span className="text-slate-800 font-semibold">Total a Pagar</span>
                <span className="text-3xl font-bold text-teal-600">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMetodoPago("efectivo")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
                      metodoPago === "efectivo"
                        ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Banknote className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Efectivo</span>
                  </button>
                  <button
                    onClick={() => setMetodoPago("tarjeta")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
                      metodoPago === "tarjeta"
                        ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Tarjeta</span>
                  </button>
                  <button
                    onClick={() => setMetodoPago("transferencia")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                      metodoPago === "transferencia"
                        ? "bg-[#742284] border-[#742284] text-white shadow-lg scale-105"
                        : "bg-[#742284] border-[#742284] text-white hover:scale-105"
                    }`}
                  >
                    <ArrowRightLeft className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold">Yape</span>
                  </button>
                </div>
              </div>

              {metodoPago === "efectivo" && (
                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Monto Recibido (S/)</label>
                    <input
                      type="number"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      className="w-full p-2 text-lg font-medium text-right border border-slate-300 rounded bg-white outline-none focus:border-teal-500"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Vuelto</span>
                    <span className={`text-xl font-bold ${vuelto < 0 ? "text-red-500" : "text-slate-800"}`}>
                      S/ {vuelto >= 0 ? vuelto.toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={procesarVenta}
              disabled={procesando || carrito.length === 0}
              className="w-full mt-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {procesando ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Procesando...</>
              ) : (
                <><Receipt className="w-6 h-6" /> GENERAR VENTA</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
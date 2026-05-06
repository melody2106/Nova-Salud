import { useState } from "react";
import { 
  Search, 
  User, 
  FileText, 
  Receipt, 
  Trash2, 
  CreditCard, 
  Banknote, 
  ArrowRightLeft, 
  PlusCircle,
  ScanLine
} from "lucide-react";

export function Pos() {
  const [comprobante, setComprobante] = useState<"boleta" | "factura">("boleta");
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta" | "transferencia" | "mixto">("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("100.00");
  
  const carrito = [
    { id: 1, producto: "Paracetamol 500mg", presentacion: "Blister x 10", cant: 2, precio: 2.50, subtotal: 5.00 },
    { id: 2, producto: "Amoxicilina 500mg", presentacion: "Caja x 100", cant: 1, precio: 35.00, subtotal: 35.00 },
    { id: 3, producto: "Ibuprofeno 400mg", presentacion: "Unidad", cant: 5, precio: 0.50, subtotal: 2.50 },
  ];

  const subtotal = 36.02;
  const igv = 6.48;
  const total = 42.50;
  const vuelto = parseFloat(montoRecibido) - total;

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Caja Principal</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex flex-col text-right">
            <span className="font-semibold text-slate-800">Juan Pérez</span>
            <span className="text-slate-500">Turno Mañana (08:00 - 16:00)</span>
          </div>
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
            JP
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* LEFT PANEL: Cliente y Comprobante */}
        <div className="w-72 flex flex-col gap-4 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-full">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Datos de Venta
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Cliente</label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="DNI / RUC" 
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    Buscar
                  </button>
                </div>
                <button className="w-full border border-dashed border-teal-300 text-teal-700 bg-teal-50 hover:bg-teal-100 py-2 rounded-lg text-sm font-medium transition-colors">
                  Usar Cliente Genérico
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Cliente Seleccionado:</span>
                <span className="font-medium text-slate-800 text-sm">PÚBLICO EN GENERAL</span>
                <span className="text-xs text-slate-500 block mt-1">DNI: 00000000</span>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-medium text-slate-500 mb-2">Tipo de Comprobante</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setComprobante("boleta")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors ${comprobante === "boleta" ? "bg-teal-50 border-teal-200 text-teal-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Receipt className="w-4 h-4" />
                    Boleta
                  </button>
                  <button 
                    onClick={() => setComprobante("factura")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors ${comprobante === "factura" ? "bg-teal-50 border-teal-200 text-teal-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <FileText className="w-4 h-4" />
                    Factura
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Buscador y Carrito */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex items-center gap-2 shrink-0">
            <div className="bg-teal-100 p-2 rounded-lg">
              <ScanLine className="w-5 h-5 text-teal-700" />
            </div>
            <input 
              type="text" 
              placeholder="Escanear código de barras o buscar por nombre / principio activo..." 
              className="flex-1 px-3 py-2 text-lg outline-none bg-transparent"
              autoFocus
            />
          </div>

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
                  {carrito.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{item.producto}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">{item.presentacion}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="number" defaultValue={item.cant} className="w-16 text-center border border-slate-300 rounded p-1 text-sm outline-none focus:border-teal-500" min="1" />
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">S/ {item.precio.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">S/ {item.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
              3 items en el carrito
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Resumen y Pago */}
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
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setMetodoPago("efectivo")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${metodoPago === "efectivo" ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <Banknote className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Efectivo</span>
                  </button>
                  <button 
                    onClick={() => setMetodoPago("tarjeta")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${metodoPago === "tarjeta" ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <CreditCard className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Tarjeta</span>
                  </button>
                  <button 
                    onClick={() => setMetodoPago("transferencia")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${metodoPago === "transferencia" ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <ArrowRightLeft className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Yape/Plin</span>
                  </button>
                  <button 
                    onClick={() => setMetodoPago("mixto")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${metodoPago === "mixto" ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <PlusCircle className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Mixto</span>
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

            <button className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
              <Receipt className="w-6 h-6" />
              GENERAR VENTA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

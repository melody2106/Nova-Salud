import { useState } from "react";
import { Search, Plus, Filter, AlertTriangle, X, Check, PackageOpen } from "lucide-react";

export function Inventory() {
  const [showModal, setShowModal] = useState(false);

  const productos = [
    { id: 1, nombre: "Paracetamol 500mg", principio: "Paracetamol", stock: 150, min: 50, vcto: "2025-10-15", estado: "Activo" },
    { id: 2, nombre: "Amoxicilina 500mg", principio: "Amoxicilina", stock: 20, min: 30, vcto: "2024-08-20", estado: "Activo" },
    { id: 3, nombre: "Ibuprofeno 400mg", principio: "Ibuprofeno", stock: 0, min: 20, vcto: "2025-01-10", estado: "Inactivo" },
    { id: 4, nombre: "Loratadina 10mg", principio: "Loratadina", stock: 80, min: 20, vcto: "2026-05-05", estado: "Activo" },
    { id: 5, nombre: "Aspirina 100mg", principio: "Ácido Acetilsalicílico", stock: 15, min: 50, vcto: "2024-11-30", estado: "Activo" },
  ];

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

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
        
        {/* Filters */}
        <div className="flex gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Buscar por nombre o principio activo..." 
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
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Stock Bajo (2)
            </div>
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Por Vencer (1)
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Comercial</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Principio Activo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stock Actual</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stock Mín.</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((p) => {
                  const isLowStock = p.stock <= p.min;
                  const isOutOfStock = p.stock === 0;
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{p.nombre}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.principio}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-bold ${
                          isOutOfStock ? "bg-red-100 text-red-700" : isLowStock ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {p.stock}
                          {isLowStock && !isOutOfStock && <AlertTriangle className="w-3 h-3 ml-1" />}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-500">{p.min}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.vcto}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          p.estado === "Activo" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          {p.estado === "Activo" && <Check className="w-3 h-3" />}
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-teal-600 hover:text-teal-800 font-medium text-sm">Editar</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Nuevo Producto */}
      {showModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <form className="space-y-8">
                
                {/* Info General */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">1. Información General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nombre Comercial *</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ej. Panadol Extra Fuerte" />
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Principio Activo</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ej. Paracetamol + Cafeína" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Código de Barras</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Escanear..." />
                    </div>
                  </div>
                </section>

                {/* Clasificación */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">2. Clasificación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Laboratorio</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white">
                        <option>Seleccione...</option>
                        <option>Bayer</option>
                        <option>GSK</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Categoría</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white">
                        <option>Seleccione...</option>
                        <option>Analgésicos</option>
                        <option>Antibióticos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Presentación</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white">
                        <option>Seleccione...</option>
                        <option>Tabletas</option>
                        <option>Jarabe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Vía de Admin.</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white">
                        <option>Seleccione...</option>
                        <option>Oral</option>
                        <option>Tópica</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Control de Stock */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">3. Control de Stock</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Stock Actual (Unidad Base)</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" defaultValue="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Stock Mínimo Alerta</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" defaultValue="10" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de Vencimiento (Lote actual)</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-700" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-amber-300 focus:ring-teal-500" />
                    <span className="text-sm font-medium text-amber-900">Este producto requiere receta médica para su venta</span>
                  </label>
                </section>

                {/* Precios Múltiples */}
                <section>
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">4. Precios Múltiples</h3>
                    <button type="button" className="text-teal-600 text-xs font-bold hover:text-teal-800 flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Agregar Presentación de Venta
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-slate-600">Unidad de Medida Venta</th>
                          <th className="px-4 py-2 font-semibold text-slate-600">Equivale a (Unidades base)</th>
                          <th className="px-4 py-2 font-semibold text-slate-600">Precio de Venta (S/)</th>
                          <th className="px-4 py-2 font-semibold text-slate-600"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="px-4 py-2">
                            <select className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white">
                              <option>Caja</option>
                              <option>Blister</option>
                              <option>Unidad</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" defaultValue="100" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" />
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" defaultValue="35.00" step="0.01" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">
                            <select className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white">
                              <option>Blister</option>
                              <option>Unidad</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" defaultValue="10" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" />
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" defaultValue="4.00" step="0.01" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Configura cómo se venderá el producto en el POS y sus equivalencias respecto al stock total.</p>
                </section>
                
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
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

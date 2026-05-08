import { useState } from "react";
import { Plus, ListTree, Tags, Box, Scale, Syringe, Briefcase, Settings2, Pencil, Trash2 } from "lucide-react";

export function Config() {
  const [activeTab, setActiveTab] = useState("laboratorios");
  const [showForm, setShowForm] = useState(false);

  const menuOptions = [
    { id: "laboratorios", label: "Laboratorios", icon: ListTree },
    { id: "categorias", label: "Categorías", icon: Tags },
    { id: "presentaciones", label: "Presentaciones", icon: Box },
    { id: "unidades", label: "Unidades de Medida", icon: Scale },
    { id: "vias", label: "Vías de Administración", icon: Syringe },
    { id: "cargos", label: "Cargos de Empleados", icon: Briefcase },
  ];

  const activeOption = menuOptions.find(o => o.id === activeTab) || menuOptions[0];

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
          <Settings2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Configuración de Catálogos</h1>
          <p className="text-sm text-slate-500">Gestión de listas maestras del sistema</p>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Menu */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          <nav className="p-4 space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">Tablas Generales</div>
            {menuOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = activeTab === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setActiveTab(opt.id);
                    setShowForm(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-teal-50 text-teal-700" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                  {opt.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
          <div className="max-w-4xl mx-auto">
            
            {/* Header del Catálogo Activo */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <activeOption.icon className="w-6 h-6 text-teal-600" />
                Catálogo: {activeOption.label}
              </h2>
              {!showForm && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Nuevo
                </button>
              )}
            </div>

            {/* Formulario Agregar/Editar (Oculto por defecto) */}
            {showForm && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-4 fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                  Registrar en {activeOption.label}
                </h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ej. Bayer" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white">
                        <option>Activo</option>
                        <option>Inactivo</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                      <textarea rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Opcional..."></textarea>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      Cancelar
                    </button>
                    <button type="button" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tabla de Registros */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-slate-600 w-16 text-center">ID</th>
                    <th className="px-5 py-3 font-semibold text-slate-600">Nombre</th>
                    <th className="px-5 py-3 font-semibold text-slate-600">Descripción</th>
                    <th className="px-5 py-3 font-semibold text-slate-600 text-center w-24">Estado</th>
                    <th className="px-5 py-3 font-semibold text-slate-600 text-right w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-center text-slate-500">1</td>
                    <td className="px-5 py-3 font-medium text-slate-800">Ejemplo de {activeOption.label} 1</td>
                    <td className="px-5 py-3 text-slate-500">Descripción de prueba para este registro.</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">Activo</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 text-slate-400 hover:text-teal-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button className="p-1 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-center text-slate-500">2</td>
                    <td className="px-5 py-3 font-medium text-slate-800">Ejemplo de {activeOption.label} 2</td>
                    <td className="px-5 py-3 text-slate-500">-</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">Inactivo</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 text-slate-400 hover:text-teal-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button className="p-1 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                Mostrando 2 registros
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

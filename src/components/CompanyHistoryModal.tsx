import React from 'react';
import { createPortal } from 'react-dom';
import { X, Award, ShieldCheck, History, Sparkles, Building2, Trees, Droplet, ArrowRight } from 'lucide-react';

interface CompanyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCatalog: () => void;
}

export const CompanyHistoryModal: React.FC<CompanyHistoryModalProps> = ({
  isOpen,
  onClose,
  onOpenCatalog,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
              75+
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight text-slate-900">Línea de Tiempo y Trayectoria</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Pintuco • AkzoNobel
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Más de 75 años transformando el país con innovación y calidad.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* Hero Statement */}
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Award className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Trayectoria e Historia Pintuco
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Más de 75 años transformando el país con innovación y calidad. Desde 1945 acompañando la infraestructura, maestros de obra y hogares colombianos con tecnología de punta.
              </p>
            </div>
          </div>

          {/* 7 Iconic Milestones */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-blue-900" />
              <span>Hitos Históricos de Nuestra Trayectoria</span>
            </h4>

            <div className="space-y-3">
              {[
                { year: '1945', title: 'Fundación en Medellín', text: 'Fundación de Pintuco en Medellín por Germán Saldarriaga del Valle. Nace Pinturas Colombianas S.A.' },
                { year: '1956', title: 'Lanzamiento de Viniltex', text: 'Lanzamiento de Viniltex y apertura del primer Centro del Color en Bogotá.' },
                { year: '1959', title: 'Aeropuerto Internacional El Dorado', text: 'Acabados del Aeropuerto Internacional El Dorado con esmaltes Pintulux.' },
                { year: '1992', title: 'Creación de Koraza', text: 'Creación de Koraza y apertura de la categoría de pinturas para exteriores.' },
                { year: '1997', title: 'Centro de Producción Rionegro', text: 'Inauguración del centro de producción en Rionegro, Antioquia.' },
                { year: '2019', title: 'Carbono Neutro y Líneas Eco', text: 'Certificación de Carbono Neutro y lanzamiento de líneas ecológicas (Eco / Greenguard Gold).' },
                { year: 'Presente', title: 'Integración a AkzoNobel', text: 'Integración al Grupo AkzoNobel, consolidando la máxima tecnología e innovación en pinturas a nivel global.' },
              ].map((m, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-black text-xs shrink-0 border border-teal-200">
                    {m.year}
                  </span>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{m.title}</h5>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Pintuco S.A. • Grupo AkzoNobel • Cobertura Nacional
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCatalog();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <span>Ver Catálogo de Productos</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};

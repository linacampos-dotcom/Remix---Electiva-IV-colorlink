import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Percent, 
  Calculator, 
  MessageCircle, 
  Sparkles, 
  Building2, 
  Info,
  ArrowRight,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';
import { openWhatsAppDirect, DEFAULT_WHATSAPP_PHONE, DEFAULT_WHATSAPP_MESSAGE } from '../utils/whatsappConfig';

interface BankInstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreCatalog?: () => void;
  currentCartTotal?: number;
}

interface AlliedBank {
  id: string;
  name: string;
  badgeColor: string;
  badgeTextColor: string;
  accentBg: string;
  accentBorder: string;
  franchises: string[];
  cuotas: number;
  minAmount: number;
  highlight: string;
  features: string[];
}

const ALLIED_BANKS: AlliedBank[] = [
  {
    id: 'bancolombia',
    name: 'Bancolombia',
    badgeColor: 'bg-[#FDDA24]',
    badgeTextColor: 'text-slate-950 font-black',
    accentBg: 'bg-white',
    accentBorder: 'border-slate-200 hover:border-amber-400',
    franchises: ['Visa', 'Mastercard', 'American Express'],
    cuotas: 3,
    minAmount: 150000,
    highlight: '3 cuotas con 0% de interés corriente automático',
    features: [
      'Aplica para tarjetas de crédito personales',
      'Diferido automático a 3 meses en el datáfono o pasarela',
      'Acumula Puntos Colombia por cada $1.000 COP'
    ]
  },
  {
    id: 'davivienda',
    name: 'Davivienda',
    badgeColor: 'bg-[#ED1C24]',
    badgeTextColor: 'text-white font-black',
    accentBg: 'bg-white',
    accentBorder: 'border-slate-200 hover:border-red-400',
    franchises: ['Visa', 'Mastercard', 'Diners Club'],
    cuotas: 3,
    minAmount: 150000,
    highlight: '3 cuotas al 0% E.A. en pinturas y recubrimientos',
    features: [
      'Beneficio directo en categoría Mejoramiento del Hogar',
      'Sin cobro de comisión de procesamiento financiero',
      'Válido para tarjetas clásicas, oro, platinum y black'
    ]
  },
  {
    id: 'banco-bogota',
    name: 'Banco de Bogotá (Grupo Aval)',
    badgeColor: 'bg-[#002A86]',
    badgeTextColor: 'text-white font-black',
    accentBg: 'bg-white',
    accentBorder: 'border-slate-200 hover:border-blue-400',
    franchises: ['Visa', 'Mastercard'],
    cuotas: 3,
    minAmount: 150000,
    highlight: '0% interés diferido a 3 cuotas mensuales',
    features: [
      'Aplica en compras presenciales y digitales COLORLINK',
      'Integrado con el programa de beneficios Aval Puntos',
      'Confirmación inmediata de la tasa 0% en extracto bancario'
    ]
  },
  {
    id: 'bbva',
    name: 'BBVA Colombia',
    badgeColor: 'bg-[#004481]',
    badgeTextColor: 'text-white font-black',
    accentBg: 'bg-white',
    accentBorder: 'border-slate-200 hover:border-sky-400',
    franchises: ['Visa', 'Mastercard'],
    cuotas: 3,
    minAmount: 150000,
    highlight: '3 cuotas sin interés en todo el catálogo Pintuco',
    features: [
      'Tasa de interés preferencial 0% diferido a 3 meses',
      'Válido para obras residenciales y proyectos comerciales',
      'Gestión y soporte desde la App BBVA Móvil'
    ]
  },
  {
    id: 'scotiabank',
    name: 'Scotiabank Colpatria',
    badgeColor: 'bg-[#ED0722]',
    badgeTextColor: 'text-white font-black',
    accentBg: 'bg-white',
    accentBorder: 'border-slate-200 hover:border-rose-400',
    franchises: ['Visa', 'Mastercard'],
    cuotas: 3,
    minAmount: 150000,
    highlight: '3 cuotas sin costo de financiación',
    features: [
      'Exención total de intereses al seleccionar 3 cuotas',
      'Cobertura nacional en compras directas y online',
      'Reconocimiento automático de la promoción en caja'
    ]
  },
  {
    id: 'occidente-popular',
    name: 'Banco de Occidente & Popular (Aval)',
    badgeColor: 'bg-[#0072CE]',
    badgeTextColor: 'text-white font-black',
    accentBg: 'bg-white',
    accentBorder: 'border-slate-200 hover:border-indigo-400',
    franchises: ['Visa', 'Mastercard'],
    cuotas: 3,
    minAmount: 150000,
    highlight: '0% de interés diferido a 3 cuotas exactas',
    features: [
      'Convenio especial para contratistas y maestros de obra',
      'Compatible con compras fraccionadas de cuñetes y galones',
      'Sin cobro de seguros adicionales por diferir a 3 cuotas'
    ]
  }
];

const MIN_FINANCING_AMOUNT = 150000;

export const BankInstallmentsModal: React.FC<BankInstallmentsModalProps> = ({
  isOpen,
  onClose,
  onExploreCatalog,
  currentCartTotal = 350000
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>('bancolombia');
  
  // Monto simulado en formato numérico
  const [simulatedAmount, setSimulatedAmount] = useState<number>(() => {
    return currentCartTotal && currentCartTotal > 0 ? currentCartTotal : 350000;
  });

  // Texto visible en el input con formato de miles COP
  const [inputDisplay, setInputDisplay] = useState<string>(() => {
    const initial = currentCartTotal && currentCartTotal > 0 ? currentCartTotal : 350000;
    return initial > 0 ? initial.toLocaleString('es-CO') : '';
  });

  // Sincronizar monto inicial al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const base = currentCartTotal && currentCartTotal > 0 ? currentCartTotal : 350000;
      setSimulatedAmount(base);
      setInputDisplay(base > 0 ? base.toLocaleString('es-CO') : '');
    }
  }, [isOpen, currentCartTotal]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedBank = ALLIED_BANKS.find(b => b.id === selectedBankId) || ALLIED_BANKS[0];
  
  // Validación estricta del monto mínimo de financiación ($150.000 COP)
  const isEligible = simulatedAmount >= MIN_FINANCING_AMOUNT;
  const missingAmount = Math.max(0, MIN_FINANCING_AMOUNT - simulatedAmount);
  const monthlyPayment = isEligible ? Math.round(simulatedAmount / 3) : 0;

  // Manejador del cambio de valor en el input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      setSimulatedAmount(0);
      setInputDisplay('');
      return;
    }
    const cleanNumber = parseInt(rawVal, 10);
    if (cleanNumber === 0) {
      setSimulatedAmount(0);
      setInputDisplay('');
      return;
    }
    setSimulatedAmount(cleanNumber);
    setInputDisplay(cleanNumber.toLocaleString('es-CO'));
  };

  // Al enfocar, limpiar si es 0 para evitar prefijos como "$ 0140000"
  const handleAmountFocus = () => {
    if (simulatedAmount === 0 || inputDisplay === '0') {
      setInputDisplay('');
    }
  };

  // Al perder el foco, formatear adecuadamente
  const handleAmountBlur = () => {
    if (simulatedAmount > 0) {
      setInputDisplay(simulatedAmount.toLocaleString('es-CO'));
    } else {
      setInputDisplay('');
    }
  };

  // Selección rápida de montos
  const handleQuickAmount = (amount: number) => {
    setSimulatedAmount(amount);
    setInputDisplay(amount.toLocaleString('es-CO'));
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-white text-slate-800 rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con estructura flex-col limpia y título 100% visible */}
        <div className="flex flex-col gap-2.5 p-5 sm:p-6 border-b border-slate-100 bg-white relative">
          {/* Badge superior */}
          <div className="flex flex-wrap items-center gap-2 pr-12">
            <span className="bg-teal-50 text-teal-800 text-xs px-2.5 py-1 rounded-full border border-teal-200 font-bold tracking-wide">
              0% INTERÉS CORRIENTE
            </span>
            <span className="text-xs text-slate-500 font-normal">Convenio Bancario Oficial Pintuco</span>
          </div>

          {/* Título principal visible */}
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug pr-12">
            3 Cuotas Sin Interés con Bancos Seleccionados
          </h2>

          {/* Subtítulo descriptivo */}
          <p className="text-xs sm:text-sm text-slate-600 font-normal pr-12">
            Financia tus pinturas y proyectos de obra sin costo financiero adicional
          </p>

          {/* Botón de cierre */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer z-30"
            title="Cerrar ventana (✕)"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Quick Summary Pill Banner */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-slate-900 text-xs sm:text-sm">
                  Tarjetas de Crédito Visa y Mastercard Habilitadas
                </span>
                <span className="text-slate-500 text-[11px]">
                  Válido para compras superiores a $150.000 COP en catálogo general
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-teal-200 text-teal-800 font-black text-xs shadow-2xs">
                3 Meses = $0 Interés
              </span>
            </div>
          </div>

          {/* Section: Bancos Aliados Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Bancos Aliados Oficiales en Colombia
              </h3>
              <span className="text-[11px] text-slate-500">
                Selecciona un banco para ver condiciones
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ALLIED_BANKS.map((bank) => {
                const isSelected = selectedBankId === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setSelectedBankId(bank.id)}
                    className={`text-left p-3.5 rounded-2xl transition-all border cursor-pointer relative ${
                      isSelected
                        ? 'bg-teal-50/60 border-teal-500 shadow-sm'
                        : `${bank.accentBg} border-slate-200 hover:border-slate-300`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase ${bank.badgeColor} ${bank.badgeTextColor}`}>
                        {bank.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      )}
                    </div>
                    
                    <span className="block text-xs font-bold text-slate-900 mb-1">
                      {bank.highlight}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500">
                      {bank.franchises.map((f) => (
                        <span key={f} className="px-1.5 py-0.2 bg-slate-100 rounded text-[9px] font-semibold text-slate-600 border border-slate-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Selected Bank Detail & Interactive Simulator */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700">Detalles del Convenio</span>
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>{selectedBank.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                    3 Cuotas / 0% E.A.
                  </span>
                </h4>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-500 block">Compra Mínima Requerida</span>
                <strong className="text-xs text-slate-900">${selectedBank.minAmount.toLocaleString('es-CO')} COP</strong>
              </div>
            </div>

            {/* Features list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {selectedBank.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Simulator Interactive Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-blue-900" />
                  Simulador de Pago en 3 Cuotas
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(150000)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      simulatedAmount === 150000 
                        ? 'bg-blue-900 text-white font-black' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    $150.000 (Mínimo)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(350000)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      simulatedAmount === 350000 
                        ? 'bg-blue-900 text-white font-black' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    $350.000 (1 Cuñete)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(1050000)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      simulatedAmount === 1050000 
                        ? 'bg-blue-900 text-white font-black' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    $1.050.000 (Obra)
                  </button>
                </div>
              </div>

              {/* Alerta estricta cuando el monto no cumple con el mínimo de financiación */}
              {!isEligible && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 animate-fadeIn">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5 border border-amber-300">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-black text-amber-900 text-xs sm:text-sm">
                      ⚠️ El beneficio de 3 cuotas a 0% interés aplica únicamente para compras mínimas de $150.000 COP.
                    </p>
                    <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                      {simulatedAmount > 0 ? (
                        <>
                          Actualmente ingresaste <span className="font-bold text-slate-900">${simulatedAmount.toLocaleString('es-CO')} COP</span>. 
                          Te faltan <strong className="text-amber-800 font-black underline decoration-amber-400/50">${missingAmount.toLocaleString('es-CO')} COP</strong> para acceder al beneficio de financiación al 0% de interés.
                        </>
                      ) : (
                        'Ingresa un monto igual o superior a $150.000 COP para activar el beneficio de 3 cuotas sin costo financiero.'
                      )}
                    </p>
                    {onExploreCatalog && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onExploreCatalog();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Completar valor con productos del catálogo</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grid de Entrada de Monto y Resultados */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                    <span>Monto total a financiar:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Mín. $150.000</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={inputDisplay}
                      placeholder="150.000"
                      onChange={handleAmountChange}
                      onFocus={handleAmountFocus}
                      onBlur={handleAmountBlur}
                      className={`w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 border text-xs font-black text-slate-900 focus:bg-white focus:outline-none transition-all ${
                        !isEligible && simulatedAmount > 0
                          ? 'border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                          : 'border-slate-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900'
                      }`}
                    />
                  </div>
                </div>

                {isEligible ? (
                  <>
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-center shadow-2xs">
                      <span className="block text-[10px] uppercase font-bold text-blue-800 tracking-wider">
                        3 Cuotas Mensuales de:
                      </span>
                      <strong className="block text-base sm:text-lg font-black text-blue-950 mt-0.5">
                        ${monthlyPayment.toLocaleString('es-CO')} COP
                      </strong>
                      <span className="text-[10px] text-teal-700 font-medium">Sin intereses corrientes</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-center shadow-2xs">
                      <span className="block text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                        Interés Corriente Cobrado:
                      </span>
                      <strong className="block text-base sm:text-lg font-black text-teal-800 mt-0.5">
                        $0 COP (0% E.A.)
                      </strong>
                      <span className="text-[10px] text-teal-700 font-medium">Ahorro total de financiación</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-center opacity-75">
                      <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        3 Cuotas a 0% Interés:
                      </span>
                      <strong className="block text-sm sm:text-base font-black text-slate-500 mt-0.5">
                        No elegible
                      </strong>
                      <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                        {simulatedAmount > 0 ? `Faltan $${missingAmount.toLocaleString('es-CO')}` : 'Mínimo $150.000 COP'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-center opacity-75">
                      <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Beneficio Financiero:
                      </span>
                      <strong className="block text-sm sm:text-base font-black text-slate-500 mt-0.5">
                        Deshabilitado
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        Aplica desde $150.000 COP
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section: Términos y Condiciones */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
              <Info className="w-3.5 h-3.5 text-blue-900" />
              <span>Condiciones Generales del Beneficio</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-600 leading-relaxed">
              <li>El beneficio de 0% de interés aplica exclusivamente al diferir el pago a <strong>exactamente 3 cuotas mensuales</strong> al momento de la compra.</li>
              <li>Aplica para compras presenciales en tiendas autorizadas Pintuco y en el portal web oficial COLORLINK con tarjetas de crédito emitidas en Colombia.</li>
              <li>Monto mínimo de compra: <strong>$150.000 COP</strong> (IVA incluido). No aplica para tarjetas débito ni crédito corporativas sin convenio expreso.</li>
              <li>Si el cliente difiere a un plazo diferente a 3 meses (ej. 4 o más cuotas), aplicará la tasa de interés corriente ordinaria establecida por su banco emisor.</li>
            </ul>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              openWhatsAppDirect(DEFAULT_WHATSAPP_PHONE, DEFAULT_WHATSAPP_MESSAGE);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-teal-600" />
            <span>Consultar por WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              Cerrar
            </button>
            {onExploreCatalog && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreCatalog();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-black transition-all shadow-sm cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explorar Catálogo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};

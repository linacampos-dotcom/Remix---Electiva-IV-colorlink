import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  HeadphonesIcon, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  Mail, 
  User, 
  FileText,
  Clock
} from 'lucide-react';
import { radicarConsultaWeb, TicketSAC, getTicketsSAC } from '../services/corporateService';

interface CustomerInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledSubject?: string;
}

export const CustomerInquiryModal: React.FC<CustomerInquiryModalProps> = ({
  isOpen,
  onClose,
  prefilledSubject = '',
}) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [asunto, setAsunto] = useState(prefilledSubject);
  const [categoria, setCategoria] = useState<TicketSAC['categoria']>('Asesoría Técnica Pinturas');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<TicketSAC | null>(null);

  // Cerrar y minimizar automáticamente el chat de IA al abrir este formulario PQRS
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('colorlink_close_ai_chat'));
    }
  }, [isOpen]);

  // Active tickets for this user from localStorage
  const [userEmailSearch, setUserEmailSearch] = useState('');
  const [matchingTickets, setMatchingTickets] = useState<TicketSAC[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !mensaje.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const ticket = radicarConsultaWeb({
        clienteNombre: nombre,
        clienteEmail: email,
        clienteTelefono: telefono,
        canal: 'Formulario PQR',
        asunto: asunto.trim() || 'Consulta técnica general',
        mensaje,
        categoria,
      });

      setSubmittedTicket(ticket);
      setIsSubmitting(false);
      setMensaje('');
    }, 400);
  };

  const handleSearchMyTickets = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmailSearch.trim()) return;
    const all = getTicketsSAC();
    const filtered = all.filter(t => 
      t.clienteEmail.toLowerCase().includes(userEmailSearch.trim().toLowerCase()) ||
      t.radicado.toLowerCase().includes(userEmailSearch.trim().toLowerCase())
    );
    setMatchingTickets(filtered);
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#001D3D] text-white p-5 sm:p-6 border-b border-blue-900/60 relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
                <HeadphonesIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-extrabold block">
                  Servicio al Cliente & Posventa Pintuco
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Radicar Consulta Técnica o PQR
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-sky-200/80 mt-2">
            Tu solicitud ingresará de inmediato a la bandeja oficial de los agentes en el Portal de Funcionarios de ColorLink.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {submittedTicket ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                ¡Consulta Radicada Exitosamente!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Hemos asignado el número de radicado oficial <strong className="text-emerald-800 font-mono text-sm">{submittedTicket.radicado}</strong> a tu solicitud. Nuestro equipo técnico responderá en un plazo máximo de 8 horas hábiles.
              </p>

              <div className="p-4 rounded-xl bg-white border border-emerald-200 text-left text-xs space-y-1.5 max-w-md mx-auto">
                <div className="flex justify-between text-slate-500">
                  <span>Radicado:</span>
                  <strong className="text-slate-900 font-mono">{submittedTicket.radicado}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Categoría:</span>
                  <strong className="text-slate-900">{submittedTicket.categoria}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estado actual:</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px]">
                    {submittedTicket.estado}
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Radicar otra consulta
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Entendido, cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre o Razón Social *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Ing. Diana Restrepo"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@constructora.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono de Contacto (opcional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+57 310 000 0000"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Requerimiento *
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as TicketSAC['categoria'])}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-semibold text-slate-800"
                  >
                    <option value="Asesoría Técnica Pinturas">Asesoría Técnica Pinturas</option>
                    <option value="Cotización B2B / Obra">Cotización B2B / Proyectos de Obra</option>
                    <option value="Certificación NTC 1335">Certificación NTC 1335 / ICONTEC</option>
                    <option value="Seguimiento Despacho">Seguimiento a Despacho / Guía</option>
                    <option value="Garantía / Reclamación">Garantía / Reclamación de Producto</option>
                    <option value="Información General">Información General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Asunto del Requerimiento
                </label>
                <input
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Ej. Rendimiento de Viniltex en revoque nuevo"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción Detallada *
                </label>
                <textarea
                  required
                  rows={4}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Describe las características de tu superficie, metros cuadrados, ubicación o número de pedido..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none"
                />
              </div>

              {/* Cumplimiento Normativo Habeas Data - Ley Estatutaria 1581 de 2012 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Conformidad Habeas Data (Ley 1581 de 2012):</strong> Al enviar este formulario oficial de PQRS, autorizas a Pintuco S.A. el tratamiento de tus datos personales exclusivamente para la atención, respuesta técnica y trazabilidad de tu requerimiento.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Atención respaldada por Pintuco Oficial
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting || !nombre.trim() || !email.trim() || !mensaje.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Radicando...' : 'Radicar Consulta Oficial'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Consultation Tracker for Customers */}
          <div className="pt-4 border-t border-slate-200">
            <details className="group">
              <summary className="text-xs font-bold text-slate-600 hover:text-blue-900 cursor-pointer list-none flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-600" />
                  ¿Ya radicaste una consulta? Consulta el estado de tu caso
                </span>
                <span className="text-[11px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>

              <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <form onSubmit={handleSearchMyTickets} className="flex gap-2">
                  <input
                    type="text"
                    value={userEmailSearch}
                    onChange={(e) => setUserEmailSearch(e.target.value)}
                    placeholder="Ingresa tu correo o número de radicado (ej. CLK-SAC-2026-081)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Consultar
                  </button>
                </form>

                {matchingTickets.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {matchingTickets.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-blue-950 font-mono">{t.radicado}</strong>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold">
                            {t.estado}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 truncate">{t.asunto}</p>
                        <p className="text-[11px] text-slate-500">Última actualización: {t.fechaUltimaActividad}</p>
                        {t.mensajes.length > 1 && (
                          <div className="mt-2 p-2 rounded-lg bg-emerald-50 text-[11px] text-emerald-900 border border-emerald-100">
                            <strong>Respuesta del asesor:</strong> {t.mensajes[t.mensajes.length - 1].texto}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>

      </div>
    </div>
  );
};

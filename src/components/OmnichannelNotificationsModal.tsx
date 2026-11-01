import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLORLINKOrder, OmniNotificationEvent } from '../types';
import { 
  X, 
  MessageSquare, 
  Mail, 
  PhoneCall, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Building2, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Smartphone,
  ExternalLink,
  Bot
} from 'lucide-react';

interface OmnichannelNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: COLORLINKOrder | null;
  onStatusNotified?: (newStatus: COLORLINKOrder['estado']) => void;
}

export const OmnichannelNotificationsModal: React.FC<OmnichannelNotificationsModalProps> = ({
  isOpen,
  onClose,
  order,
  onStatusNotified,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'email' | 'voice_ai'>('sms');
  const [targetStatus, setTargetStatus] = useState<'Recibido' | 'En Bodega' | 'En Camino' | 'Entregado'>('En Camino');
  
  // Voice AI simulation state
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callTranscriptActive, setCallTranscriptActive] = useState<boolean>(false);
  const [isSpeakingWebSpeech, setIsSpeakingWebSpeech] = useState<boolean>(false);
  const [hasSentNotice, setHasSentNotice] = useState<boolean>(false);

  // Default mock order if not provided
  const activeOrderNum = order?.numeroOrden || 'ORD-2026-BOG-0842';
  const clientName = order?.form.nombre_razon_social || 'Constructora Bolívar S.A.';
  const clientPhone = order?.form.responsable_contacto || '+57 310 450 8890';
  const clientCity = order?.form.ciudad || 'Bogotá D.C.';
  const productName = order?.calculo.productoNombre || 'Koraza Doble Vida Protección Clima Extremo';
  const cuñetesCount = order?.calculo.cunetes_5gal || 14;
  const deliveryAddress = 'Obra Torres del Bosque, Calle 140 # 19-30, ' + clientCity;
  const transportCarrier = 'Flota Propia Pintuco (Placa WLL-420 • Camión con Plataforma Hidráulica)';
  const trackingCode = order?.guiaDespacho || 'GUIA-PTC-99214';

  useEffect(() => {
    let timer: any = null;
    if (isCalling) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  if (!isOpen) return null;

  const getStatusHeadline = (st: string) => {
    switch (st) {
      case 'Recibido':
        return 'Tu orden ha sido radicada y validada técnicamente';
      case 'En Bodega':
        return 'Tu pedido está en proceso de ensamble y tinturado';
      case 'En Camino':
        return 'Tu pedido ha salido del CEDI y va en ruta hacia la obra';
      case 'Entregado':
        return 'Tu pedido ha sido entregado a satisfacción en obra';
      default:
        return 'Actualización del estado de tu pedido';
    }
  };

  const smsText = `PINTUCO INFORMA: Estimado cliente de ${clientName}, su pedido No. ${activeOrderNum} (${cuñetesCount} cuñetes) ha cambiado de estado a: [${targetStatus.toUpperCase()}]. Destino: ${clientCity}. Rastreo en vivo: https://colorlink.pintuco.com/track/${activeOrderNum}`;

  const voiceScript = `Hola, estimado cliente de Pintuco Colombia. Le informamos que su pedido número ${activeOrderNum} con destino a la obra en ${clientCity} ha cambiado de estado a: ${targetStatus}. Nuestro equipo logístico garantiza el cumplimiento estricto de la norma técnica NTC 1335. Su pedido incluye ${cuñetesCount} cuñetes de ${productName}. Puede verificar la ubicación del camión en tiempo real desde la plataforma COLORLINK. Si tiene alguna inquietud en obra, comuníquese con su asesor técnico comercial. ¡Gracias por construir el futuro con Pintuco!`;

  const handleStartVoiceCall = () => {
    setIsCalling(true);
    setCallTranscriptActive(true);

    // Use Web Speech API if supported
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voiceScript);
      utterance.lang = 'es-CO';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onstart = () => setIsSpeakingWebSpeech(true);
      utterance.onend = () => {
        setIsSpeakingWebSpeech(false);
      };
      utterance.onerror = () => setIsSpeakingWebSpeech(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEndVoiceCall = () => {
    setIsCalling(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingWebSpeech(false);
  };

  const handleTriggerDispatch = () => {
    if (onStatusNotified) {
      const mappedStatus = 
        targetStatus === 'Recibido' ? 'Cotizado' :
        targetStatus === 'En Bodega' ? 'En Producción' :
        targetStatus === 'En Camino' ? 'Despachado' : 'Entregado';
      onStatusNotified(mappedStatus as any);
    }
    setHasSentNotice(true);
    setTimeout(() => {
      setHasSentNotice(false);
    }, 3000);
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-6 bg-gradient-to-r from-[#0033A0] via-[#002270] to-[#0A1128] text-white flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E31C23] text-white flex items-center justify-center font-bold shadow-lg shadow-red-600/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                  Omni-Canal Pintuco
                </span>
                <span className="text-xs text-blue-200 font-mono">Orden: {activeOrderNum}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                Flujo de Notificaciones & Asistente de Voz IA
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white bg-blue-950/60 hover:bg-blue-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State Selector Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Cambiar Estado a:</span>
            <div className="inline-flex rounded-xl bg-slate-200/80 p-1 gap-1">
              {(['Recibido', 'En Bodega', 'En Camino', 'Entregado'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTargetStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    targetStatus === st
                      ? 'bg-[#0033A0] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleTriggerDispatch}
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{hasSentNotice ? '¡Notificación Emitida!' : 'Disparar Notificación Omni-Canal'}</span>
          </button>
        </div>

        {/* Channel Tab Selector */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setSelectedChannel('sms')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedChannel === 'sms'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>SMS Corporativo</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedChannel('email')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedChannel === 'email'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Mail className="w-4 h-4 text-[#0033A0]" />
            <span>Correo HTML Institucional</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedChannel('voice_ai')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedChannel === 'voice_ai'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-red-600" />
            <span className="flex items-center gap-1">
              <span>Llamada de Voz IA</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">

          {/* ===============================================================
              CHANNEL 1: SMS CORPORATIVO PINTUCO
          =============================================================== */}
          {selectedChannel === 'sms' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Smartphone Preview Mockup */}
              <div className="md:col-span-6 flex justify-center">
                <div className="w-full max-w-xs bg-slate-900 rounded-[38px] p-3.5 shadow-2xl border-4 border-slate-800 relative">
                  
                  {/* Speaker Notch */}
                  <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <div className="w-8 h-1 bg-slate-700 rounded-full" />
                  </div>

                  {/* Phone Screen */}
                  <div className="bg-slate-100 rounded-[28px] overflow-hidden p-4 space-y-4 min-h-[380px] flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-2">
                        <span className="font-mono font-bold text-slate-800">PINTUCO-INFO</span>
                        <span>Hoy, 10:45 AM</span>
                      </div>

                      {/* SMS Chat Bubble */}
                      <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-xs border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-2">
                        <p>{smsText}</p>
                        <span className="text-[9px] font-mono text-slate-400 block text-right">
                          Entregado por Claro/Tigo • NTC 1335
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center text-[10px] text-slate-400">
                      Responde AYUDA para soporte técnico en obra
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details on Right */}
              <div className="md:col-span-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                    Gateway SMS Transaccional A2P
                  </span>
                  <h4 className="text-xl font-black text-slate-900">
                    Plantilla SMS Automática
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Disparo inmediato al cambiar de fase en bodega o ruta. Tasa de apertura superior al 98% en contratistas e inspectores de obra en campo.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Destinatario:</span>
                    <span className="font-bold text-slate-900">{clientPhone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Longitud de Caracteres:</span>
                    <span className="font-mono font-bold text-slate-900">{smsText.length} / 160 (1 segmento)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Operador / Ruta:</span>
                    <span className="font-bold text-emerald-700">Ruta Prioritaria Nivel 1</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <span className="font-bold block">Enlace Dinámico de Rastreo:</span>
                  <span className="font-mono text-[11px] text-blue-700 break-all">
                    https://colorlink.pintuco.com/track/{activeOrderNum}
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ===============================================================
              CHANNEL 2: CORREO ELECTRÓNICO HTML INSTITUCIONAL PINTUCO
          =============================================================== */}
          {selectedChannel === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0033A0] uppercase tracking-wider block">
                    Template HTML Responsive
                  </span>
                  <h4 className="text-xl font-black text-slate-900">
                    Previsualización del Correo Electrónico Corporativo
                  </h4>
                </div>
                <span className="text-xs text-slate-400 font-mono">Destino: compras@constructorabolivar.com</span>
              </div>

              {/* Rendered HTML Email Box */}
              <div className="w-full bg-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-200">
                <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden text-slate-800">
                  
                  {/* Email Header */}
                  <div className="bg-[#0033A0] text-white p-6 border-b-4 border-[#E31C23]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#E31C23] text-white flex items-center justify-center font-black text-sm">
                          P
                        </div>
                        <span className="font-black tracking-wider text-lg">PINTUCO</span>
                      </div>
                      <span className="text-xs text-blue-200 font-mono">COLORLINK B2B</span>
                    </div>
                    <h2 className="text-lg font-black text-white mt-4">
                      {getStatusHeadline(targetStatus)}
                    </h2>
                  </div>

                  {/* Email Body */}
                  <div className="p-6 space-y-5 text-xs">
                    <p className="text-slate-600 leading-relaxed">
                      Estimado <strong>{clientName}</strong>,
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Te confirmamos que tu orden de recubrimientos arquitectónicos con referencia <strong>#{activeOrderNum}</strong> ha sido actualizada a la fase de: <span className="font-bold text-[#0033A0] uppercase">[{targetStatus}]</span>.
                    </p>

                    {/* Order Details Table */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                        <span>Resumen Técnico del Pedido</span>
                        <span className="font-mono text-[#0033A0]">Guía: {trackingCode}</span>
                      </div>
                      <div className="p-4 space-y-2 text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Producto:</span>
                          <span className="font-bold text-slate-900">{productName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cantidad Solicitada:</span>
                          <span className="font-bold text-slate-900">{cuñetesCount} Cuñetes (5 Gal)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dirección de Entrega:</span>
                          <span className="font-bold text-slate-900">{deliveryAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Transportadora:</span>
                          <span className="font-bold text-emerald-700">{transportCarrier}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tracking CTA Button */}
                    <div className="text-center pt-2">
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="inline-block py-3 px-6 rounded-xl bg-[#E31C23] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-red-700 transition-colors"
                      >
                        Rastrear Mi Camión en Vivo
                      </a>
                    </div>
                  </div>

                  {/* Email Footer */}
                  <div className="bg-slate-50 p-4 border-t border-slate-200 text-[10px] text-slate-400 text-center space-y-1">
                    <p>Pintuco Colombia S.A. • NIT 890.900.120-1 • Certificación de Calidad NTC 1335 e ISO 9001</p>
                    <p>Para soporte en obra comunícate con la línea nacional 018000 111 247 o tu asesor asignado.</p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              CHANNEL 3: LLAMADA DE VOZ IA AUTOMATIZADA (VOICE CALL SIMULATOR)
          =============================================================== */}
          {selectedChannel === 'voice_ai' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Smartphone Incoming Call Simulator */}
              <div className="md:col-span-6 flex justify-center">
                <div className="w-full max-w-xs bg-slate-950 rounded-[38px] p-4 shadow-2xl border-4 border-slate-800 text-white relative">
                  
                  {/* Speaker Notch */}
                  <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <div className="w-8 h-1 bg-slate-700 rounded-full" />
                  </div>

                  <div className="text-center space-y-3 py-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0033A0] to-[#E31C23] mx-auto flex items-center justify-center shadow-xl ring-4 ring-white/10">
                      <Bot className="w-10 h-10 text-white" />
                    </div>

                    <div>
                      <h4 className="text-base font-black text-white">
                        Pintuco Voz IA
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        +57 (601) 325 5000 • Despachos
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        isCalling ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isCalling ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>En llamada • {String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')}</span>
                          </>
                        ) : (
                          <span>Listo para emitir llamada</span>
                        )}
                      </span>
                    </div>

                    {/* Animated Audio Equalizer Bars when calling */}
                    {isCalling && (
                      <div className="flex items-center justify-center gap-1.5 py-4 h-12">
                        <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-8" />
                        <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-12 delay-100" />
                        <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-6 delay-200" />
                        <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-10 delay-75" />
                        <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-4 delay-150" />
                      </div>
                    )}
                  </div>

                  {/* Call Controls */}
                  <div className="pt-6 pb-2 flex items-center justify-around">
                    {!isCalling ? (
                      <button
                        type="button"
                        onClick={handleStartVoiceCall}
                        className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 transition-transform hover:scale-110 active:scale-95"
                        title="Iniciar llamada de voz automatizada"
                      >
                        <PhoneCall className="w-7 h-7" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEndVoiceCall}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transition-transform hover:scale-110 active:scale-95"
                        title="Finalizar llamada"
                      >
                        <VolumeX className="w-7 h-7" />
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 text-center pb-2">
                    {isCalling ? 'Presiona el botón rojo para colgar' : 'Presiona para escuchar la voz del sintetizador'}
                  </p>
                </div>
              </div>

              {/* Live Transcript & Voice Model Specs */}
              <div className="md:col-span-6 space-y-4">
                <div>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">
                    Agente Conversacional Telefónico
                  </span>
                  <h4 className="text-xl font-black text-slate-900">
                    Transcripción de Voz en Tiempo Real
                  </h4>
                  <p className="text-xs text-slate-500">
                    Llama de forma autónoma al encargado de obra para notificar cambios de estado críticos y confirmar presencia de personal para descarga de cuñetes.
                  </p>
                </div>

                {/* Speech Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#0033A0]" />
                      Guión Automatizado (Voz en Español Colombia):
                    </span>
                    {isSpeakingWebSpeech && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-pulse">
                        Reproduciendo Audio...
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                    "{voiceScript}"
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0033A0]" />
                    <span className="font-bold">Protocolo de Notificación de Obra Pintuco:</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Si el contratista no responde, el sistema reintenta a los 10 minutos y conmuta automáticamente con el SMS de respaldo.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Sistema Omni-Canal sincronizado con el CEDI Central y flota de reparto.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors shadow-xs"
          >
            Cerrar Módulo
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

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Mail, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  Key, 
  Server, 
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { authOtpService, EmailStatusResult } from '../services/authOtpService';

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export const EmailConfigModal: React.FC<EmailConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [tab, setTab] = useState<'status' | 'smtp' | 'inbox'>('status');
  const [status, setStatus] = useState<EmailStatusResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Buzón virtual
  const [recentEmails, setRecentEmails] = useState<Array<{
    id: string;
    to: string;
    subject: string;
    previewText: string;
    sentAt: string;
    otp?: string;
    provider: string;
    isRealDelivery: boolean;
  }>>([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  // Campos de formulario SMTP
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('linajazmincamposaboya@gmail.com');
  const [smtpPass, setSmtpPass] = useState('wotpozgudrnruxmk');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [emailFrom, setEmailFrom] = useState('linajazmincamposaboya@gmail.com');

  // Prueba de correo
  const [testEmailAddress, setTestEmailAddress] = useState('linajazmincamposaboya@gmail.com');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      loadRecentEmails();
      setFeedbackMsg(null);
    }
  }, [isOpen]);

  const loadRecentEmails = async () => {
    setIsLoadingInbox(true);
    const emails = await authOtpService.getRecentEmails();
    setRecentEmails(emails);
    setIsLoadingInbox(false);
  };

  const loadStatus = async () => {
    setIsLoading(true);
    const res = await authOtpService.getEmailStatus();
    setStatus(res);
    setIsLoading(false);
    if (!res.isConfigured && tab === 'status') {
      setTab('smtp');
    }
  };

  if (!isOpen) return null;

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    setIsLoading(true);

    const res = await authOtpService.configureEmail({
      provider: 'smtp',
      smtpHost: smtpHost.trim(),
      smtpPort: Number(smtpPort),
      smtpUser: smtpUser.trim(),
      smtpPass: smtpPass.trim().replace(/\s+/g, ''),
      smtpSecure,
      emailFrom: emailFrom.trim() || undefined,
    });

    setIsLoading(false);

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: '¡Conexión SMTP verificada y activada con éxito!' });
      await loadStatus();
      setTab('status');
      if (onConfigUpdated) onConfigUpdated();
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Fallo de autenticación o conexión SMTP.' });
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      setFeedbackMsg({ type: 'error', text: 'Ingresa un correo electrónico de prueba válido.' });
      return;
    }

    setFeedbackMsg(null);
    setIsTesting(true);

    const res = await authOtpService.testEmail(testEmailAddress);
    setIsTesting(false);

    if (res.success) {
      setFeedbackMsg({ 
        type: 'success', 
        text: `✓ Correo de prueba entregado con éxito a ${testEmailAddress} vía ${res.provider}. Revisa tu bandeja de entrada o spam.` 
      });
    } else {
      setFeedbackMsg({ 
        type: 'error', 
        text: `Error en envío de prueba: ${res.error}` 
      });
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col relative max-h-[92vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-900 via-[#003366] to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black tracking-wide text-base text-white flex items-center gap-2">
                <span>Configuración de Correo Transaccional</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400 text-blue-950 uppercase">
                  Pintuco Oficial
                </span>
              </h3>
              <p className="text-xs text-blue-100">
                Garantiza la entrega real de códigos OTP a las bandejas de entrada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('status')}
            className={`py-2 px-3 rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'status' 
                ? 'bg-white border-t-2 border-blue-900 text-blue-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Estado y Diagnóstico</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('smtp')}
            className={`py-2 px-3 rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'smtp' 
                ? 'bg-white border-t-2 border-blue-900 text-blue-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Servidor SMTP / Gmail</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('inbox');
              loadRecentEmails();
            }}
            className={`py-2 px-3 rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'inbox' 
                ? 'bg-white border-t-2 border-blue-900 text-blue-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Buzón de Salida</span>
            {recentEmails.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-900 font-extrabold">
                {recentEmails.length}
              </span>
            )}
          </button>
        </div>

        {/* Mensajes de Feedback */}
        {feedbackMsg && (
          <div className="p-4 pb-0">
            <div className={`p-3 rounded-2xl flex items-start gap-2.5 text-xs ${
              feedbackMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="font-semibold">{feedbackMsg.text}</span>
            </div>
          </div>
        )}

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: ESTADO Y DIAGNÓSTICO */}
          {tab === 'status' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                status?.isConfigured 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                {status?.isConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {status?.isConfigured 
                      ? `Servicio de Correo Activo (${status.activeProvider.toUpperCase()})` 
                      : 'Servicio de Correo No Configurado'}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed text-slate-700">
                    {status?.isConfigured 
                      ? 'Los correos de autenticación, verificación y recuperación de contraseña se envían a buzones reales.' 
                      : 'Sin credenciales configuradas, los correos NO se pueden entregar a bandejas de entrada reales (Gmail, Outlook, etc.). Por favor configura el transporte SMTP de Brevo en la pestaña correspondiente.'}
                  </p>
                </div>
              </div>

              {/* Prueba de Envío Real */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-900" />
                  <span>Probar Entrega Real a tu Correo</span>
                </h5>
                <p className="text-xs text-slate-600">
                  Envía un correo de certificación para comprobar que tu proveedor entrega correctamente:
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="tucorreo@gmail.com"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isTesting || !status?.isConfigured}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isTesting ? 'Enviando...' : 'Probar Envío'}</span>
                  </button>
                </div>
              </div>

              {/* Botón para cambiar a configuración */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setTab('smtp')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Configurar Credenciales SMTP →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SERVIDOR SMTP */}
          {tab === 'smtp' && (
            <form onSubmit={handleSaveSmtp} className="space-y-4">
              {/* Presets rápidos */}
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Configuración Rápida:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSmtpHost('smtp.gmail.com');
                    setSmtpPort(587);
                    setSmtpUser('linajazmincamposaboya@gmail.com');
                    setEmailFrom('linajazmincamposaboya@gmail.com');
                    setSmtpPass('tkybhhpzhmwcfcvh');
                    setSmtpSecure(false);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  ✉️ Gmail SMTP (linajazmincamposaboya@gmail.com)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSmtpHost('smtp-relay.brevo.com');
                    setSmtpPort(587);
                    setSmtpUser('bd9d5f001@smtp-brevo.com');
                    setEmailFrom('linajazmincamposaboya@gmail.com');
                    setSmtpSecure(false);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  ⚡ Brevo SMTP Relay
                </button>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 leading-relaxed space-y-1.5">
                <div className="font-bold flex items-center justify-between text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span>Validación Gmail SMTP (Contraseña de Aplicación de 16 caracteres):</span>
                  </span>
                  <a 
                    href="https://myaccount.google.com/apppasswords" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:underline font-bold"
                  >
                    <span>Generar en Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p>
                  En el campo <strong>Contraseña</strong> debes ingresar la contraseña de aplicación de 16 caracteres creada para tu cuenta <strong>linajazmincamposaboya@gmail.com</strong> (con Verificación en 2 pasos activa en Google).
                </p>
                <div className="p-2.5 bg-white rounded-xl border border-blue-100 text-[11px] text-slate-700 space-y-1">
                  <strong>Configuración idéntica para el Panel de Supabase (Authentication &gt; Settings &gt; SMTP):</strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    <li><strong>Sender email:</strong> linajazmincamposaboya@gmail.com</li>
                    <li><strong>Sender name:</strong> COLORLINK Pintuco</li>
                    <li><strong>Host:</strong> smtp.gmail.com • <strong>Port:</strong> 587</li>
                    <li><strong>Username:</strong> linajazmincamposaboya@gmail.com</li>
                    <li><strong>Password:</strong> Contraseña de aplicación de 16 letras (ej. tkybhhpzhmwcfcvh)</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Servidor SMTP (Host)
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Puerto
                  </label>
                  <input
                    type="number"
                    required
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="465"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Usuario / Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="tu-correo@gmail.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contraseña de Aplicación (16 dígitos en Gmail)
                </label>
                <input
                  type="password"
                  required
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 bg-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtpSecureCheck"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  className="rounded text-blue-900 focus:ring-blue-900"
                />
                <label htmlFor="smtpSecureCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Usar SSL/TLS Seguro (Recomendado para puerto 465)
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !smtpHost || !smtpUser || !smtpPass}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Verificar Conexión y Guardar SMTP</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: BUZÓN VIRTUAL DE SALIDA */}
          {tab === 'inbox' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Buzón de Mensajes Transaccionales</h4>
                  <p className="text-xs text-slate-500">
                    Historial de códigos OTP, verificaciones y recibos emitidos por el servidor
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadRecentEmails}
                  disabled={isLoadingInbox}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInbox ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>

              {recentEmails.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Mail className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-medium">No hay mensajes transaccionales registrados en esta sesión.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cuando solicites un código OTP en login o registro, aparecerá aquí inmediatamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {recentEmails.map((mail) => (
                    <div
                      key={mail.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{mail.to}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              mail.isRealDelivery 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {mail.isRealDelivery ? '✓ Entregado SMTP' : 'Buzón Seguro'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">{mail.subject}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {new Date(mail.sentAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      {mail.otp && (
                        <div className="bg-white border border-blue-200 rounded-xl p-2.5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">Código de Seguridad (OTP):</span>
                          <span className="font-mono text-base font-black tracking-widest text-blue-900 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                            {mail.otp}
                          </span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {mail.previewText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

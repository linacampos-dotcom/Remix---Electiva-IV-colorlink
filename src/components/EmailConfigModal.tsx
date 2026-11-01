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
  const [tab, setTab] = useState<'status' | 'smtp'>('status');
  const [status, setStatus] = useState<EmailStatusResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Campos de formulario SMTP Brevo
  const [smtpHost, setSmtpHost] = useState('smtp-relay.brevo.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('bd9d5f001@smtp-brevo.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [emailFrom, setEmailFrom] = useState('Linajazmincampossaboya@gmail.com');

  // Prueba de correo
  const [testEmailAddress, setTestEmailAddress] = useState('linajazmincampossaboya@gmail.com');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setFeedbackMsg(null);
    }
  }, [isOpen]);

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
      smtpPass: smtpPass.trim(),
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
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('status')}
            className={`py-2 px-3 rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
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
            className={`py-2 px-3 rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'smtp' 
                ? 'bg-white border-t-2 border-blue-900 text-blue-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Transporte Brevo SMTP</span>
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

          {/* TAB 2: BREVO SMTP */}
          {tab === 'smtp' && (
            <form onSubmit={handleSaveSmtp} className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-900 leading-relaxed">
                <strong>Transporte SMTP Brevo:</strong> El sistema utiliza el servidor SMTP de Brevo para enviar los correos de verificación OTP a cualquier dirección de correo introducida por los usuarios.
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
        </div>
      </div>
    </div>,
    document.body
  );
};

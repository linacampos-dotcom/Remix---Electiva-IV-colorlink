import React, { useState, useRef } from 'react';
import {
  Star,
  X,
  Truck,
  HeadphonesIcon,
  Award,
  Camera,
  CheckCircle2,
  Trash2,
  Sparkles,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { COLORLINKOrder, UserSession } from '../types';
import {
  DeliveryPunctualityOption,
  OrderSatisfactionReview,
  submitSatisfactionReview,
} from '../services/reviewsService';

interface OrderSatisfactionSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: COLORLINKOrder | null;
  userSession: UserSession | null;
  onSubmitted?: (review: OrderSatisfactionReview) => void;
  onShowToast?: (msg: string) => void;
}

const PUNCTUALITY_OPTIONS: {
  value: DeliveryPunctualityOption;
  label: string;
  tone: string;
}[] = [
  {
    value: 'Antes de lo esperado',
    label: 'Antes de lo esperado',
    tone: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
  {
    value: 'A tiempo',
    label: 'A tiempo',
    tone: 'border-blue-300 bg-blue-50 text-blue-900',
  },
  {
    value: 'Con retraso',
    label: 'Con retraso',
    tone: 'border-amber-300 bg-amber-50 text-amber-900',
  },
];

async function compressSurveyImage(dataUrl: string): Promise<string> {
  if (dataUrl.length <= 350_000) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 960;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const StarRatingRow: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
}> = ({ title, subtitle, icon, value, onChange }) => {
  const [hoverVal, setHoverVal] = useState<number>(0);
  const displayVal = hoverVal || value;
  const labels = ['', 'Muy deficiente', 'Por mejorar', 'Aceptable', 'Muy bueno', 'Excelente'];

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
            {icon}
          </div>
          <div>
            <h5 className="text-xs font-extrabold text-slate-900">{title}</h5>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className="text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
          {value} / 5 {labels[value] ? `• ${labels[value]}` : ''}
        </span>
      </div>

      <div className="flex items-center gap-1.5 pt-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= displayVal;
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverVal(star)}
              onMouseLeave={() => setHoverVal(0)}
              onClick={() => onChange(star)}
              aria-label={`${title}: ${star} de 5 estrellas`}
              className="p-1 rounded-lg hover:bg-amber-50 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  active ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const OrderSatisfactionSurveyModal: React.FC<OrderSatisfactionSurveyModalProps> = ({
  isOpen,
  onClose,
  order,
  userSession,
  onSubmitted,
  onShowToast,
}) => {
  const [ratingAtencion, setRatingAtencion] = useState<number>(5);
  const [ratingTiempoEntrega, setRatingTiempoEntrega] = useState<number>(5);
  const [puntualidadEntrega, setPuntualidadEntrega] =
    useState<DeliveryPunctualityOption>('A tiempo');
  const [ratingCalidadProducto, setRatingCalidadProducto] = useState<number>(5);
  const [comentario, setComentario] = useState('');
  const [fotoBase64, setFotoBase64] = useState<string | undefined>(undefined);
  const [autorizaPublicidad, setAutorizaPublicidad] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !order) return null;

  const orderNum = order.numeroOrden || order.id;
  const itemsSummary = Array.isArray(order.items) && order.items.length > 0
    ? order.items.map((it) => it.nombre).slice(0, 3).join(' • ')
    : 'Pedido Pintuco / ColorLink';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onShowToast?.('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const optimized = await compressSurveyImage(reader.result);
        setFotoBase64(optimized);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const saved = await submitSatisfactionReview({
        orderId: order.id || orderNum,
        numeroOrden: orderNum,
        clienteNombre: order.customerName || userSession?.nombre || 'Cliente ColorLink',
        clienteEmail: order.customerEmail || userSession?.email || '',
        ciudadEntrega: order.ciudadEntrega || userSession?.ciudad || 'Colombia',
        productosResumen: itemsSummary,
        ratingAtencion,
        ratingTiempoEntrega,
        puntualidadEntrega,
        ratingCalidadProducto,
        comentario: comentario.trim(),
        fotoBase64,
        autorizaPublicidad,
      });
      onSubmitted?.(saved);
      onShowToast?.(`⭐ ¡Gracias! Tu calificación para la orden ${orderNum} fue registrada.`);
      setComentario('');
      setFotoBase64(undefined);
      setAutorizaPublicidad(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn"
      style={{ zIndex: 100000 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002244] via-[#003366] to-teal-800 text-white p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-amber-300 fill-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                  Califica tu Experiencia ColorLink / Pintuco
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-white/15 font-mono text-[10px] font-black text-[#FFD100]">
                  {orderNum}
                </span>
              </div>
              <p className="text-[11px] text-sky-100/90 mt-0.5 truncate">
                {itemsSummary} • {order.ciudadEntrega || 'Colombia'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar encuesta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* 1. Atención al Cliente */}
          <StarRatingRow
            title="Atención al Cliente y Asesoría"
            subtitle="Amabilidad, claridad técnica y acompañamiento durante tu compra."
            icon={<HeadphonesIcon className="w-4 h-4 text-blue-900" />}
            value={ratingAtencion}
            onChange={setRatingAtencion}
          />

          {/* 2. Tiempo de Entrega y Puntualidad */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <Truck className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-slate-900">
                    Tiempo de Entrega y Puntualidad del Despacho
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Cumplimiento de la promesa de entrega y estado de recepción.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
                {ratingTiempoEntrega} / 5
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingTiempoEntrega(star)}
                  aria-label={`Tiempo de Entrega: ${star} de 5 estrellas`}
                  className="p-1 rounded-lg hover:bg-amber-50 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= ratingTiempoEntrega ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Selector rápido de puntualidad */}
            <div className="pt-1 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>¿Cómo llegó tu pedido? (opcional)</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PUNCTUALITY_OPTIONS.map((opt) => {
                  const selected = puntualidadEntrega === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPuntualidadEntrega(opt.value)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        selected
                          ? `${opt.tone} ring-1 ring-offset-1 ring-slate-300 shadow-2xs`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Calidad y Acabado del Producto */}
          <StarRatingRow
            title="Calidad y Acabado del Producto"
            subtitle="Cubrimiento, rendimiento, fidelidad de color y presentación Pintuco."
            icon={<Award className="w-4 h-4 text-amber-600" />}
            value={ratingCalidadProducto}
            onChange={setRatingCalidadProducto}
          />

          {/* Observación / Comentario */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">
              Observación / Comentario sobre tu experiencia
            </label>
            <textarea
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos cómo te fue con la asesoría, el tiempo de despacho y el resultado en tu espacio o proyecto..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Adjuntar foto opcional del proyecto pintado */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-teal-700" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Foto de tu espacio o proyecto pintado (opcional)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Comparte el acabado final de tu muro, fachada o mobiliario.
                  </span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5 text-blue-900" />
                <span>{fotoBase64 ? 'Cambiar foto' : 'Adjuntar fotografía'}</span>
              </button>
            </div>

            {fotoBase64 && (
              <div className="relative inline-block">
                <img
                  src={fotoBase64}
                  alt="Vista previa proyecto pintado"
                  className="h-28 w-auto rounded-xl object-cover border border-slate-200 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setFotoBase64(undefined)}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 cursor-pointer"
                  title="Quitar fotografía"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Checkbox autorización publicitaria */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autorizaPublicidad}
              onChange={(e) => setAutorizaPublicidad(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-900 focus:ring-blue-900 cursor-pointer shrink-0"
            />
            <span className="text-[11px] font-semibold text-blue-950 leading-snug">
              Autorizo a ColorLink / Pintuco a publicar mi testimonio y foto en campañas de marca
            </span>
          </label>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#002244] to-teal-700 hover:from-[#003366] hover:to-teal-800 disabled:opacity-60 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FFD100]" />
              <span>{isSubmitting ? 'Enviando...' : 'Enviar Calificación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

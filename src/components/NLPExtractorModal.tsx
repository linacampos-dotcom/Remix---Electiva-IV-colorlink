import React, { useState } from 'react';
import { FMVFormData } from '../types';
import { Sparkles, X, Send, Bot, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface NLPExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExtractedData: (data: FMVFormData) => void;
}

export const NLPExtractorModal: React.FC<NLPExtractorModalProps> = ({
  isOpen,
  onClose,
  onApplyExtractedData,
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/parse-nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        onApplyExtractedData(data.data);
        onClose();
      } else {
        setError(data.error || 'No fue posible extraer los campos automáticamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el motor de IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleText = `Hola equipo Pintuco, les escribe el Arq. Daniel Morales de Inversiones Conconcreto (NIT 900.554.120-1). 
Necesitamos cotizar para una obra residencial en Medellín. 
El proyecto tiene un área de 450 m2 de fachada exterior en mampostería a la vista y queremos aplicar pintura Koraza en color Gris Basalto Satinado. 
Como es pared nueva, necesitamos que incluyan el sellador correspondiente. 
Requerimos la entrega en obra para el próximo 28 de agosto a través de nuestro asesor comercial.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Auto-Completar FMV con Inteligencia Artificial</h2>
              <p className="text-xs text-slate-300">
                Pegue un mensaje de WhatsApp, correo o solicitud informal para autollenar las 13 variables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pegue el texto de la solicitud o mensaje del cliente:
            </label>
            <button
              type="button"
              onClick={() => setInputText(sampleText)}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
            >
              Cargar Texto de Ejemplo
            </button>
          </div>

          <textarea
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ejemplo: 'Hola, cotizar para Constructora Colpatria en Cali 320 m² de fachada nueva...'"
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3.5 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans leading-relaxed"
          />

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Variables que el modelo Gemini extraerá:</span>
            </div>
            <p className="text-indigo-800">
              Cliente, Documento/NIT, Contacto, Canal, Ciudad, Tipo de Obra, Área en m², Fecha, Sustrato, Ambiente, Condición de Pared y Color/Acabado.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExtract}
            disabled={isProcessing || !inputText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Procesando con IA...' : 'Extraer y Llenar Formulario'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

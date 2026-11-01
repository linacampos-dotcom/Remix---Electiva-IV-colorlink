import React, { useState } from 'react';
import { AIAnalysis, CalculationResult, FMVFormData } from '../types';
import { 
  Sparkles, 
  Bot, 
  Wrench, 
  Clock, 
  CloudSun, 
  ShieldAlert, 
  CheckSquare2, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';

interface AIDiagnosticCardProps {
  formData: FMVFormData;
  calculation: CalculationResult;
  aiAnalysis?: AIAnalysis;
  onRunAIDiagnosis: () => Promise<void>;
  isLoadingAI: boolean;
}

export const AIDiagnosticCard: React.FC<AIDiagnosticCardProps> = ({
  formData,
  calculation,
  aiAnalysis,
  onRunAIDiagnosis,
  isLoadingAI,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Diagnóstico Técnico Especializado
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Análisis predictivo de sustrato, clima en {formData.ciudad || 'Colombia'} y directrices de aplicación
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRunAIDiagnosis}
            disabled={isLoadingAI}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin' : ''}`} />
            <span>{isLoadingAI ? 'Analizando...' : 'Actualizar IA'}</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body Content */}
      {expanded && (
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Main Assessment */}
          {aiAnalysis?.diagnosticoDetallado ? (
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-slate-800 text-sm leading-relaxed">
              <div className="font-bold text-indigo-950 flex items-center gap-2 mb-1.5 text-xs uppercase tracking-wider">
                <Bot className="w-4 h-4 text-indigo-600" />
                Concepto Técnico del Especialista Pintuco:
              </div>
              <p className="text-slate-700">{aiAnalysis.diagnosticoDetallado}</p>
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
              <Cpu className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Presione "Actualizar IA" para generar el diagnóstico profundo
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Gemini evaluará las variables climáticas de {formData.ciudad} y la superficie de {formData.superficie}.
              </p>
              <button
                type="button"
                onClick={onRunAIDiagnosis}
                disabled={isLoadingAI}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ejecutar Diagnóstico con IA</span>
              </button>
            </div>
          )}

          {aiAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Preparation Steps */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <CheckSquare2 className="w-4 h-4 text-emerald-600" />
                  <span>Protocolo de Preparación de Superficie:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {aiAnalysis.pasosPreparacion?.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-indigo-700 font-mono">›</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tools Required */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>Herramientas y Complementos de Aplicación:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {aiAnalysis.herramientasRequeridas?.map((tool, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{tool}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Climate Considerations */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <CloudSun className="w-4 h-4 text-sky-600" />
                  <span>Condiciones Climáticas ({formData.ciudad}):</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {aiAnalysis.condicionesClimaticas}
                </p>
              </div>

              {/* Drying Times & Safety */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span>Tiempos de Secado y Curado:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {aiAnalysis.tiemposSecado}
                </p>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};

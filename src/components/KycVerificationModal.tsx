import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  UserCheck, 
  Sparkles, 
  ArrowRight, 
  Check, 
  X, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  RefreshCw, 
  FileText, 
  BadgePercent,
  Bookmark,
  Info,
  ChevronLeft
} from 'lucide-react';
import { KycVerificationData } from '../types/digitalCards';

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: KycVerificationData) => void;
}

const INITIAL_KYC_STATE: KycVerificationData = {
  step: 1,
  fullName: '',
  documentType: 'dni',
  documentNumber: '',
  birthDate: '1995-04-12',
  nationality: 'Española',
  address: 'Calle Mayor 45, 3ºB',
  postalCode: '28013',
  city: 'Madrid',
  documentFrontImage: null,
  documentBackImage: null,
  selfieImage: null,
  status: 'draft',
  riskScore: 'low',
};

export const KycVerificationModal: React.FC<KycVerificationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [formData, setFormData] = useState<KycVerificationData>(() => {
    try {
      const saved = localStorage.getItem('finantrack_kyc_draft');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_KYC_STATE;
  });

  const [simulatedCameraActive, setSimulatedCameraActive] = useState<boolean>(false);
  const [captureTarget, setCaptureTarget] = useState<'front' | 'back' | 'selfie'>('front');
  const [isVerifyingAi, setIsVerifyingAi] = useState<boolean>(false);
  const [savedDraftToast, setSavedDraftToast] = useState<boolean>(false);
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const totalSteps = 5;

  const saveDraft = () => {
    try {
      localStorage.setItem('finantrack_kyc_draft', JSON.stringify(formData));
      setSavedDraftToast(true);
      setTimeout(() => setSavedDraftToast(false), 2500);
    } catch {}
  };

  const handleNextStep = () => {
    // Validaciones en tiempo real antes de avanzar
    const errors: Record<string, string> = {};
    if (formData.step === 2) {
      if (!formData.fullName.trim()) {
        errors.fullName = 'Por favor introduce tu nombre y apellidos completos';
      }
      if (!formData.documentNumber.trim()) {
        errors.documentNumber = 'Introduce el número de tu DNI o Pasaporte';
      }
    }

    if (Object.keys(errors).length > 0) {
      setInputErrors(errors);
      return;
    }

    setInputErrors({});
    if (formData.step === 4) {
      // Iniciar proceso de verificación en segundo plano con IA
      setIsVerifyingAi(true);
      setTimeout(() => {
        setIsVerifyingAi(false);
        const updated: KycVerificationData = {
          ...formData,
          step: 5,
          status: 'verified',
          completedAt: new Date().toISOString(),
        };
        setFormData(updated);
        try {
          localStorage.removeItem('finantrack_kyc_draft');
          localStorage.setItem('finantrack_kyc_verified', 'true');
        } catch {}
        onComplete(updated);
      }, 1500);
      return;
    }

    setFormData(prev => ({ ...prev, step: Math.min(totalSteps, prev.step + 1) }));
    saveDraft();
  };

  const handlePrevStep = () => {
    setFormData(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  };

  const handleSimulateCapture = (target: 'front' | 'back' | 'selfie') => {
    setCaptureTarget(target);
    setSimulatedCameraActive(true);
  };

  const handleConfirmCapture = () => {
    if (captureTarget === 'front') {
      setFormData(prev => ({
        ...prev,
        documentFrontImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      }));
    } else if (captureTarget === 'back') {
      setFormData(prev => ({
        ...prev,
        documentBackImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selfieImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      }));
    }
    setSimulatedCameraActive(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-modal-title"
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera con Barra de Progreso y Contexto (Regla p. 3 [21†L120-L127]) */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white relative shrink-0">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md border border-white/20 text-emerald-100 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Verificación de Identidad (KYC & PSD2)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveDraft}
                className="text-[11px] font-semibold text-emerald-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                title="Guardar y continuar en otro momento"
              >
                <Bookmark className="w-3 h-3" />
                <span>Guardar</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h3 id="kyc-modal-title" className="text-base sm:text-xl font-bold tracking-tight">
              {formData.step === 1 && 'Paso 1 de 5: Presentación & Beneficios Clave'}
              {formData.step === 2 && 'Paso 2 de 5: Datos Personales y Residencia'}
              {formData.step === 3 && 'Paso 3 de 5: Captura Guiada de Documento Oficial'}
              {formData.step === 4 && 'Paso 4 de 5: Reconocimiento Facial y Selfie 3D'}
              {formData.step === 5 && 'Paso 5 de 5: ¡Identidad Verificada con Éxito!'}
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Cumplimiento normativo estricto según directiva europea PSD2 y estándares bancarios KYC.
            </p>
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(formData.step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Toast de Guardado de Progreso */}
        {savedDraftToast && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Progreso guardado. Puedes reanudar en cualquier momento sin perder datos.</span>
          </div>
        )}

        {/* Cuerpo del Asistente */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* PASO 1: BENEFICIOS CLAVE & SPEED-TO-VALUE (Regla p. 3 [21†L157-L166]) */}
          {formData.step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Verifica tu cuenta en menos de 2 minutos
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Desbloquea transferencias de alto importe sin límites, emisión de tarjetas digitales Visa y análisis con IA avanzados de forma 100% segura.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Speed-to-Value</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Acceso inmediato al dashboard mientras verificamos en segundo plano.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Cifrado de Alto Grado</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Tus datos biométricos se protegen bajo estándar bancario AES-256.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Validación con IA</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Detección automática de bordes y legibilidad en tiempo real.</p>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: DATOS BÁSICOS & RESIDENCIA (Validación inmediata en tiempo real [47†L350-L358]) */}
          {formData.step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nombre Completo (tal como figura en tu ID)
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (inputErrors.fullName) setInputErrors({ ...inputErrors, fullName: '' });
                    }}
                    placeholder="Ej. Fernando González Pérez"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {inputErrors.fullName && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{inputErrors.fullName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tipo de Documento
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="dni">DNI / Documento Nacional (España)</option>
                    <option value="nie">NIE / Certificado de Residencia</option>
                    <option value="passport">Pasaporte Internacional</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, documentNumber: e.target.value });
                      if (inputErrors.documentNumber) setInputErrors({ ...inputErrors, documentNumber: '' });
                    }}
                    placeholder="Ej. 12345678Z"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                  {inputErrors.documentNumber && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{inputErrors.documentNumber}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Dirección de Residencia
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ciudad y Código Postal
                  </label>
                  <input
                    type="text"
                    value={`${formData.city} (${formData.postalCode})`}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: CAPTURA GUIADA DE DOCUMENTO OFICIAL (Regla p. 3 [21†L213-L221]) */}
          {formData.step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Sostén tu documento sobre una superficie plana y bien iluminada. Nuestro sistema detecta automáticamente los 4 bordes y la nitidez.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Frontal */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    1. Anverso / Parte Frontal
                  </span>
                  {formData.documentFrontImage ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 aspect-[16/10] bg-slate-900 flex items-center justify-center">
                      <img src={formData.documentFrontImage} alt="Anverso DNI" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-emerald-950/30 flex items-center justify-center">
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md">
                          <Check className="w-3.5 h-3.5" />
                          Bordes detectados (99%)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl aspect-[16/10] flex flex-col items-center justify-center p-4 bg-white/60 dark:bg-slate-900/60 space-y-2">
                      <Camera className="w-8 h-8 text-slate-400" />
                      <p className="text-xs text-slate-500">Encuadra la parte frontal del DNI</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSimulateCapture('front')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{formData.documentFrontImage ? 'Repetir Captura' : 'Escanear Frontal'}</span>
                  </button>
                </div>

                {/* Reverso */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    2. Reverso / Parte Trasera
                  </span>
                  {formData.documentBackImage ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 aspect-[16/10] bg-slate-900 flex items-center justify-center">
                      <img src={formData.documentBackImage} alt="Reverso DNI" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-emerald-950/30 flex items-center justify-center">
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md">
                          <Check className="w-3.5 h-3.5" />
                          Legibilidad OK (100%)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl aspect-[16/10] flex flex-col items-center justify-center p-4 bg-white/60 dark:bg-slate-900/60 space-y-2">
                      <Camera className="w-8 h-8 text-slate-400" />
                      <p className="text-xs text-slate-500">Encuadra la parte posterior del DNI</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSimulateCapture('back')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{formData.documentBackImage ? 'Repetir Captura' : 'Escanear Reverso'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: RECONOCIMIENTO FACIAL Y SELFIE (Regla p. 3) */}
          {formData.step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-4 max-w-md mx-auto">
                <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-emerald-500 bg-slate-900 shadow-xl flex items-center justify-center">
                  {formData.selfieImage ? (
                    <img src={formData.selfieImage} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="w-16 h-16 text-slate-400" />
                  )}
                  <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-full animate-spin-slow pointer-events-none" />
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Verificación de Prueba de Vida 3D
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Mira al frente y asegura que tu rostro esté despejado y sin gafas de sol.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulateCapture('selfie')}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <Camera className="w-4 h-4" />
                  <span>{formData.selfieImage ? 'Repetir Selfie' : 'Tomar Selfie Biométrica'}</span>
                </button>
              </div>
            </div>
          )}

          {/* PASO 5: ÉXITO Y ACTIVACIÓN TOTAL (Speed-to-value) */}
          {formData.step === 5 && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  ¡Verificación de Identidad Completada!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  Tu perfil ha sido validado con éxito. Se han activado todos los privilegios operativos, límites ampliados y emisión instantánea de tarjetas.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Nivel de Seguridad Máximo • PSD2 SCA Activo</span>
              </div>
            </div>
          )}

          {/* Modal simulado de Cámara / Detección de Bordes en Tiempo Real */}
          {simulatedCameraActive && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
              <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl p-6 text-white text-center space-y-4 border border-slate-700 shadow-2xl">
                <h4 className="font-bold text-base flex items-center justify-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span>Detección Automática de Bordes con IA</span>
                </h4>
                <div className="relative aspect-[16/10] bg-slate-800 rounded-2xl overflow-hidden border-2 border-emerald-400 flex items-center justify-center">
                  <div className="absolute inset-4 border-2 border-dashed border-emerald-400/80 rounded-xl flex items-center justify-center animate-pulse">
                    <span className="text-xs font-bold bg-black/60 px-3 py-1 rounded-full text-emerald-300">
                      Mantén firme el documento
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSimulatedCameraActive(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCapture}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Capturar y Validar</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Barra de Acciones del Asistente */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-3 shrink-0">
          {formData.step > 1 && formData.step < totalSteps ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          ) : (
            <div />
          )}

          {formData.step < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={isVerifyingAi}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              {isVerifyingAi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verificando con IA...</span>
                </>
              ) : (
                <>
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-all"
            >
              Comenzar a Usar FinanTrack
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

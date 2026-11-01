import React, { useRef, useEffect } from 'react';

interface OtpInputBoxesProps {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const OtpInputBoxes: React.FC<OtpInputBoxesProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Array de 6 caracteres
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const handleDigitChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      // Borró el dígito
      const newDigits = [...digits];
      newDigits[index] = '';
      const newVal = newDigits.join('').slice(0, 6);
      onChange(newVal);
      return;
    }

    // Si pegó varios dígitos en un solo input
    if (rawVal.length > 1) {
      const pastedDigits = rawVal.slice(0, 6);
      onChange(pastedDigits);
      if (pastedDigits.length === 6 && onComplete) {
        onComplete(pastedDigits);
      }
      const focusIndex = Math.min(pastedDigits.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    // Ingresó 1 dígito
    const newChar = rawVal[0];
    const newDigits = [...digits];
    newDigits[index] = newChar;
    const newVal = newDigits.join('').slice(0, 6);
    onChange(newVal);

    if (newVal.length === 6 && onComplete) {
      onComplete(newVal);
    }

    // Avanzar foco al siguiente input
    if (index < 5 && newChar) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Si la casilla actual está vacía, mover el foco a la anterior y vaciarla
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    onChange(pasted);
    if (pasted.length === 6 && onComplete) {
      onComplete(pasted);
    }
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-3">
      {Array.from({ length: 6 }).map((_, idx) => {
        const isFilled = Boolean(digits[idx]);
        return (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            disabled={disabled}
            value={digits[idx] || ''}
            onChange={(e) => handleDigitChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-2xl font-black rounded-xl sm:rounded-2xl transition-all duration-200 outline-none select-none ${
              isFilled
                ? 'bg-blue-50/80 text-blue-900 border-2 border-cyan-500 shadow-sm shadow-cyan-200/50 scale-[1.02]'
                : 'bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
          />
        );
      })}
    </div>
  );
};

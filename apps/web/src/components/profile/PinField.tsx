'use client';

import React from 'react';
import { PIN_LENGTH } from '@/lib/profile/parentPin';

interface PinFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called once all digits are in (the gate checks the PIN at once). */
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

/** Four boxes that show dots; the real field is a transparent numeric
 * password input over them, so taps, the number pad, paste, backspace and
 * screen readers all work as usual. */
export function PinField({ id, label, value, onChange, onComplete, autoFocus, invalid, disabled, describedBy, inputRef }: PinFieldProps) {
  return (
    <div className="pin-field relative mx-auto w-fit">
      <label htmlFor={id} className="sr-only">{label}</label>
      <div aria-hidden="true" className="flex gap-2.5">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span key={i} className={'pin-box' + (i < value.length ? ' pin-box--filled' : '') +
            (i === Math.min(value.length, PIN_LENGTH - 1) ? ' pin-box--current' : '') + (invalid ? ' pin-box--invalid' : '')}>
            {i < value.length ? '●' : ''}
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={PIN_LENGTH}
        autoFocus={autoFocus}
        disabled={disabled}
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
          onChange(next);
          if (next.length === PIN_LENGTH) onComplete?.(next);
        }}
        className="pin-input absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  );
}

import React, { useRef, useState, useEffect } from 'react';

export default function OTPInput({ length = 6, onComplete, error, disabled }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const [shaking, setShaking] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (error) {
      setShaking(true);
      const timer = setTimeout(() => {
        setShaking(false);
        setValues(Array(length).fill(''));
        inputRefs.current[0]?.focus();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [error, length]);

  const handleChange = (index, val) => {
    if (disabled) return;
    const char = val.slice(-1).toUpperCase();
    if (!/[A-Z0-9]/.test(char) && char !== '') return;

    const newValues = [...values];
    newValues[index] = char;
    setValues(newValues);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValues.every(v => v) && char) {
      onComplete?.(newValues.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length);
    if (pasted.length === 0) return;
    const newValues = [...values];
    pasted.split('').forEach((char, i) => { newValues[i] = char; });
    setValues(newValues);
    const nextEmpty = newValues.findIndex(v => !v);
    inputRefs.current[nextEmpty === -1 ? length - 1 : nextEmpty]?.focus();
    if (newValues.every(v => v)) onComplete?.(newValues.join(''));
  };

  return (
    <div className={`flex gap-2 sm:gap-3 justify-center ${shaking ? 'animate-shake' : ''}`}>
      {values.map((val, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-12 h-14 sm:w-[52px] sm:h-16 text-center text-xl sm:text-2xl font-semibold rounded-lg outline-none transition-all duration-150 font-mono"
          style={{
            backgroundColor: 'var(--bg-deep)',
            border: `2px solid ${error && shaking ? 'var(--accent-red)' : 'var(--border-btn)'}`,
            color: 'var(--accent-primary)',
            caretColor: 'var(--accent-primary)',
          }}
          onFocus={e => e.target.style.borderColor = error ? 'var(--accent-red)' : 'var(--accent-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-btn)'}
        />
      ))}
    </div>
  );
}
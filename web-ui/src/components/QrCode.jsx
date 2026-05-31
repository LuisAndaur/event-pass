import React from 'react';

// Decorative QR placeholder (matches the prototype). Not a scannable code —
// the real ticket id is shown as text alongside it.
function QrCode({ size }) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect width="100" height="100" fill="white" />
      <g fill="black">
        <rect x="5" y="5" width="20" height="20" /><rect x="8" y="8" width="14" height="14" fill="white" /><rect x="11" y="11" width="8" height="8" />
        <rect x="75" y="5" width="20" height="20" /><rect x="78" y="8" width="14" height="14" fill="white" /><rect x="81" y="11" width="8" height="8" />
        <rect x="5" y="75" width="20" height="20" /><rect x="8" y="78" width="14" height="14" fill="white" /><rect x="11" y="81" width="8" height="8" />
        <rect x="30" y="6" width="3" height="3" /><rect x="36" y="6" width="3" height="3" /><rect x="48" y="6" width="3" height="3" /><rect x="60" y="6" width="3" height="3" />
        <rect x="30" y="30" width="3" height="3" /><rect x="42" y="30" width="3" height="3" /><rect x="54" y="30" width="3" height="3" /><rect x="78" y="30" width="3" height="3" />
        <rect x="18" y="36" width="3" height="3" /><rect x="36" y="36" width="3" height="3" /><rect x="60" y="36" width="3" height="3" /><rect x="84" y="36" width="3" height="3" />
        <rect x="6" y="42" width="3" height="3" /><rect x="42" y="42" width="3" height="3" /><rect x="66" y="42" width="3" height="3" /><rect x="78" y="42" width="3" height="3" />
        <rect x="30" y="48" width="3" height="3" /><rect x="48" y="48" width="3" height="3" /><rect x="60" y="48" width="3" height="3" /><rect x="90" y="48" width="3" height="3" />
        <rect x="6" y="54" width="3" height="3" /><rect x="36" y="54" width="3" height="3" /><rect x="54" y="54" width="3" height="3" /><rect x="84" y="54" width="3" height="3" />
        <rect x="30" y="72" width="3" height="3" /><rect x="48" y="72" width="3" height="3" /><rect x="66" y="72" width="3" height="3" />
        <rect x="36" y="78" width="3" height="3" /><rect x="60" y="78" width="3" height="3" />
        <rect x="30" y="84" width="3" height="3" /><rect x="54" y="84" width="3" height="3" /><rect x="72" y="84" width="3" height="3" />
      </g>
    </svg>
  );
}

export default QrCode;

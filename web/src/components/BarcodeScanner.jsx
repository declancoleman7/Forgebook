import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Icon from '../icons.jsx';

const VIEWPORT_ID = 'barcode-scanner-viewport';

// GW box barcodes are ordinary retail EAN-13s -- restricting the formats
// the decoder looks for (rather than every format the library supports)
// keeps it from wasting frames trying to also read QR/Aztec/PDF417 on
// something that's never going to be one.
const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
];

// A full-screen scan overlay -- camera view with a live decoder, plus a
// manual text-entry fallback that's always available (camera permission
// denied, bad lighting, a barcode too worn to read, or just testing without
// a real camera). onDetected fires once per open; the caller is responsible
// for closing this (or leaving it open to scan again).
export default function BarcodeScanner({ onDetected, onClose }) {
  const [status, setStatus] = useState('starting'); // starting | scanning | error
  const [manualValue, setManualValue] = useState('');
  const scannerRef = useRef(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);

    // .stop() throws a bare string (not a rejected promise, not an Error --
    // an uncaught throw a .catch() can't intercept) if the camera hasn't
    // actually finished starting yet -- which React's StrictMode guarantees
    // happens at least once in dev, since it mounts, cleans up, and mounts
    // again before an async start() has any chance to settle. teardown()
    // below is the only path allowed to touch stop()/clear(), gated on
    // isScanning, and both the cleanup function and start()'s own
    // continuation defer to it -- whichever settles last actually runs it.
    let active = true;
    const scanner = new Html5Qrcode(VIEWPORT_ID, { formatsToSupport: FORMATS, verbose: false });
    scannerRef.current = scanner;
    const teardown = () => {
      if (scanner.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {});
      else { try { scanner.clear(); } catch { /* nothing to clear */ } }
    };

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 140 } },
      (decodedText) => {
        if (detectedRef.current) return; // ignore extra frames while stop() is still in flight
        detectedRef.current = true;
        onDetected(decodedText);
      },
      () => {} // per-frame "nothing found in this frame" -- not an error, ignore
    ).then(() => { if (active) setStatus('scanning'); else teardown(); })
      .catch(() => { if (active) setStatus('error'); });

    return () => {
      document.removeEventListener('keydown', onKey);
      active = false;
      teardown();
    };
  }, [onDetected, onClose]);

  const submitManual = () => {
    const v = manualValue.trim();
    if (!v) return;
    detectedRef.current = true;
    onDetected(v);
  };

  return (
    <div className="scanner-overlay">
      <div className="scanner-overlay__header">
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="back" size={18} /></button>
        <div className="page-title" style={{ margin: 0 }}>Scan a barcode</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="scanner-overlay__viewport-wrap">
        <div id={VIEWPORT_ID} className="scanner-overlay__viewport" />
        {status === 'starting' && <div className="scanner-overlay__hint">Starting camera…</div>}
        {status === 'error' && <div className="scanner-overlay__hint">Couldn't access the camera — type the barcode below instead.</div>}
        {status === 'scanning' && <div className="scanner-overlay__hint">Point the camera at the box's barcode.</div>}
      </div>

      <div className="scanner-overlay__manual">
        <div className="label-hint" style={{ marginBottom: 6 }}>Can't scan it? Type the barcode instead.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" inputMode="numeric" placeholder="e.g. 5011921135941" value={manualValue}
            onChange={(e) => setManualValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitManual(); }} />
          <button type="button" className="btn btn-primary btn-sm" onClick={submitManual}>Use this</button>
        </div>
      </div>
    </div>
  );
}

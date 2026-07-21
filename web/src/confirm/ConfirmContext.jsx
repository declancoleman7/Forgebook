import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

// Same in-app "are you sure?" as the old app's showConfirm() -- an overlay
// rather than the browser's own confirm(), styled to match. React version:
// a single overlay slot at the app root instead of appendChild/remove.
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { message, okLabel, cancelLabel, danger } | null
  const resolver = useRef(null);

  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setDialog({ message, okLabel: opts.okLabel || 'Remove', cancelLabel: opts.cancelLabel || 'Cancel', danger: opts.danger !== false });
    });
  }, []);

  const close = (result) => {
    setDialog(null);
    resolver.current?.(result);
    resolver.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="confirm-overlay">
          <div className="confirm-overlay__backdrop" onClick={() => close(false)} />
          <div className="confirm-dialog" role="alertdialog" aria-modal="true">
            <div className="confirm-dialog__message">{dialog.message}</div>
            <div className="confirm-dialog__actions">
              <button type="button" className="btn btn-ghost" onClick={() => close(false)}>{dialog.cancelLabel}</button>
              <button type="button" className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} autoFocus onClick={() => close(true)}>{dialog.okLabel}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ReportContext = createContext(null);

// Same in-app overlay shape as ConfirmContext, plus an optional-reason
// textarea -- ported from the old app's showReportDialog(). report(kind)
// resolves to a reason string (possibly empty) if the user confirms, or
// null if they cancel.
export function ReportProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { kind } | null
  const [reason, setReason] = useState('');
  const resolver = useRef(null);

  const report = useCallback((kind) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setReason('');
      setDialog({ kind });
    });
  }, []);

  const close = (result) => {
    setDialog(null);
    resolver.current?.(result);
    resolver.current = null;
  };

  return (
    <ReportContext.Provider value={report}>
      {children}
      {dialog && (
        <div className="confirm-overlay">
          <div className="confirm-overlay__backdrop" onClick={() => close(null)} />
          <div className="confirm-dialog" role="alertdialog" aria-modal="true">
            <div className="confirm-dialog__message">Report this {dialog.kind === 'comment' ? 'comment' : 'note'}? Let us know what's wrong (optional).</div>
            <textarea className="report-reason-input" maxLength={200} placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="confirm-dialog__actions">
              <button type="button" className="btn btn-ghost" onClick={() => close(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" autoFocus onClick={() => close(reason.trim())}>Report</button>
            </div>
          </div>
        </div>
      )}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReport must be used within ReportProvider');
  return ctx;
}

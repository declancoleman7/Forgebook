import { supabase } from './supabase.js';

// Stage 0 placeholder -- confirms the build pipeline (Vite, forgebook.css,
// fonts, React Query + Router providers, the Supabase client/mock seam)
// works end to end. The real shell (side-nav/topbar/bottom-nav/FAB from
// buildShell() in the old js/app.js) gets built in Stage 1.
export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <div className="page-title">Forgebook</div>
      <div className="detail-sub">
        React migration -- Stage 0 scaffold ({supabase ? 'supabase client ready' : 'no client'})
      </div>
    </div>
  )
}

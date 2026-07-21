import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { ToastProvider } from './toast/ToastContext.jsx';
import { ConfirmProvider } from './confirm/ConfirmContext.jsx';
import BootSplash from './components/BootSplash.jsx';
import Gate from './components/Gate.jsx';
import PasswordScreen from './components/PasswordScreen.jsx';
import Layout from './components/Layout.jsx';
import Placeholder from './pages/Placeholder.jsx';
import SettingsPlaceholder from './pages/SettingsPlaceholder.jsx';

// Same "what should be on screen right now" decision as the old app's
// decideBootState(), just expressed as JSX branches instead of imperative
// document.getElementById("app").innerHTML swaps. No boot-time loadBook()
// gate here -- Stage 2's per-page TanStack Query hooks handle their own
// loading state instead of one big blocking fetch before anything renders.
function Boot() {
  const { booting, inPasswordRecovery, isSignedIn, needsPasswordSetup } = useAuth();

  if (booting) return <BootSplash />;
  if (inPasswordRecovery) return <PasswordScreen mode="recovery" />;
  if (isSignedIn && needsPasswordSetup) return <PasswordScreen mode="setup" />;
  if (!isSignedIn) return <Gate />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/home" element={<Placeholder title="Home" />} />
        <Route path="/factions" element={<Placeholder title="Collection" />} />
        <Route path="/faction/:id" element={<Placeholder title="Faction" />} />
        <Route path="/faction/:id/unit/:unit" element={<Placeholder title="Unit" />} />
        <Route path="/recipes" element={<Placeholder title="Search" />} />
        <Route path="/recipe-new" element={<Placeholder title="New recipe" />} />
        <Route path="/recipe/:id" element={<Placeholder title="Recipe" />} />
        <Route path="/recipe/:id/edit" element={<Placeholder title="Edit recipe" />} />
        <Route path="/recipe/:id/by/:authorId" element={<Placeholder title="Recipe" />} />
        <Route path="/paints" element={<Placeholder title="My Rack" />} />
        <Route path="/paint-new" element={<Placeholder title="New paint" />} />
        <Route path="/paint/:id" element={<Placeholder title="Paint" />} />
        <Route path="/paint-library" element={<Placeholder title="Paint Library" />} />
        <Route path="/similar" element={<Placeholder title="Similar Colours" />} />
        <Route path="/similar/:name/:brand" element={<Placeholder title="Similar Colours" />} />
        <Route path="/u" element={<Placeholder title="Find a Painter" />} />
        <Route path="/u/:id" element={<Placeholder title="Profile" />} />
        <Route path="/u/:id/section/:kind" element={<Placeholder title="Profile section" />} />
        <Route path="/settings" element={<SettingsPlaceholder />} />
        <Route path="/notifications" element={<Placeholder title="Notifications" />} />
        <Route path="/change-password" element={<Placeholder title="Change password" />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Boot />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

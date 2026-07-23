import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { ToastProvider } from './toast/ToastContext.jsx';
import { ConfirmProvider } from './confirm/ConfirmContext.jsx';
import { ReportProvider } from './report/ReportContext.jsx';
import BootSplash from './components/BootSplash.jsx';
import Gate from './components/Gate.jsx';
import PasswordScreen from './components/PasswordScreen.jsx';
import Layout from './components/Layout.jsx';
import Settings from './pages/Settings.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import Notifications from './pages/Notifications.jsx';
import MyRack from './pages/MyRack.jsx';
import PaintDetail from './pages/PaintDetail.jsx';
import PaintLibrary from './pages/PaintLibrary.jsx';
import Collection from './pages/Collection.jsx';
import FactionDetail from './pages/FactionDetail.jsx';
import UnitDetail from './pages/UnitDetail.jsx';
import RecipesSearch from './pages/RecipesSearch.jsx';
import RecipeDetail from './pages/RecipeDetail.jsx';
import RecipeForm from './pages/RecipeForm.jsx';
import PaintForm from './pages/PaintForm.jsx';
import ProfileSearch from './pages/ProfileSearch.jsx';
import Profile from './pages/Profile.jsx';
import ProfileSection from './pages/ProfileSection.jsx';
import Home from './pages/Home.jsx';
import PublicRecipe from './pages/PublicRecipe.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import SimilarColours from './pages/SimilarColours.jsx';
import HobbyLog from './pages/HobbyLog.jsx';
import Admin from './pages/Admin.jsx';

// Same "what should be on screen right now" decision as the old app's
// decideBootState(), just expressed as JSX branches instead of imperative
// document.getElementById("app").innerHTML swaps. No boot-time loadBook()
// gate here -- Stage 2's per-page TanStack Query hooks handle their own
// loading state instead of one big blocking fetch before anything renders.
function Boot() {
  const { booting, inPasswordRecovery, isSignedIn, needsPasswordSetup } = useAuth();
  const location = useLocation();

  if (booting) return <BootSplash />;

  // A signed-out visitor hitting a profile link sees the public, shell-less
  // profile instead of the sign-in gate -- mirrors the old app's
  // `route === "profile" && params.id && !isSignedIn()` bypass of its own
  // normal decideBootState() gate. /u/:id/section/:kind has no signed-out
  // equivalent (follower/notes/ratings lists are never public), so that one
  // still falls through to the gate below.
  if (!isSignedIn) {
    const m = location.pathname.match(/^\/u\/([^/]+)$/);
    if (m) return <PublicProfile id={decodeURIComponent(m[1])} />;
  }

  if (inPasswordRecovery) return <PasswordScreen mode="recovery" />;
  if (isSignedIn && needsPasswordSetup) return <PasswordScreen mode="setup" />;
  if (!isSignedIn) return <Gate />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/factions" element={<Collection />} />
        <Route path="/faction/:id" element={<FactionDetail />} />
        <Route path="/faction/:id/unit/:unit" element={<UnitDetail />} />
        <Route path="/recipes" element={<RecipesSearch />} />
        <Route path="/recipe-new" element={<RecipeForm />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/recipe/:id/edit" element={<RecipeForm />} />
        <Route path="/recipe/:id/by/:authorId" element={<RecipeDetail />} />
        <Route path="/paints" element={<MyRack />} />
        <Route path="/paint-new" element={<PaintForm />} />
        <Route path="/paint/:id" element={<PaintDetail />} />
        <Route path="/paint-library" element={<PaintLibrary />} />
        <Route path="/similar" element={<SimilarColours />} />
        <Route path="/similar/:name/:brand" element={<SimilarColours />} />
        <Route path="/u" element={<ProfileSearch />} />
        <Route path="/u/:id" element={<Profile />} />
        <Route path="/u/:id/section/:kind" element={<ProfileSection />} />
        <Route path="/hobby-log" element={<HobbyLog />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}

// The public recipe share link is entirely separate from the signed-in
// app -- no shell, no auth gate, works for a visitor with no Forgebook
// account and no session at all -- so it's routed here, outside Boot()'s
// booting/gate logic entirely, same as the old app's renderPublicRecipe()
// bypassing decideBootState() outright.
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <ReportProvider>
            <Routes>
              <Route path="/r/:authorId/:id" element={<PublicRecipe />} />
              <Route path="*" element={<Boot />} />
            </Routes>
          </ReportProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

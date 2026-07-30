import { useNavigate } from 'react-router-dom';
import LegalPageShell from '../components/LegalPageShell.jsx';

export default function Terms() {
  const navigate = useNavigate();
  return (
    <LegalPageShell title="Terms of Service">
      <div className="legal-page__updated">
        Written in plain language for a small, self-run hobby project — not a substitute for
        professional legal advice. [Placeholder — last updated date]
      </div>

      <p>
        By creating an account or using Forgebook, you agree to these terms. If you don't agree,
        please don't use the app.
      </p>

      <div className="section-label">What Forgebook is</div>
      <p>
        Forgebook is a free, personal-use tool for tracking paint recipes, a paint rack, and a
        hobby-progress log for tabletop miniatures. It's built and maintained by one person as a
        hobby project, not a commercial service.
      </p>

      <div className="section-label">Not affiliated with any game publisher</div>
      <p>
        Forgebook is an independent, unofficial fan-made tool. It is not affiliated with, endorsed
        by, sponsored by, or in any way officially connected with Games Workshop, Wizards of the
        Coast, or any other tabletop game publisher, or any of their subsidiaries or affiliates.
        Warhammer, Age of Sigmar, Dungeons &amp; Dragons, and any other game names, faction names,
        or product names referenced within the app are trademarks of their respective owners, used
        here purely to help you describe and organise your own content. Emblem artwork bundled with
        Forgebook is original artwork created for the app, not the trademarked iconography of any
        game publisher.
      </p>

      <div className="section-label">Your account</div>
      <p>
        You need an account to use Forgebook. Please give a real email address so account recovery
        works, keep your password to yourself, and don't impersonate someone else or create an
        account for anyone but yourself. You're responsible for what happens under your account.
      </p>

      <div className="section-label">Your content</div>
      <p>
        You own whatever you create in Forgebook — recipes, photos, notes, comments, and everything
        else. Choosing to publish a recipe or post a comment shares it with other Forgebook users
        within the app; it doesn't transfer ownership to us or to anyone else. Please only upload
        photos and text you have the right to share — a photo of your own painted miniature is
        fine; someone else's copyrighted artwork or writing is not.
      </p>
      <p>
        You can edit or remove most of your own content directly in the app at any time. See our{' '}
        <span className="legal-page__link" onClick={() => navigate('/privacy')}>Privacy Policy</span> for how full
        account deletion currently works.
      </p>

      <div className="section-label">Community conduct</div>
      <p>
        Be decent to other painters. Content or accounts that harass others, infringe someone's
        rights, or otherwise break these terms may be hidden, edited, or removed, and accounts may
        be suspended or banned, at our discretion. Reporting tools exist in the app for exactly
        this.
      </p>

      <div className="section-label">No warranty</div>
      <p>
        Forgebook is provided free and "as is," with no guarantee of uptime, accuracy, or that your
        data will never be lost. We take reasonable care, but this is a small, self-run project, not
        a professional hosting service — please don't rely on it as your only copy of anything
        irreplaceable.
      </p>

      <div className="section-label">Changes</div>
      <p>
        These terms may change as Forgebook does. Continuing to use the app after a change means you
        accept the updated terms.
      </p>

      <div className="section-label">Contact</div>
      <p>Questions about these terms: [placeholder contact email].</p>
    </LegalPageShell>
  );
}

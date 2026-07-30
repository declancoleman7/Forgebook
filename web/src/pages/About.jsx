import { useNavigate } from 'react-router-dom';
import LegalPageShell from '../components/LegalPageShell.jsx';

export default function About() {
  const navigate = useNavigate();
  return (
    <LegalPageShell title="About Forgebook">
      <p>
        Forgebook is a companion for painting tabletop miniatures — Warhammer, D&amp;D, and whatever
        else ends up on your desk. Write down a paint recipe step by step once, and it's there the
        next time you need to match an army, mix a scheme from memory, or just remember what "two
        thin coats of Warboss Green" actually looked like.
      </p>
      <p>
        Alongside recipes, Forgebook keeps a paint rack (what you own, what you're out of), a Pile of
        Potential tracker for the actual miniatures you're building and painting, and a small
        community layer for sharing recipes, rating paints, and following other painters.
      </p>

      <div className="section-label">A small, personal project</div>
      <p>
        Forgebook is built and run by one person, not a company — a hobby tool for a hobby, made
        because the alternative was a pile of half-remembered notes. There's no advertising, no
        analytics tracking you around the web, and nothing here is for sale.
      </p>

      <div className="section-label">Not affiliated with Games Workshop or Wizards of the Coast</div>
      <p>
        Forgebook is an independent, unofficial fan-made tool. It is not affiliated with, endorsed
        by, or sponsored by Games Workshop, Wizards of the Coast, or any other game publisher.
        Warhammer, faction names, and other game terms used within the app belong to their
        respective owners and are used only to help you organise your own recipes — see{' '}
        <span className="legal-page__link" onClick={() => navigate('/terms')}>Terms of Service</span> for the full notice.
        Every emblem shipped with the app is original artwork drawn for Forgebook, not Games
        Workshop's own iconography.
      </p>

      <div className="section-label">More</div>
      <p>
        <span className="legal-page__link" onClick={() => navigate('/terms')}>Terms of Service</span>
        {' · '}
        <span className="legal-page__link" onClick={() => navigate('/privacy')}>Privacy Policy</span>
      </p>
    </LegalPageShell>
  );
}

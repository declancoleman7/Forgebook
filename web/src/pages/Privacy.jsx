import LegalPageShell from '../components/LegalPageShell.jsx';

export default function Privacy() {
  return (
    <LegalPageShell title="Privacy Policy">
      <div className="legal-page__updated">
        Written in plain language for a small, self-run hobby project. [Placeholder — last updated date]
      </div>

      <div className="section-label">Information we collect</div>
      <p>
        <strong>Account details</strong> — your email address and password are handled by our
        authentication provider, Supabase, and are never stored in Forgebook's own data as
        plain text.
      </p>
      <p>
        <strong>Profile info</strong> — your display name and, if you add one, a profile picture.
      </p>
      <p>
        <strong>Content you create</strong> — recipes and any photos you attach, your paint rack
        and shopping list, Pile of Potential entries and their photos, comments, community paint
        notes, ratings, and any reports you file.
      </p>
      <p>
        <strong>Social info</strong> — who you follow, and recipes/paints you've saved.
      </p>

      <div className="section-label">What we don't collect</div>
      <p>
        Forgebook has no third-party analytics, no advertising trackers, and no telemetry of any
        kind. We don't sell or share your data with advertisers — there isn't any advertising
        business here to sell it to.
      </p>

      <div className="section-label">How your information is used</div>
      <p>
        Purely to run the app: syncing your recipes and paint rack across your own devices, showing
        content to other users where you've chosen to share or publish it, and moderating reported
        content.
      </p>

      <div className="section-label">Where your data is stored</div>
      <p>
        Forgebook's database, authentication, and photo storage are run on Supabase, a third-party
        database provider. The app itself is served as a static site. Neither has any relationship
        with Forgebook beyond hosting the infrastructure — they don't get access to sell or use your
        content.
      </p>

      <div className="section-label">Cookies and local storage</div>
      <p>
        Forgebook doesn't use cookies. Signing in stores a session token in your browser's local
        storage so you stay signed in, and a few preferences (like light/dark theme) are stored
        the same way, on your device only.
      </p>

      <div className="section-label">Third parties</div>
      <p>
        The app loads two typefaces from Google Fonts, which — like any web font CDN — can see the
        IP address of the device requesting them. That's the only third-party network request
        Forgebook makes; there's nothing else phoning home.
      </p>

      <div className="section-label">Your rights and control</div>
      <p>
        You can edit or delete most of your own content (recipes, paints, hobby log entries,
        comments, notes) directly in the app at any time.
      </p>
      <p>
        You can also delete your whole account yourself, any time, from Settings → Danger zone.
        This permanently removes your account, your recipes, paint rack, Pile of Potential, and
        every comment, note, and rating you've left, along with any photos you've uploaded — it
        can't be undone. One honest exception: if someone else has used "Copy to new recipe" on a
        recipe you published, their copy keeps a small text note recording the original recipe's
        name (not your account or any other personal details) even after your account is gone —
        that's a deliberate record of where a recipe came from, not something tied to your live
        account.
      </p>

      <div className="section-label">Changes</div>
      <p>This policy may be updated as Forgebook changes. Material changes will be reflected here.</p>

      <div className="section-label">Contact</div>
      <p>Questions about your data: [placeholder contact email].</p>
    </LegalPageShell>
  );
}

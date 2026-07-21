// Same as the old app's avatarGlyphHtml() -- an <img>-style circle when a
// profile has uploaded one, otherwise a tinted initial-letter circle, so
// nobody ever shows as a broken image.
export default function Avatar({ displayName, url, size = 24 }) {
  if (url) {
    return <span className="avatar" style={{ width: size, height: size, backgroundImage: `url('${url}')` }} />;
  }
  const letter = ((displayName || '?').trim()[0] || '?').toUpperCase();
  return (
    <span className="avatar avatar--fallback" style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}>
      {letter}
    </span>
  );
}

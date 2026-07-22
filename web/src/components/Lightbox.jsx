import { useEffect } from 'react';

// Full-size view of a recipe photo -- ported from the old app's
// showLightbox(): closeable via the backdrop, the close button, or Escape.
export default function Lightbox({ url, onClose }) {
  useEffect(() => {
    const onKeydown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [onClose]);

  return (
    <div className="lightbox-overlay">
      <div className="lightbox-overlay__backdrop" onClick={onClose} />
      <button type="button" className="lightbox-overlay__close" aria-label="Close" onClick={onClose}>&times;</button>
      <img className="lightbox-overlay__img" src={url} alt="Finished mini, full size" />
    </div>
  );
}

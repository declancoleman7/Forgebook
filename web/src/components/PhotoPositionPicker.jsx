import { useRef } from 'react';
import Icon from '../icons.jsx';

// Lets a user recenter a photo whose subject isn't dead center -- shows the
// full, uncropped image (no letterboxing: the <img> sizes to its own
// content rather than a forced-aspect container, so a click/drag position
// maps directly onto the image's own rendered box) with a draggable marker,
// plus a live preview of the actual cropped hero strip the recipe detail
// page renders. One normalized (0-1, 0-1) focal point works across every
// display context (card thumbnail, detail hero, feed card) since each just
// crops around the same point at its own aspect ratio.
export default function PhotoPositionPicker({ photo, focalX, focalY, onChange, onClose }) {
  const imgRef = useRef(null);
  const draggingRef = useRef(false);

  const updateFromEvent = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    x = Math.min(1, Math.max(0, x));
    y = Math.min(1, Math.max(0, y));
    onChange(x, y);
  };

  const onPointerDown = (e) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromEvent(e);
  };
  const onPointerMove = (e) => { if (draggingRef.current) updateFromEvent(e); };
  const onPointerUp = () => { draggingRef.current = false; };

  return (
    <div className="filter-overlay">
      <div className="filter-overlay__backdrop" onClick={onClose} />
      <div className="photo-position-picker__panel">
        <div className="paint-picker__header">
          <div className="paint-picker__title">Position photo</div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="back" size={18} /></button>
        </div>
        <div className="detail-sub" style={{ margin: '0 16px 12px' }}>
          Drag the marker to whichever part of the photo should stay visible when it's cropped smaller elsewhere.
        </div>
        <div className="photo-position-picker__stage-row">
          <div className="photo-position-picker__stage-wrap">
            <img
              ref={imgRef}
              src={photo}
              alt=""
              draggable={false}
              className="photo-position-picker__stage"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
            <div className="photo-position-picker__marker" style={{ left: `${focalX * 100}%`, top: `${focalY * 100}%` }} />
          </div>
        </div>
        <div className="photo-position-picker__preview-label">Preview (recipe page)</div>
        <div className="photo-position-picker__preview" style={{ backgroundImage: `url('${photo}')`, backgroundPosition: `${focalX * 100}% ${focalY * 100}%` }} />
        <div className="filter-overlay__footer">
          <button type="button" className="btn btn-ghost btn-block" onClick={() => onChange(0.5, 0.5)}>Reset to center</button>
          <button type="button" className="btn btn-primary btn-block" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

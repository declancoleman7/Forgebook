// Same path data as ICONS in the old js/app.js, ported as-is.
const PATHS = {
  home: '<path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />',
  book: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z" /><path d="M18 4v16" />',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z" />',
  paintdrop: '<path d="M12 3c4 5 7 8.5 7 12a7 7 0 0 1-14 0c0-3.5 3-7 7-12z" />',
  settings: '<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />',
  search: '<circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />',
  back: '<path d="M15 18l-6-6 6-6" />',
  edit: '<path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />',
  trash: '<path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />',
  chevron: '<path d="M9 18l6-6-6-6" />',
  plus: '<path d="M12 5v14" /><path d="M5 12h14" />',
  download: '<path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" />',
  upload: '<path d="M12 21V9" /><path d="M7 14l5-5 5 5" /><path d="M5 3h14" />',
  image: '<rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5-5-6 6-3-3-4 4" />',
  check: '<path d="M5 12l5 5L20 6" />',
  cart: '<circle cx="9" cy="20" r="1.4" fill="currentColor" /><circle cx="18" cy="20" r="1.4" fill="currentColor" /><path d="M2 3h3l2.5 12h11l2-8H6" />',
  filter: '<path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" />',
  flag: '<path d="M5 21V4" /><path d="M5 4h13l-3 4 3 4H5" />',
  user: '<circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />',
  bell: '<path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 6.5H4.5C4.5 15.5 6 14 6 10Z" /><path d="M10 19a2 2 0 0 0 4 0" />',
  'thumb-up': '<path d="M7 11v9H4v-9h3z" /><path d="M7 11l3.5-7c1.2 0 2 1 2 2.2V9h5.5a2 2 0 0 1 2 2.4l-1.2 6A2 2 0 0 1 17 19H9a2 2 0 0 1-2-2v-6z" />',
  'thumb-down': '<path d="M17 13V4h3v9h-3z" /><path d="M17 13l-3.5 7c-1.2 0-2-1-2-2.2V15H6a2 2 0 0 1-2-2.4l1.2-6A2 2 0 0 1 7 5h8a2 2 0 0 1 2 2v6z" />',
  comment: '<path d="M4 5h16v11H8l-4 4V5z" />',
  grid: '<rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />',
  x: '<path d="M6 6l12 12" /><path d="M18 6L6 18" />',
  'clipboard-check': '<rect x="5" y="4" width="14" height="17" rx="2" /><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M9 13l2 2 4-4" />',
};

export default function Icon({ name, size = 20, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: PATHS[name] || '' }}
    />
  );
}

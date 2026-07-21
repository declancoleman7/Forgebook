import { emblemPaths } from '../data/factions.js';

export default function EmblemSvg({ emblemKey, size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none"
      dangerouslySetInnerHTML={{ __html: emblemPaths(emblemKey) }} />
  );
}

import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import { detectMentionTrigger } from '../utils/mentions.js';
import { useSearchProfiles } from '../queries/useSocial.js';

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// A plain textarea plus an "@" autocomplete dropdown -- ported from the old
// app's detectMentionTrigger()/mentionDropdownHtml()/pick-mention handling.
// Controlled like a normal textarea (value/onChange fire a synthetic
// {target:{value}} on every change, including a picked mention), so it
// drops into an existing composer with no other changes needed.
export default function MentionTextarea({ value, onChange, textareaRef, ...rest }) {
  const [trigger, setTrigger] = useState(null); // {start, query} | null
  const debouncedQuery = useDebouncedValue(trigger?.query || '', 250);
  const { data: results = [] } = useSearchProfiles(debouncedQuery);

  const handleChange = (e) => {
    onChange(e);
    setTrigger(detectMentionTrigger(e.target.value, e.target.selectionStart));
  };

  const pick = (name) => {
    const { start, query } = trigger;
    const end = start + 1 + query.length;
    const next = value.slice(0, start) + '@' + name + ' ' + value.slice(end);
    onChange({ target: { value: next } });
    setTrigger(null);
    requestAnimationFrame(() => textareaRef?.current?.focus());
  };

  // Only shows once the debounced search has actually caught up to what's
  // currently typed -- otherwise a fast typist briefly sees stale results
  // for a shorter, already-superseded query.
  const showDropdown = trigger?.query && trigger.query === debouncedQuery && results.length > 0;

  return (
    <div style={{ position: 'relative' }}>
      <textarea ref={textareaRef} value={value} onChange={handleChange} {...rest} />
      {showDropdown && (
        <div className="mention-dropdown">
          {results.map((p) => (
            <div key={p.userId} className="mention-dropdown__item" onClick={() => pick(p.displayName)}>
              <Avatar displayName={p.displayName} url={p.avatarUrl} size={22} />
              <span>{p.displayName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

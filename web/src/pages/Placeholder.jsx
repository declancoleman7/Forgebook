import { useParams } from 'react-router-dom';

// Stage 1 stand-in for every real page -- proves the route/param/shell
// wiring works. Stage 3 replaces each of these with the real ported view.
export default function Placeholder({ title }) {
  const params = useParams();
  return (
    <div className="page-enter">
      <div className="page-title">{title}</div>
      <div className="detail-sub">
        Stage 3 will build the real page here.
        {Object.keys(params).length > 0 && <> Params: {JSON.stringify(params)}</>}
      </div>
    </div>
  );
}

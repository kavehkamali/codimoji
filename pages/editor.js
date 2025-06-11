import { useEffect, useRef } from 'react';
import MapEditor from '../components/MapEditor';
import TopBar from '../components/TopBar';

export default function Editor({ user, logout }) {
  const containerRef = useRef(null);

  if (!user) {
    return <div className="container">Please log in to access the editor.</div>;
  }

  return (
    <div id="container" ref={containerRef} className="container">
      <TopBar user={user} logout={logout} />
      <MapEditor />
    </div>
  );
}
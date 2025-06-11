import Link from 'next/link';

export default function TopBar({ user, logout }) {
  return (
    <div className="top-bar">
      <div className="top-bar-nav">
        <Link href="/" className="top-bar-btn">
          Game
        </Link>
        <Link href="/editor" className="top-bar-btn">
          Editor
        </Link>
      </div>
      
      <div className="top-bar-nav">
        {user && (
          <>
            <span className="text-sm text-gray-400">
              Welcome, {user.username}
            </span>
            <button onClick={logout} className="top-bar-btn">
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
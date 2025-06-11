import Link from 'next/link';

export default function NavMenu({ user, logout }) {
  return (
    <div className="navMenu">
      <Link href="/">Game</Link>
      <Link href="/editor">Editor</Link>
      {user && <button onClick={logout} className="logoutButton">Logout</button>}
    </div>
  );
}
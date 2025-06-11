import '../styles/globals.css';
import { useState, useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username] && users[username].password === password) {
      const currentUser = { username };
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
      return true;
    }
    return false;
  };

  const signup = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[username]) {
      users[username] = { password };
      localStorage.setItem('users', JSON.stringify(users));
      const currentUser = { username };
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('maps'); // Clear maps on logout
  };

  return <Component {...pageProps} user={user} login={login} signup={signup} logout={logout} />;
}

export default MyApp;
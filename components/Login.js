import { useState } from 'react';

export default function Login({ login }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const success = login(username, password);
    if (!success) {
      setError('Invalid username or password');
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }

    // Simple signup - store in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
      setError('Username already exists');
      return;
    }

    users[username] = { password };
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login after signup
    const success = login(username, password);
    if (!success) {
      setError('Signup failed');
    }
  };

  return (
    <div className="auth-form">
      <h2>{showSignup ? 'Create Account' : 'Welcome Back'}</h2>
      
      <form onSubmit={showSignup ? handleSignup : handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            autoFocus
          />
        </div>
        
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </div>
        
        {error && (
          <div className="text-red-400 text-sm mb-4 text-center">
            {error}
          </div>
        )}
        
        <button type="submit" className="form-btn">
          {showSignup ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setShowSignup(!showSignup);
            setError('');
          }}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {showSignup 
            ? 'Already have an account? Sign in' 
            : "Don't have an account? Sign up"
          }
        </button>
      </div>
    </div>
  );
}
import { useState } from 'react';
import './Forms.css';
import { login } from '@/functions/client/auth.js';
import Button from '@/components/Elements/Buttons/Button';

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login({ email, password });
      
      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          // Check for redirect parameter
          const urlParams = new URLSearchParams(window.location.search);
          const redirectPath = urlParams.get('redirect');
          
          if (redirectPath) {
            // Redirect to the original destination
            window.location.href = redirectPath;
          } else {
            // Default redirect to profile page
            window.location.href = '/account/profile';
          }
        }
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error during login', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="form__inputs">
          <div className="form__input">
            <label htmlFor="email">
              Email Address <span className="required-asterisk">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form__input">
            <label htmlFor="password">
              Password <span className="required-asterisk">*</span>
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          label="Sign In"
          loading={loading}
          disabled={loading}
        />
      </form>

      <div>
        <p><a href="/account/forgot">Forgot Password?</a></p>
        <p>
          <a
            href={(() => {
              const params = new URLSearchParams(window.location.search);
              const redirect = params.get('redirect');
              return redirect ? `/account/activate?redirect=${encodeURIComponent(redirect)}` : '/account/activate';
            })()}
          >
            Activate New Account
          </a>
        </p>
      </div>
     
    </>
  );
}

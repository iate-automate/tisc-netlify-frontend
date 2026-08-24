import { useState } from 'react';
import './Forms.css';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase/client';
import Button from '@/components/Elements/Buttons/Button';

interface ForgotFormProps {
  onSuccess?: () => void;
}

export default function ForgotForm({ onSuccess }: ForgotFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
      setEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle Firebase Auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as any;
        switch (firebaseError.code) {
          case 'auth/user-not-found':
            setError('No account found with this email address. Please check your email or try activating your account.');
            break;
          case 'auth/invalid-email':
            setError('Please enter a valid email address.');
            break;
          case 'auth/too-many-requests':
            setError('Too many password reset attempts. Please try again later.');
            break;
          default:
            setError('Failed to send password reset email. Please try again.');
        }
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="form__fields">
          <div className="form__input">
                <label htmlFor="email">
                  Email Address <span className="required-asterisk">*</span>
                </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

        {success && (
          <div style={{ color: 'green', marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          label="Send Reset Email"
          loading={loading}
          disabled={loading}
        />
      </form>

      <p>
        <a href="/account/signin">Back to Sign In</a> | 
        <a
          href={(() => {
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get('redirect');
            return redirect ? `/account/activate?redirect=${encodeURIComponent(redirect)}` : '/account/activate';
          })()}
        >
          Activate Account
        </a>
      </p>
    </>
  );
}

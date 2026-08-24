import { useState } from 'react';
import { activateAccount } from '@/functions/client/auth.js';
import settings from '@/settings'
import Button from '@/components/Elements/Buttons/Button';
import './Forms.css';

interface ActivateFormProps {
  onSuccess?: () => void;
}

export default function ActivateForm({ onSuccess }: ActivateFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');


    // Client-side validation to catch autofill issues
    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    if (!confirmPassword.trim()) {
      setError('Please confirm your password');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (!activationKey.trim()) {
      setError('Activation key is required');
      setLoading(false);
      return;
    }

    try {
      const result = await activateAccount({ 
        email: email.trim(), 
        password: password.trim(), 
        portalActivationKey: activationKey.trim()
      });
      
      if (result.success) {
        setSuccess(result.message || 'Account activated successfully! Refreshing...');
        
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            // Redirect to intended destination if provided, else profile
            const urlParams = new URLSearchParams(window.location.search);
            const redirectPath = urlParams.get('redirect');
            window.location.href = redirectPath || '/account/profile';
          }
        }, 1500);
      } else {
        setError(result.error || 'Activation failed. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error during activation', error);
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form__input">
            <label htmlFor="confirmPassword">
              Confirm Password <span className="required-asterisk">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form__input">
            <label htmlFor="activationKey">
              Activation Key <span className="required-asterisk">*</span>
            </label>
            <input
              id="activationKey"
              type="text"
              placeholder="Enter your activation key"
              value={activationKey}
              onChange={(e) => setActivationKey(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {success && (
          <div className="success">
            {success}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          label="Activate Account"
          loading={loading}
          disabled={loading}
        />
      </form>

    <div>
      <p><a href={settings.global.siteContact} target="_blank">Request activation key</a></p>
      <p><a href="/account/signin">Existing users login</a></p>
    </div>
     
    </>
  );
}

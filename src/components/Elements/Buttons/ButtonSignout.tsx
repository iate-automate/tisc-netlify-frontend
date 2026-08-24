import React from 'react'
import './Button.css'
import { ButtonProps } from '@/types/index'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/client'

export default function ButtonSignout({ 
  variant = 'primary', 
  style,
  className 
}: ButtonProps) {
  const handleSignOut = async () => {
    try {
      // Clear server-side session cookie first
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Then sign out from Firebase Auth
      await signOut(auth);
      
      // Clear any remaining TISUK cookies manually (though HttpOnly cookies can't be cleared this way)
      document.cookie = '__tisuk_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = '__tisuk_session_dev=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Wait a moment then redirect to sign-in form
      setTimeout(() => {
        window.location.href = '/account/signin';
      }, 100);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  return (
    <button 
      className={`btn btn-${variant} ${className || ''}`}
      onClick={handleSignOut}
      style={style}
    >
      Sign Out
    </button>
  )
}

import React from 'react'
import './Button.css'
import { ButtonProps } from '@/types/index'

export default function Button({ 
  variant = 'primary', 
  label, 
  style, 
  className, 
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  ...rest 
}: ButtonProps & { type?: 'button' | 'submit' | 'reset'; disabled?: boolean }) {
  const buttonClasses = `btn btn-${variant} ${className || ''}`.trim()

  return (
    <button
      type={type}
      className={buttonClasses}
      style={style}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <i className="icon fa-solid fa-loader fa-spin"></i>
      ) : (
        label
      )}
    </button>
  )
}

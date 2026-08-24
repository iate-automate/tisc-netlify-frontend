import React from 'react'
import './Button.css'
import { ButtonBackProps } from '@/types/index'

export default function ButtonBack({variant, label, style, href}: ButtonBackProps) {

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!href) {
            e.preventDefault()
            window.history.back()
        }
    }

    const getClassName = () => {
        if (style === 'button') {
            return `btn btn-${variant || 'primary'}`
        }
        if (style === 'breadcrumb') {
            return 'btn-back-breadcrumb'
        }
        return ''
    }

    return (
        <a
            href={href || '#'}
            className={getClassName()}
            onClick={handleClick}
        >{label}</a>
    );
}

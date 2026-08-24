import React from 'react'
import './Button.css'

export default function ButtonBack({variant, label, style}) {

    return (
        <a
            href="#"
            className={style === 'button' ? `btn btn-${variant}` : ''}
            onClick={(e) => {
                e.preventDefault()
                window.history.back()
            }}
        >{label}</a>
    );
}

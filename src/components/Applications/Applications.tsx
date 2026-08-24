import { useState } from 'react'
import { toHtml } from '@/functions/server/utils'
import type { ApplicationsProps } from '@/types/index.js'
import './Applications.css'

export default function Applications({
    id, 
    name, 
    role, 
    email, 
    phone, 
    org, 
    responses, 
    trauma
}: ApplicationsProps) {

    const [expanded, setExpanded] = useState(false)

    const handleToggle = () => {
        setExpanded(!expanded)
    }

    return (
        <div key={id} className={`applications ${expanded ? "applications-expanded" : ""}`} onClick={handleToggle}>
            <div className="applications-header">
                <div className="applications-icon-wrapper"><i className="icon fa-regular fa-plus"></i></div>
                <h3>{name}{trauma && <i className="trauma-icon fa-regular fa-check"></i>}</h3>
            </div>
            <div className="applications-summary">
                <div className="applications-summary-content">
                    {(email) &&
                    <div className="applications-summary-content-info">
                        <div><strong>Role</strong></div>
                        <div>{role}</div>
                        <div><strong>Organisation</strong></div>
                        <div>{org}</div>
                        <div><strong>Email</strong></div>
                        <div><a href={`mailto:${email}`}>{email}</a></div>
                        <div><strong>Phone</strong></div>
                        <div>{phone}</div>
                    </div>}
                    <div className="applications-summary-content-responses" dangerouslySetInnerHTML={{__html: toHtml(responses)}} />
                    {(trauma) &&
                    <div className="applications-summary-content-trauma">
                        <h4>Have you had any previous experience of trauma?</h4>
                        <div dangerouslySetInnerHTML={{__html: toHtml(trauma)}} />
                    </div>
                    }
                </div>
            </div>
        </div>
    )
}

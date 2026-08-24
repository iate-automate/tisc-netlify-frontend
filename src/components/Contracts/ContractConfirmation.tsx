import { useState } from 'react'
import Button from '@/components/Elements/Buttons/Button'
import '@/components/Forms/Forms.css'

interface Props {
    applicationRecordId: string
    initialSigned?: boolean
}

export default function ContractConfirmation({
    applicationRecordId,
    initialSigned = false,
}: Props) {
    const [signed, setSigned] = useState<boolean>(initialSigned)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const handleConfirm = async () => {
        if (loading || signed) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/contracts/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ applicationRecordId }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                const message = data?.error || 'Failed to confirm contract.'
                throw new Error(message)
            }

            setSigned(true)
        } catch (err: any) {
            setError(err?.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="contract-confirmation">
            {signed ? (
                <div>
                    <div className="success">
                        <h2>Contract successfully signed.</h2>
                    </div>
                    <Button
                        variant="primary"
                        label="Print / Save as PDF"
                        onClick={handlePrint}
                        className="contract-print-button"
                        style={{ marginTop: 'var(--margin-small)' }}
                    />
                </div>
            ) : (
                <>
                    <Button
                        label="I agree to these terms"
                        variant="primary"
                        onClick={handleConfirm}
                        loading={loading}
                        disabled={loading}
                        style={{ minWidth: '200px' }}
                    />
                    {error && (
                        <div>
                            <span className="error">
                                {error}
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}


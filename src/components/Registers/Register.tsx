import { useState } from 'react'
import Button from '@/components/Elements/Buttons/Button'
import { prettyDate } from '@/functions/server/utils'
import { updateRegisters } from '@/functions/client/courses.js'
import type { 
  AttendanceRegisterProps, 
  AttendanceStatus, 
  AttendanceStatuses,
  RegisterUpdateData,
  AirtableRegister,
  AirtableCourseDay
} from '@/types/index.js'
import './Register.css'

export default function AttendanceRegister({ courseId, days, registers }: AttendanceRegisterProps) {
  
    // Sort registers by first name
    const sortedRegisters = (registers && registers
        .filter((register: AirtableRegister) => {
            if (!register["Feed Name"] || register["Feed Name"].trim() === "") {
                console.warn("Skipping register with missing Feed Name:", register["Register Record ID"])
                return false
            }
            return true
        })
        .sort((a: AirtableRegister, b: AirtableRegister) => a["Feed Name"].localeCompare(b["Feed Name"]))
    ) || []

    const [attendanceStatuses, setAttendanceStatuses] = useState<AttendanceStatuses>({})
    const [notes, setNotes] = useState<string>("")
    const [day, setDay] = useState<number>(1)
    const [feedback, setFeedback] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)

    return (
        <div className="grid register">

            <div className="form__input day-selector">
                <label htmlFor="day">
                Please select a day
                </label>
                <select name="day" onChange={handleDaySelect} value={day}>
                {days.map((dayObj: AirtableCourseDay) => (
                    <option key={dayObj["Day No."]} value={dayObj["Day No."]}>
                    Day {dayObj["Day No."]} — {prettyDate(dayObj["Date"])}
                    </option>
                ))}
                </select>
            </div>

            <div className="register__entries">
                {registers ? (
                <>
                    <h2>Delegates</h2>
                    <div className="register__delegates">
                    {sortedRegisters.map((register: AirtableRegister) => {
                        // Check if the delegate has a record for the selected day
                        if (register[day.toString() as keyof AirtableRegister]) {
                        // Determine the current status:
                        // Use the state value (if updated) or fall back to the existing value in the register.
                        const currentStatus: AttendanceStatus =
                            attendanceStatuses[register["Register Record ID"]] ||
                            (register[day.toString() as keyof AirtableRegister] as AttendanceStatus) ||
                            "E"
                        return (
                            <div
                            className="register__delegate"
                            key={register["Register Record ID"]}
                            >
                            <h3 className="delegate-name">
                                {register["Feed Name"]}
                            </h3>
                            <select
                                name="attendance"
                                value={currentStatus}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                handleAttendanceChange(e, register["Register Record ID"])
                                }
                                // If the current register value is "X" (or whatever your logic requires),
                                // you might want to disable changes.
                                disabled={register[day.toString() as keyof AirtableRegister] === "X"}
                            >
                                {/* Adjust these options as needed for your business logic */}
                                <option value="E">---</option>
                                <option value="A">Full</option>
                                <option value="P">Partial</option>
                                <option value="X">Absent</option>
                            </select>
                            </div>
                        )
                        }
                        return null
                    })}
                    </div>

                    <div className="register__notes">
                        <h3 id="notes-heading">Notes</h3>
                        <textarea
                            id="notes"
                            aria-labelledby='notes-heading'
                            rows={4}
                            value={notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                            placeholder="Enter notes about delegates' attendance here"
                        />
                    </div>

                    {(!feedback && !loading) && (
                    <Button
                        variant="primary"
                        label="Submit Register"
                        loading={loading}
                        disabled={loading}
                        onClick={handleConfirm}
                    />
                    )}
                    <div className="btn-register-feedback">
                        {loading ? "Updating..." : feedback}
                    </div>
                </>
                ) : (
                <p>Looks like no one is registered on this day!</p>
                )}
            </div>

        </div>
    )

    // --------- Functions

    function handleDaySelect(e: React.ChangeEvent<HTMLSelectElement>) {
        setDay(parseInt(e.target.value))
        setAttendanceStatuses({})
        setFeedback(null)
    }

    function handleAttendanceChange(e: React.ChangeEvent<HTMLSelectElement>, id: string) {
        const newStatus = e.target.value as AttendanceStatus
        setAttendanceStatuses((prev) => ({ ...prev, [id]: newStatus }))
        setFeedback(null)
    }

    async function handleConfirm() {
        setLoading(true)
        const registersPayload = Object.entries(attendanceStatuses).map(
            ([id, status]) => ({
                id,
                day: day.toString(),
                status,
            })
        )

        // Add the Notes to the payload
        const data: RegisterUpdateData = {
            courseId,
            courseDay: day,
            registers: registersPayload,
            notes: notes.trim(),
        }

        if (registersPayload.length === 0) {
            setFeedback("Sorry, you can only add attendance to the register.")
            setLoading(false)
            return
        }

        // Send Payload to API
        const res = await updateRegisters(data)
        console.log(res.message)
        setFeedback(res.message || 'Update completed')
        setLoading(false)
    }

}

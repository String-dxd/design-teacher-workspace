// 15-minute time slots, 7am–10pm — the one convention for every time picker
// (Posts scheduling, HDP send-to-parents, event times). meetings.new.tsx has
// its own copy pre-dating this module.

export interface TimeSlot {
  value: string // 'HH:mm'
  label: string // 'h:mm AM/PM'
}

export function buildTimeSlots(): Array<TimeSlot> {
  const slots: Array<TimeSlot> = []
  for (let min = 7 * 60; min <= 22 * 60; min += 15) {
    const h = Math.floor(min / 60)
    const m = min % 60
    const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    const period = h < 12 ? 'AM' : 'PM'
    slots.push({
      value,
      label: `${h12}:${String(m).padStart(2, '0')} ${period}`,
    })
  }
  return slots
}

export const TIME_SLOTS = buildTimeSlots()

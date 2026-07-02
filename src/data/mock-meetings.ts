export interface MeetingDay {
  date: string // YYYY-MM-DD
  startTime: string // HH:MM 24-hour
  endTime: string // HH:MM 24-hour
}

export interface MeetingEvent {
  id: string
  title: string
  description: string
  venue?: string
  meetingDays: MeetingDay[]
  durationMinutes: number
  maxPerSlot: number
  bookingOpens: string // ISO datetime string
  bookingCloses: string // ISO datetime string
  enquiryEmail: string
  invitedCount: number
  available: number
  booked: number
  pending: number
}

export const mockMeetings: MeetingEvent[] = [
  {
    id: 'm-1',
    title: 'Parent Teaching Day',
    description:
      'Annual parent-teacher conference for Secondary 3 classes. Please arrive 5 minutes before your scheduled slot.',
    meetingDays: [
      { date: '2026-06-25', startTime: '08:00', endTime: '12:00' },
      { date: '2026-06-26', startTime: '08:00', endTime: '12:00' },
      { date: '2026-07-03', startTime: '08:00', endTime: '12:00' },
    ],
    durationMinutes: 60,
    maxPerSlot: 1,
    bookingOpens: '2026-06-10T08:00:00',
    bookingCloses: '2026-06-24T23:59:00',
    enquiryEmail: 'sandwich_pri@moe.edu.sg',
    invitedCount: 12,
    available: 9,
    booked: 0,
    pending: 12,
  },
  {
    id: 'm-2',
    title: 'Test Pref (10 Mins, 15 Day, 3 slots)',
    description: 'Test meeting event with multiple days.',
    meetingDays: Array.from({ length: 15 }, (_, i) => {
      const d = new Date('2026-07-03T00:00:00')
      d.setDate(d.getDate() + i)
      return {
        date: d.toISOString().slice(0, 10),
        startTime: '08:00',
        endTime: '22:00',
      }
    }),
    durationMinutes: 10,
    maxPerSlot: 3,
    bookingOpens: '2026-06-20T08:00:00',
    bookingCloses: '2026-07-02T23:59:00',
    enquiryEmail: 'sandwich_pri@moe.edu.sg',
    invitedCount: 23,
    available: 6480,
    booked: 0,
    pending: 23,
  },
  {
    id: 'm-3',
    title: 'PSLE Results Day',
    description:
      'Consultation session for PSLE results with homeroom teacher.',
    meetingDays: [
      { date: '2026-07-03', startTime: '09:00', endTime: '10:00' },
      { date: '2026-07-04', startTime: '09:00', endTime: '10:00' },
    ],
    durationMinutes: 15,
    maxPerSlot: 3,
    bookingOpens: '2026-06-25T08:00:00',
    bookingCloses: '2026-07-02T23:59:00',
    enquiryEmail: 'sandwich_pri@moe.edu.sg',
    invitedCount: 1,
    available: 24,
    booked: 0,
    pending: 1,
  },
  {
    id: 'm-4',
    title: 'End of Term Consultation',
    description:
      'End of term parent-teacher consultation to review student progress for Semester 1.',
    venue: 'School Hall',
    meetingDays: [
      { date: '2026-05-10', startTime: '08:00', endTime: '12:00' },
    ],
    durationMinutes: 30,
    maxPerSlot: 1,
    bookingOpens: '2026-04-28T08:00:00',
    bookingCloses: '2026-05-09T23:59:00',
    enquiryEmail: 'sandwich_pri@moe.edu.sg',
    invitedCount: 28,
    available: 0,
    booked: 18,
    pending: 0,
  },
]

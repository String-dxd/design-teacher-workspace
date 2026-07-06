import type { Announcement } from '@/types/announcement'

// Helper to create dates relative to now
const now = new Date()
const today = (hours: number, minutes: number) => {
  const d = new Date(now)
  d.setHours(hours, minutes, 0, 0)
  return d
}
const daysAgo = (days: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  d.setHours(9, 0, 0, 0)
  return d
}

export const mockAnnouncements: Array<Announcement> = [
  {
    id: '1',
    title: 'Lee Kuan Yew Award for All-Round Excellence (Secondary)',
    description:
      'It recognises well-rounded students who have excelled in both academic and non-academic spheres.',
    content: `It recognises well-rounded students who have excelled in both academic and non-academic spheres.

The Lee Kuan Yew Award for All-Round Excellence (Secondary) is presented annually to students who have demonstrated exceptional achievement across multiple domains including:

- Academic excellence
- Leadership qualities
- Community service
- Co-curricular activities
- Character development

Eligibility Criteria:
1. Students must be in Secondary 3 or 4
2. Minimum GPA of 3.5
3. Active participation in at least one CCA
4. Demonstrated leadership in school or community
5. Good conduct and character

Nomination Process:
Teachers may nominate deserving students by submitting the nomination form along with supporting documents by 31 January 2026.

For more information, please contact the Student Development Office.`,
    createdAt: today(10, 0),
    isRead: false,
  },
  {
    id: '2',
    title:
      'Updates to Postgraduate Diploma in Education (PGDE) Programme Fees for Teachers in Independent Schools/ Specialised Independent Schools/ Specialised Schools',
    description:
      'The training programme provided by the National Institute of Education (NIE) aims to equip you with the knowledge and skills to teach school subjects and better understand the teaching profession in...',
    content: `The training programme provided by the National Institute of Education (NIE) aims to equip you with the knowledge and skills to teach school subjects and better understand the teaching profession in Singapore.

Key Updates for 2026:

1. Programme Fee Structure
   - Full-time PGDE: $12,000 (subsidised)
   - Part-time PGDE: $14,000 (subsidised)
   - International students: $24,000

2. Subsidy Information
   Teachers from Independent Schools, Specialised Independent Schools, and Specialised Schools are eligible for MOE subsidy covering up to 80% of programme fees.

3. Application Timeline
   - Application opens: 1 February 2026
   - Application closes: 31 March 2026
   - Programme commencement: July 2026

4. Required Documents
   - Updated resume
   - Academic transcripts
   - Principal's recommendation letter
   - Personal statement

Please submit your applications through the NIE portal. For enquiries, contact the NIE Admissions Office at nie-admissions@nie.edu.sg.`,
    createdAt: today(9, 0),
    isRead: false,
  },
  {
    id: '3',
    title: '2026 Contract Adjunct Teachers (CAJT) Job Application Exercise',
    description:
      'There are two primary schemes for adjunct teaching in MOE schools, each with a different application process.',
    content: `There are two primary schemes for adjunct teaching in MOE schools, each with a different application process.

Scheme 1: Relief Teaching
- Short-term assignments (1-3 months)
- Covers teacher absences due to leave, training, etc.
- Flexible scheduling
- Rate: $50-80 per hour depending on qualifications

Scheme 2: Contract Adjunct Teaching
- Longer-term assignments (6-12 months)
- Covers vacancies and additional teaching needs
- Fixed schedule
- Monthly salary based on experience and qualifications

Application Requirements:
1. Minimum diploma qualification
2. Relevant subject knowledge
3. Clear background check
4. Attend interview and teaching demonstration

How to Apply:
1. Visit careers.gov.sg
2. Search for "Contract Adjunct Teacher"
3. Submit online application with required documents
4. Shortlisted candidates will be contacted for interview

Application Period: 15 January - 28 February 2026

For more information, please visit the MOE Careers website or contact your cluster HR representative.`,
    createdAt: daysAgo(1),
    isRead: false,
  },
  {
    id: '4',
    title: 'Professional Development Week 2026 - Registration Now Open',
    description:
      'Join us for a week of learning and growth with workshops, seminars, and networking opportunities for all educators.',
    content: `Join us for a week of learning and growth with workshops, seminars, and networking opportunities for all educators.

Professional Development Week 2026
Date: 10-14 March 2026
Venue: Various locations across Singapore

Highlights:
- 50+ workshops across all subject areas
- Keynote speakers from local and international education institutions
- Networking sessions with fellow educators
- Exhibition of latest educational technologies

Registration Deadline: 20 February 2026

Workshop Categories:
1. Curriculum & Pedagogy
2. Educational Technology
3. Student Well-being
4. Assessment & Feedback
5. Leadership & Management

Note: Teachers may register for up to 3 workshops. Priority will be given based on relevance to teaching assignment.

Register now at pdweek.moe.edu.sg`,
    createdAt: daysAgo(3),
    isRead: true,
  },
  {
    id: '5',
    title: 'Updated Guidelines for Student Learning Space (SLS) Usage',
    description:
      'New features and updated guidelines for effective use of the Student Learning Space platform.',
    content: `New features and updated guidelines for effective use of the Student Learning Space platform.

What's New in SLS 2.0:
1. Enhanced AI-powered learning recommendations
2. Improved assignment management tools
3. Real-time collaboration features
4. Better analytics dashboard

Updated Usage Guidelines:
- All assignments should be uploaded at least 3 days before due date
- Use the new feedback tools for timely student feedback
- Leverage the analytics to identify students needing support
- Regular backup of custom resources recommended

Training Sessions:
Free training sessions are available every Tuesday from 3-4pm. Register via the SLS portal.

Support:
For technical issues, contact helpdesk@sls.moe.edu.sg`,
    createdAt: daysAgo(5),
    isRead: true,
  },
  {
    id: '6',
    title: 'Reminder: Mid-Year Assessment Schedule',
    description:
      'Important dates and guidelines for the upcoming mid-year assessments across all levels.',
    content: `Important dates and guidelines for the upcoming mid-year assessments across all levels.

Assessment Period: 15-26 May 2026

Key Dates:
- Sec 1: 15-19 May
- Sec 2: 15-19 May
- Sec 3: 20-24 May
- Sec 4/5: 20-26 May

Guidelines for Teachers:
1. Submit exam papers by 15 April 2026
2. Vetting to be completed by 30 April 2026
3. Invigilation duties will be assigned by 1 May 2026

Special Arrangements:
Students with approved special needs accommodations should be flagged to the Exam Committee by 1 April 2026.

Contact the Exam Committee for any queries.`,
    createdAt: daysAgo(8),
    isRead: true,
  },
  {
    id: '7',
    title: 'School Closure for Voting Day - 15 January 2026',
    description:
      'School will be closed on 15 January 2026 as the premises will be used as a voting station.',
    content: `School will be closed on 15 January 2026 as the premises will be used as a voting station.

Important Information:
- No school activities on 15 January 2026
- All CCAs and remedial classes cancelled
- Staff not involved in election duties may work from home
- School resumes normal operations on 16 January 2026

For Staff on Election Duty:
- Report to assigned polling station by 6:30 AM
- Bring your appointment letter and IC
- Meals will be provided

Please ensure all students and parents are informed.`,
    createdAt: daysAgo(14),
    isRead: true,
  },
  {
    id: '8',
    title: 'New Mental Health Resources for Educators',
    description:
      'Access new support resources and counselling services available for all MOE educators.',
    content: `Access new support resources and counselling services available for all MOE educators.

We understand that teaching can be demanding. MOE has partnered with several counselling services to provide support for our educators.

Available Resources:
1. Employee Assistance Programme (EAP)
   - 24/7 hotline: 1800-XXX-XXXX
   - Up to 6 free counselling sessions per year

2. Mindfulness & Wellness App
   - Free subscription for all MOE staff
   - Download from app stores using your MOE email

3. Peer Support Network
   - Connect with trained peer supporters in your cluster
   - Confidential and judgment-free conversations

4. Professional Counselling
   - Referral through HR for longer-term support
   - Fully covered under staff benefits

Remember: Seeking help is a sign of strength. Take care of yourself so you can take care of your students.`,
    createdAt: daysAgo(21),
    isRead: true,
  },
  {
    id: '9',
    title: 'Annual Staff Retreat - Save the Date',
    description:
      'Mark your calendars for the annual staff retreat happening in June 2026.',
    content: `Mark your calendars for the annual staff retreat happening in June 2026.

Event Details:
- Date: 5-6 June 2026
- Venue: Sentosa (exact location TBC)
- Theme: "Growing Together"

What to Expect:
- Team building activities
- Wellness workshops
- Appreciation dinner
- Lucky draw with attractive prizes

More details will be shared in April. Start thinking about your retreat buddy!`,
    createdAt: daysAgo(35),
    isRead: true,
  },
]

export function getUnreadCount(): number {
  return mockAnnouncements.filter((a) => !a.isRead).length
}

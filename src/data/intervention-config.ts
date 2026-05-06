import type { Student } from '@/types/student'

export type AccentColor = 'purple' | 'blue' | 'amber' | 'orange' | 'rose'

export interface InterventionAction {
  text: string
  cta?: { label: string; href?: string }
}

export interface InterventionResource {
  type: 'glow' | 'article' | 'course'
  title: string
  duration: string
  href?: string
}

export interface InterventionPackage {
  id: string
  color: AccentColor
  badge: string
  title: string
  why: string
  actions: Array<InterventionAction>
  resources: Array<InterventionResource>
}

interface InterventionRule {
  trigger: (student: Student) => boolean
  buildPackage: (student: Student) => InterventionPackage
}

export const interventionRules: Array<InterventionRule> = [
  // SEN / SwAN
  {
    trigger: (s) => s.attentionTags.includes('SwAN'),
    buildPackage: (s) => ({
      id: 'sen',
      color: 'purple',
      badge: 'Special Educational Need',
      title: `${s.sen ? `${s.sen} — ` : ''}Differentiated Support Needed`,
      why: `This student has a Special Educational Need${s.sen ? ` (${s.sen})` : ''}. Interventions, expectations, and communication style should be adjusted to their learning profile — not because they can't achieve, but because they need a different path to get there.`,
      actions: [
        {
          text: 'Do an individual check-in to understand current barriers (e.g., keeping up with instructions, peer dynamics, stress)',
          cta: { label: 'Check-in template', href: '#' },
        },
        {
          text: 'Consult the SEN Officer to align on a differentiated support plan before making adjustments',
          cta: { label: 'SEN Officer contact', href: '#' },
        },
        {
          text: 'Adjust instructions, timing, and expectations in class — small changes can make a big difference',
          cta: { label: 'Differentiation guide', href: '#' },
        },
      ],
      resources: [
        {
          type: 'glow',
          title: 'Understanding SwAN Profiles',
          duration: '4 min',
          href: '#',
        },
        {
          type: 'article',
          title: 'Supporting SEN students in mainstream classrooms',
          duration: '5 min read',
          href: '#',
        },
        {
          type: 'course',
          title: 'Differentiated Instruction for Diverse Learners',
          duration: '20 min',
          href: '#',
        },
      ],
    }),
  },

  // Learning Support (LSM / LSP)
  {
    trigger: (s) =>
      s.attentionTags.includes('LSM') || s.attentionTags.includes('LSP'),
    buildPackage: (s) => {
      const tags = s.attentionTags.filter((t) => t === 'LSM' || t === 'LSP')
      const tagLabel = tags.join(' & ')
      return {
        id: 'learning-support',
        color: 'blue',
        badge: `Learning Support (${tagLabel})`,
        title: 'Academic Scaffolding & Motivation',
        why: `This student is on ${tagLabel}, which means foundational skills in literacy or numeracy need targeted reinforcement. Low academic performance can erode confidence — early and consistent support keeps them engaged.`,
        actions: [
          {
            text: 'Connect with the Learning Support teacher to understand where the student currently is and coordinate your classroom approach',
            cta: { label: 'LS teacher directory', href: '#' },
          },
          {
            text: 'Do a 1:1 check-in focused on learning barriers — what parts of class feel hard or confusing?',
            cta: { label: 'Check-in guide', href: '#' },
          },
          {
            text: 'Provide bite-sized tasks and celebrate small wins to rebuild academic confidence',
          },
        ],
        resources: [
          {
            type: 'glow',
            title: 'Motivating students who have disengaged from learning',
            duration: '3 min',
            href: '#',
          },
          {
            type: 'article',
            title: 'Simple scaffolding strategies any teacher can use',
            duration: '4 min read',
            href: '#',
          },
        ],
      }
    },
  },

  // FAS
  {
    trigger: (s) => s.attentionTags.includes('FAS') || s.fas !== null,
    buildPackage: (s) => ({
      id: 'fas',
      color: 'amber',
      badge: 'Financial Assistance',
      title: 'Welfare Check & Family Support',
      why: `This student is on the Financial Assistance Scheme${s.fas ? ` (${s.fas})` : ''}. Financial stress at home can quietly affect focus, attendance, and mood — a discreet check-in can open doors to support before issues escalate.`,
      actions: [
        {
          text: 'Do a low-key individual check-in on how things are going at home — avoid singling them out',
          cta: { label: 'Conversation guide', href: '#' },
        },
        {
          text: 'Loop in the School Social Worker if you sense broader family stress (housing, employment, caregiver capacity)',
          cta: { label: 'SWO referral form', href: '#' },
        },
        {
          text: 'Check if the student is accessing all entitlements — uniform, transport, meal subsidies',
          cta: { label: 'FAS entitlements list', href: '#' },
        },
      ],
      resources: [
        {
          type: 'glow',
          title: 'How financial stress shows up in student behaviour',
          duration: '3 min',
          href: '#',
        },
        {
          type: 'article',
          title: 'Working effectively with FSC and SWO',
          duration: '5 min read',
          href: '#',
        },
      ],
    }),
  },

  // Long-Term Absence
  {
    trigger: (s) => s.absences >= 10,
    buildPackage: (s) => {
      const severity =
        s.absences >= 40
          ? 'Severe LTA (40+ days)'
          : s.absences >= 20
            ? 'LTA (20–39 days)'
            : 'At-risk attendance (10–19 days)'
      return {
        id: 'lta',
        color: 'orange',
        badge: severity,
        title: `${s.absences} absences — Attendance Follow-up`,
        why: `Persistent absence often signals a barrier the student hasn't been able to voice — anxiety, caregiving responsibilities, peer issues, or disengagement. Early outreach changes the outcome.`,
        actions: [
          {
            text: 'Attempt contact within 24–48 hrs: call both caregivers, SMS/WhatsApp, email; log all attempts',
            cta: { label: 'Contact log template', href: '#' },
          },
          {
            text: 'Do a student check-in when reachable: explore barriers (sleep, anxiety, bullying, transport, caregiving) and agree on one small next step',
            cta: { label: 'Check-in template', href: '#' },
          },
          {
            text: 'Loop in the School Counsellor before considering an FSC referral — assess first',
            cta: { label: 'SC contact', href: '#' },
          },
          {
            text: 'If uncontactable or persistent: initiate home visit per guidelines (go with a colleague; verify before visiting)',
            cta: { label: 'Home visit checklist', href: '#' },
          },
        ],
        resources: [
          {
            type: 'glow',
            title: 'Why students go missing: patterns behind absenteeism',
            duration: '3 min',
            href: '#',
          },
          {
            type: 'article',
            title:
              'Having difficult conversations with parents about attendance',
            duration: '5 min read',
            href: '#',
          },
        ],
      }
    },
  },

  // High Risk Indicators
  {
    trigger: (s) => s.riskIndicators >= 3,
    buildPackage: (s) => ({
      id: 'high-risk',
      color: 'rose',
      badge: `${s.riskIndicators} TCI Risk Indicators`,
      title: 'Multiple Risk Factors — Early Support Recommended',
      why: `This student has ${s.riskIndicators} risk indicators flagged. No single factor is alarming on its own, but the combination suggests this student may be carrying more than they let on. Proactive support now can prevent escalation.`,
      actions: [
        {
          text: 'Arrange a 1:1 check-in in a private, low-pressure setting — focus on listening first',
          cta: { label: 'Check-in guide', href: '#' },
        },
        {
          text: 'Consult the School Counsellor — share your observations and get a read on whether formal support is needed',
          cta: { label: 'SC referral form', href: '#' },
        },
        {
          text: 'Consider a CMT referral if concerns persist beyond 2 weeks',
          cta: { label: 'CMT referral guide', href: '#' },
        },
      ],
      resources: [
        {
          type: 'glow',
          title: 'Reading between the lines: early warning signs',
          duration: '3 min',
          href: '#',
        },
        {
          type: 'article',
          title: 'What teachers should — and should not — carry alone',
          duration: '4 min read',
          href: '#',
        },
      ],
    }),
  },

  // Low Mood
  {
    trigger: (s) => s.lowMoodFlagged !== null,
    buildPackage: (s) => ({
      id: 'low-mood',
      color: 'rose',
      badge: 'Low Mood — 2+ Terms',
      title: 'Persistent Low Mood Flagged',
      why: `Low mood has been flagged for ${s.lowMoodFlagged}. Persistent low mood is different from a bad week — it can signal underlying stress, anxiety, or circumstances at home that a brief check-in can help surface.`,
      actions: [
        {
          text: 'Do a low-key individual check-in — not an interrogation, just a genuine "how are you doing lately?"',
          cta: { label: 'Wellbeing check-in guide', href: '#' },
        },
        {
          text: 'Share your observations with the School Counsellor — even a quick verbal update helps them track patterns',
          cta: { label: 'SC contact', href: '#' },
        },
        {
          text: 'Consider a CMT referral if the low mood persists beyond 2 weeks with no clear explanation',
          cta: { label: 'CMT referral guide', href: '#' },
        },
      ],
      resources: [
        {
          type: 'glow',
          title: 'Stress vs disengagement: how to tell them apart',
          duration: '3 min',
          href: '#',
        },
        {
          type: 'article',
          title: 'When to refer: a practical guide for form teachers',
          duration: '4 min read',
          href: '#',
        },
      ],
    }),
  },
]

export function getInterventions(student: Student): Array<InterventionPackage> {
  return interventionRules
    .filter((rule) => rule.trigger(student))
    .map((rule) => rule.buildPackage(student))
}

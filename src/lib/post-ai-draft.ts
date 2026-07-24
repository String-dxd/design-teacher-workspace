// Shared post-drafting engine — the single source of truth for AI-drafted posts.
//
// Two doorways use it: the composer's in-form "AI Draft" template picker
// (structured fill via `buildPostDraft`) and HeyTalia's chat assistant
// (free-form via `buildTopicDraftBlock`, or a template via `templateDraftBlock`).
// See docs/adr/0001-ai-draft-shared-engine.md — one engine, two delivery paths.

import type { FormQuestion, ResponseType } from '@/types/form'

// ── Templates ───────────────────────────────────────────────────────────────

export type PostTemplateId =
  | 'overseas-learning-trip'
  | 'local-excursion'
  | 'event-notice'
  | 'term-update'

export interface PostTemplate {
  id: PostTemplateId
  name: string
  /** One-line description shown in the picker. */
  description: string
  /** Icon key mapped to a lucide icon by the picker (keeps this module React-free). */
  iconKey: 'plane' | 'map-pin' | 'calendar-days' | 'file-text'
  /** The response type this template is written for. */
  responseKind: ResponseType
}

export const POST_TEMPLATES: Array<PostTemplate> = [
  {
    id: 'overseas-learning-trip',
    name: 'Overseas Learning Trip',
    description:
      'Consent for an overseas learning journey — itinerary, what to bring, deadline.',
    iconKey: 'plane',
    responseKind: 'yes-no',
  },
  {
    id: 'local-excursion',
    name: 'Local Learning Journey',
    description: 'Consent for a local excursion — venue, cost, what to bring.',
    iconKey: 'map-pin',
    responseKind: 'yes-no',
  },
  {
    id: 'event-notice',
    name: 'Event Notice',
    description:
      'Tell parents about an upcoming event and ask them to acknowledge.',
    iconKey: 'calendar-days',
    responseKind: 'acknowledge',
  },
  {
    id: 'term-update',
    name: 'Term Update Letter',
    description:
      'A start-of-term update for parents to read. No response needed.',
    iconKey: 'file-text',
    responseKind: 'view-only',
  },
]

// ── Template content (authored once, rendered to HTML for the composer and to
//    text for the chat draft, so the two doorways never drift). ──────────────

interface TemplateBody {
  title: string
  intro: string
  detailPairs?: Array<[string, string]>
  listHeading?: string
  list?: Array<string>
  itemsHeading?: string
  items?: Array<string>
  consent?: string
  closing?: string
  /** Days from today for the response deadline (with-response templates only). */
  dueDateOffsetDays?: number
  /** Days before the due date to send a one-time reminder. */
  reminderOffsetDaysBeforeDue?: number
  followUp?: { text: string; type: FormQuestion['type'] }
}

const TEMPLATE_BODIES: Record<PostTemplateId, TemplateBody> = {
  'overseas-learning-trip': {
    title: 'Consent: Secondary 3 Overseas Learning Journey to Chiang Mai',
    intro:
      'Dear Parents, we are pleased to invite your child to join our Secondary 3 Overseas Learning Journey. It is a five-day cultural and service-learning trip with their classmates.',
    detailPairs: [
      ['Destination', 'Chiang Mai, Thailand'],
      ['Dates', '8–12 September 2026 (September holidays)'],
      ['Estimated cost', 'S$1,250 per student (subsidies available)'],
      ['Group', '40 students, accompanied by 4 teachers'],
    ],
    listHeading: 'Learning objectives',
    list: [
      'Apply classroom learning about sustainability in a real community',
      'Build independence, teamwork and cross-cultural understanding',
      'Complete a service-learning project with a partner school',
    ],
    itemsHeading: 'What to bring',
    items: [
      "Valid passport with at least 6 months' validity",
      'Comfortable walking shoes and weather-appropriate clothing',
      'Any personal medication, clearly labelled',
      'Spending money (S$100–150 recommended)',
    ],
    consent:
      "Please indicate whether you give consent for your child to take part. A parents' briefing will be held two weeks before departure.",
    closing:
      'For enquiries, please contact the trip coordinator, [For input: teacher name], at [For input: email].',
    dueDateOffsetDays: 14,
    reminderOffsetDaysBeforeDue: 3,
    followUp: {
      text: 'Any dietary or medical needs we should be aware of?',
      type: 'free-text',
    },
  },
  'local-excursion': {
    title: 'Consent: Primary 4 Learning Journey to the Science Centre',
    intro:
      'Dear Parents, our Primary 4 classes will visit Science Centre Singapore as part of our unit on energy and the environment.',
    detailPairs: [
      ['Venue', 'Science Centre Singapore, 15 Science Centre Road'],
      ['Date', '24 August 2026, 9.00am–1.00pm'],
      ['Cost', 'S$18 per student (admission and transport)'],
      ['Transport', 'By coach, departing from and returning to school'],
    ],
    listHeading: 'Learning objectives',
    list: [
      'See classroom science concepts come alive in real exhibits',
      'Practise observation and note-taking in the guided galleries',
    ],
    itemsHeading: 'What to bring',
    items: [
      'School uniform and covered shoes',
      'A water bottle and a small packed snack',
      'A cap or umbrella for the walk between exhibits',
    ],
    consent:
      'Please indicate whether you give consent for your child to join this learning journey.',
    closing:
      "For enquiries, please contact your child's form teacher, [For input: teacher name], at [For input: email].",
    dueDateOffsetDays: 7,
    reminderOffsetDaysBeforeDue: 2,
  },
  'event-notice': {
    title: 'Meet-the-Parents Session — Term 3',
    intro:
      "Dear Parents, you are warmly invited to our Term 3 Meet-the-Parents Session, where you can discuss your child's progress with their teachers.",
    detailPairs: [
      ['Date', '4 July 2026 (Saturday)'],
      ['Time', '9.00am–12.00pm'],
      ['Venue', 'School Hall and classrooms'],
    ],
    listHeading: 'Agenda',
    list: [
      "Principal's welcome and a Term 3 overview",
      'Individual consultations with subject teachers',
      'Q&A on the upcoming assessment schedule',
    ],
    closing:
      'Please acknowledge that you have seen this notice. We look forward to seeing you.',
    dueDateOffsetDays: 7,
    reminderOffsetDaysBeforeDue: 2,
  },
  'term-update': {
    title: 'Start of Term 3: What to Expect',
    intro:
      'Dear Parents, welcome back to a new term. Here is a quick overview of what Term 3 holds for your child.',
    detailPairs: [
      ['Term dates', '30 June – 5 September 2026'],
      ['Key events', 'Meet-the-Parents (5 Jul), Learning Journey (24 Aug)'],
    ],
    listHeading: 'This term we will focus on',
    list: [
      'Consolidating skills ahead of the end-of-year assessments',
      'A unit on the environment, with a learning journey',
      'Continued reading and character-education programmes',
    ],
    closing:
      "There's nothing to reply to here — this letter is for your information. Do reach out to your child's form teacher with any questions.",
  },
}

// ── Renderers ────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Clean HTML for the Tiptap description field. Allowlist: p, ul, li, strong. */
function renderHtml(b: TemplateBody): string {
  const parts: Array<string> = []
  parts.push(`<p>${esc(b.intro)}</p>`)
  if (b.detailPairs?.length) {
    parts.push(
      '<ul>' +
        b.detailPairs
          .map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`)
          .join('') +
        '</ul>',
    )
  }
  if (b.list?.length) {
    parts.push(`<p><strong>${esc(b.listHeading ?? 'Details')}</strong></p>`)
    parts.push(
      '<ul>' + b.list.map((o) => `<li>${esc(o)}</li>`).join('') + '</ul>',
    )
  }
  if (b.items?.length) {
    parts.push(
      `<p><strong>${esc(b.itemsHeading ?? 'What to bring')}</strong></p>`,
    )
    parts.push(
      '<ul>' + b.items.map((i) => `<li>${esc(i)}</li>`).join('') + '</ul>',
    )
  }
  if (b.consent) parts.push(`<p>${esc(b.consent)}</p>`)
  if (b.closing) parts.push(`<p>${esc(b.closing)}</p>`)
  return parts.join('')
}

/** Markdown-ish text for HeyTalia's chat draft block. */
function renderText(b: TemplateBody): string {
  const lines: Array<string> = [b.intro, '']
  if (b.detailPairs?.length) {
    for (const [k, v] of b.detailPairs) lines.push(`• ${k}: ${v}`)
    lines.push('')
  }
  if (b.list?.length) {
    lines.push(`**${b.listHeading ?? 'Details'}**`)
    for (const o of b.list) lines.push(`• ${o}`)
    lines.push('')
  }
  if (b.items?.length) {
    lines.push(`**${b.itemsHeading ?? 'What to bring'}**`)
    for (const i of b.items) lines.push(`• ${i}`)
    lines.push('')
  }
  if (b.consent) lines.push(b.consent, '')
  if (b.closing) lines.push(b.closing)
  return lines.join('\n').trim()
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Structured draft the composer applies to its form fields. */
export interface PostDraft {
  title: string
  descriptionHtml: string
  responseType: ResponseType
  dueDateOffsetDays?: number
  reminderOffsetDaysBeforeDue?: number
  questions?: Array<FormQuestion>
  /** Content is realistic but illustrative — the composer marks it accordingly. */
  illustrative: true
}

export function buildPostDraft(id: PostTemplateId): PostDraft {
  const b = TEMPLATE_BODIES[id]
  const tpl = POST_TEMPLATES.find((t) => t.id === id)!
  return {
    title: b.title,
    descriptionHtml: renderHtml(b),
    responseType: tpl.responseKind,
    dueDateOffsetDays: b.dueDateOffsetDays,
    reminderOffsetDaysBeforeDue: b.reminderOffsetDaysBeforeDue,
    questions: b.followUp
      ? [
          {
            id: `q-${id}`,
            text: b.followUp.text,
            type: b.followUp.type,
            required: false,
          },
        ]
      : undefined,
    illustrative: true,
  }
}

/** The chat draft block HeyTalia renders. */
export interface DraftBlock {
  title: string
  body: string
  warning: string
}

const TEMPLATE_WARNING =
  'Example content — review and edit the details before posting. Some specifics are marked [For input].'

export function templateDraftBlock(id: PostTemplateId): DraftBlock {
  const b = TEMPLATE_BODIES[id]
  return { title: b.title, body: renderText(b), warning: TEMPLATE_WARNING }
}

/** Free-form draft from a typed topic — HeyTalia's original behaviour. */
export function buildTopicDraftBlock(topic: string): DraftBlock {
  const t = topic.charAt(0).toUpperCase() + topic.slice(1)
  return {
    title: t,
    body: [
      `Dear Parents,`,
      ``,
      `We would like to inform you about our upcoming **${t}**.`,
      ``,
      `Please take note of the following:`,
      `• Date: [For input: date]`,
      `• Venue: [For input: location]`,
      `• Reporting time: [For input: time]`,
      `• Return time: [For input: time]`,
      ``,
      `Students should wear [For input: attire] and bring [For input: items to bring].`,
      ``,
      `Please acknowledge by [For input: deadline date].`,
      ``,
      `For enquiries, contact [For input: teacher name] at [For input: email].`,
      ``,
      `Thank you.`,
    ].join('\n'),
    warning:
      'Your draft is missing some details. Do check out the [For input] fields and use the Edit tool to update them. Hyperlinks are **not supported** in the Description field when using "Use draft".',
  }
}

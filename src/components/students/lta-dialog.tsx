import { useEffect, useRef, useState } from 'react'
import { ExternalLink, FileText, Send, User, X } from 'lucide-react'

import type { Student } from '@/types/student'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

type ResourceTab = 'resources' | 'learn-more'

interface GuidanceAction {
  title: string
  description: string
  urgency: {
    label: string
    icon: React.ReactNode
    textColor: string
    badgeBg: string
  }
  contacts: Array<string>
  resources: Array<{ label: string; href: string; external?: boolean }>
}

// ── Linear-style priority icons ──────────────────────────────

function PriorityMediumIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="1" y="9" width="3" height="5" rx="1" />
      <rect x="6.5" y="5" width="3" height="9" rx="1" />
      <rect x="12" y="1" width="3" height="13" rx="1" opacity="0.35" />
    </svg>
  )
}

function PriorityLowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="1" y="9" width="3" height="5" rx="1" />
      <rect x="6.5" y="5" width="3" height="9" rx="1" opacity="0.35" />
      <rect x="12" y="1" width="3" height="13" rx="1" opacity="0.35" />
    </svg>
  )
}

// ── Glow bot avatar (Perplexity-style monitor face with animated eyes) ──

function GlowBotIcon({ size = 28 }: { size?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const [eyeOffset, setEyeOffset] = useState(0)
  const [blinkScale, setBlinkScale] = useState(1)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isHovered) {
      setEyeOffset(0)
      setBlinkScale(1)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    // Eye look sequence: center → left → right → center → blink
    const sequence = [
      { delay: 0, offset: 0, blink: 1 },
      { delay: 200, offset: -1.4, blink: 1 },
      { delay: 500, offset: 1.4, blink: 1 },
      { delay: 800, offset: 0, blink: 1 },
      { delay: 1100, offset: 0, blink: 0.1 },
      { delay: 1250, offset: 0, blink: 1 },
    ]

    const timers: Array<ReturnType<typeof setTimeout>> = []

    function runSequence() {
      for (const step of sequence) {
        const t = setTimeout(() => {
          setEyeOffset(step.offset)
          setBlinkScale(step.blink)
        }, step.delay)
        timers.push(t)
      }
    }

    runSequence()
    intervalRef.current = setInterval(runSequence, 2000)

    return () => {
      timers.forEach(clearTimeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isHovered])

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg bg-twblue-9"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width={size * 0.64}
        height={size * 0.64}
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
      >
        {/* Monitor body */}
        <rect
          x="2"
          y="2"
          width="14"
          height="10"
          rx="2.5"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Left eye */}
        <rect
          x={6 + eyeOffset}
          y="5.5"
          width="2"
          height="2"
          rx="0.5"
          fill="white"
          style={{
            transform: `scaleY(${blinkScale})`,
            transformOrigin: '7px 6.5px',
            transition: 'x 150ms ease, transform 80ms ease',
          }}
        />
        {/* Right eye */}
        <rect
          x={10 + eyeOffset}
          y="5.5"
          width="2"
          height="2"
          rx="0.5"
          fill="white"
          style={{
            transform: `scaleY(${blinkScale})`,
            transformOrigin: '11px 6.5px',
            transition: 'x 150ms ease, transform 80ms ease',
          }}
        />
        {/* Stand base */}
        <line
          x1="7"
          y1="14"
          x2="11"
          y2="14"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Stand neck */}
        <line
          x1="9"
          y1="12"
          x2="9"
          y2="14"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

function getStudentInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const guidanceActions: Array<GuidanceAction> = [
  {
    title: 'Consider building on her peer connections',
    description:
      'Build on her new friendships with Cheryl Ang and Amanda Koh, both from S4 A, through buddy support, peer check ins and clear routines to support her attendance.',
    urgency: {
      label: 'Upcoming weeks',
      icon: <PriorityMediumIcon />,
      textColor: 'text-orange-11',
      badgeBg: 'bg-orange-2 border border-orange-6',
    },
    contacts: ['Form Teacher', 'Year Head'],
    resources: [{ label: 'Peer support guide', href: '#' }],
  },
  {
    title: 'Consider a brief SDT case discussion',
    description:
      'Review RIOT data (attendance, discipline, teacher observations — past 4 weeks). Coordinate both areas, with YH and SC looped in.',
    urgency: {
      label: 'Upcoming weeks',
      icon: <PriorityMediumIcon />,
      textColor: 'text-orange-11',
      badgeBg: 'bg-orange-2 border border-orange-6',
    },
    contacts: ['Year Head', 'School Counsellor'],
    resources: [],
  },
  {
    title: 'Consider a 1-on-1 check-in',
    description:
      'Low mood is worth watching as a longer-term signal. Validate feelings first, before the attendance pattern.',
    urgency: {
      label: 'Monitor',
      icon: <PriorityLowIcon />,
      textColor: 'text-lime-11',
      badgeBg: 'bg-lime-2 border border-lime-6',
    },
    contacts: ['School Counsellor'],
    resources: [
      { label: 'Check-in guide (SwAN-adapted)', href: '#' },
      { label: 'Low mood guide', href: '#' },
    ],
  },
]

const caseResources: Array<{
  label: string
  href: string
  external?: boolean
}> = [
  { label: 'Check-in guide (SwAN-adapted)', href: '#' },
  { label: 'Low mood guide', href: '#' },
  { label: 'Attendance support protocol', href: '#' },
  { label: 'Home engagement guide', href: '#' },
  { label: 'Peer support guide', href: '#' },
]

const learnMoreItems = [
  {
    title: 'Understanding SwAN Profiles',
    author: 'SEND',
    duration: '22 min',
    type: 'podcast' as const,
    cover: '/learn-cover-1.png',
    description:
      'A comprehensive overview of Students with Additional Needs — how to identify profiles, adapt communication, and plan differentiated support.',
  },
  {
    title: 'Tier 2 Intervention Playbook',
    author: 'SDCD',
    duration: '12 min',
    type: 'article' as const,
    cover: '/learn-cover-2.png',
    description:
      'Step-by-step protocols for emerging concerns: when to escalate, who to loop in, and how to coordinate across Year Heads and Counsellors.',
  },
  {
    title: 'Conducting Safe Check-ins',
    author: 'SWB',
    duration: '18 min',
    type: 'podcast' as const,
    cover: '/learn-cover-3.png',
    description:
      'Practical techniques for 1-on-1 conversations with students showing low mood — building trust, asking the right questions, and knowing when to refer.',
  },
]

interface GlowStudentSupportPageProps {
  student: Student
  onClose: () => void
}

export function GlowStudentSupportPage({
  student,
  onClose,
}: GlowStudentSupportPageProps) {
  const [activeTab, setActiveTab] = useState<ResourceTab>('resources')

  const initials = getStudentInitials(student.name)
  const firstName = student.name.split(' ')[0]

  const suggestedQuestions = [
    'Which issue should I tackle first?',
    `How do I adjust my approach for her SwAN profile?`,
    'When should I loop in the School Counsellor?',
  ]

  return (
    // Fills the full viewport — no fixed/z-index needed since this IS the page
    <div className="flex h-screen flex-col bg-background">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <GlowBotIcon size={28} />
          <span className="text-sm font-medium text-foreground">
            {student.id === '118'
              ? 'Explore student support'
              : 'Glow · Student Support'}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ── 3-column layout — gap creates the NotebookLM-style visible separation ── */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-3 lg:flex-row">
        {/* ── Left panel: Student context ── */}
        <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-[0px_1px_2px_0px_rgb(0_0_0/0.05)] lg:w-[420px]">
          {/* Panel header */}
          <div className="shrink-0 border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-medium text-foreground">
              Student context
            </h2>
          </div>

          <div className="max-h-[40vh] overflow-y-auto p-5 lg:max-h-none">
            {/* Student identity */}
            <div className="mt-4 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold">{student.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Class {student.class} · {student.cca}
                </p>
                <span className="inline-flex items-center rounded-lg border border-orange-6 bg-orange-2 px-2.5 py-1 text-xs font-medium text-orange-11">
                  SwAN
                </span>
              </div>
            </div>

            {/* Context question */}
            <h2 className="mt-5 text-sm font-semibold leading-snug text-foreground">
              How to support?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Co-occurring attendance, social-emotional, and engagement
              challenges require a sequenced, differentiated approach.
            </p>

            {/* Divider */}
            <div className="my-5 border-t border-border" />

            {/* Possible support areas */}
            <p className="text-xs font-medium text-muted-foreground">
              Possible support areas
            </p>
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-2 rounded-lg bg-orange-2 px-3 py-2 text-sm font-medium text-orange-11">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-9" />
                Long-Term Absenteeism
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-orange-2 px-3 py-2 text-sm font-medium text-orange-11">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-9" />
                Low mood
              </div>
            </div>
          </div>
        </aside>

        {/* ── Middle panel: AI Chat ── */}
        <main className="flex flex-1 flex-col overflow-hidden rounded-2xl border bg-card shadow-[0px_1px_2px_0px_rgb(0_0_0/0.05)]">
          {/* Panel header */}
          <div className="shrink-0 border-b border-border px-4 py-3.5 lg:px-8">
            <h2 className="text-sm font-medium text-foreground">Chat</h2>
          </div>

          {/* Scrollable messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-7 lg:px-8">
            {/* AI response */}
            <div className="flex gap-3">
              {/* Glow avatar */}
              <div className="mt-0.5">
                <GlowBotIcon size={28} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-foreground">
                  Two areas are flagged for {firstName} at once — long-term
                  absenteeism and low mood. Manageable alone, but together
                  they're worth a coordinated watch. Some considerations, by
                  priority:
                </p>

                {/* Action cards */}
                <div className="mt-5 space-y-2.5">
                  {guidanceActions.map((action, i) => {
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted"
                      >
                        <div className="min-w-0 flex-1">
                          {/* Urgency badge then title */}
                          <div className="flex flex-col gap-1.5">
                            <span
                              className={cn(
                                'inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                action.urgency.badgeBg,
                                action.urgency.textColor,
                              )}
                            >
                              {action.urgency.icon}
                              {action.urgency.label}
                            </span>
                            <h4 className="text-sm font-semibold leading-snug">
                              {action.title}
                            </h4>
                          </div>

                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {action.description}
                          </p>

                          {/* Contact chips */}
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-muted-foreground">
                                Contact
                              </span>
                              {action.contacts.map((c) => (
                                <button
                                  key={c}
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground underline-offset-2 hover:underline"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Resources */}
                          {action.resources.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Resources
                              </span>
                              {action.resources.map((r) => (
                                <a
                                  key={r.label}
                                  href={r.href}
                                  className="inline-flex items-center gap-0.5 text-xs text-foreground underline-offset-2 hover:underline"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  {r.label}
                                  {r.external && (
                                    <ExternalLink className="ml-0.5 inline h-3 w-3" />
                                  )}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Sharpen prompt */}
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">
                    To sharpen this plan:
                  </strong>{' '}
                  it would help to know how long the low mood has been observed,
                  what's behind the recent absences (health, family, or
                  school-based factors), and what {firstName}'s specific SwAN
                  diagnosis or support needs are. Share what you know in the
                  chat below.
                </p>
              </div>
            </div>

            {/* Suggested follow-up questions */}
            <div className="mt-6 flex flex-wrap gap-2 pl-0 lg:pl-10">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  className="rounded-[var(--radius-input)] border border-border bg-background px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  onClick={(e) => e.preventDefault()}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat input — pinned to bottom */}
          <div className="shrink-0 border-t border-border px-4 py-4 lg:px-8">
            <InputGroup className="h-auto rounded-[var(--radius-input)] border-border bg-background px-4 py-2.5">
              <InputGroupInput
                type="text"
                placeholder={`Ask a follow-up about ${firstName}…`}
                className="text-sm text-foreground"
                readOnly
              />
              <InputGroupAddon align="inline-end">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </main>

        {/* ── Right panel: Resources ── */}
        <aside className="hidden w-[400px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-[0px_1px_2px_0px_rgb(0_0_0/0.05)] lg:flex">
          {/* Panel header */}
          <div className="shrink-0 border-b border-border px-4 py-3.5">
            <h2 className="text-sm font-medium text-foreground">Learn more</h2>
          </div>

          {/* Segmented tab control */}
          <div className="shrink-0 px-4 py-3">
            <div className="flex rounded-full bg-muted p-1 gap-1">
              <TabButton
                active={activeTab === 'resources'}
                onClick={() => setActiveTab('resources')}
              >
                Resources
              </TabButton>
              <TabButton
                active={activeTab === 'learn-more'}
                onClick={() => setActiveTab('learn-more')}
              >
                Learn
              </TabButton>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'resources' ? (
              <>
                <ul className="space-y-0.5">
                  {caseResources.map((r) => (
                    <li key={r.label}>
                      <a
                        href={r.href}
                        className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        onClick={(e) => e.preventDefault()}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 leading-snug">{r.label}</span>
                        {r.external ? (
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <ul className="space-y-3">
                {learnMoreItems.map((item) => (
                  <li key={item.title}>
                    <a
                      href="#"
                      className="group flex items-stretch gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      onClick={(e) => e.preventDefault()}
                    >
                      {/* Cover image — stretches to match text height */}
                      <div className="w-24 shrink-0 self-stretch">
                        <img
                          src={item.cover}
                          alt=""
                          className="h-full w-full rounded-lg object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Title */}
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {item.title}
                        </p>

                        {/* Author + duration — no icon */}
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{item.author}</span>
                          <span>·</span>
                          <span>{item.duration}</span>
                        </div>

                        {/* Description — 2 lines, visible on hover */}
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          {item.description}
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      className={cn(
        'flex-1 rounded-full py-1.5 text-sm font-medium transition-all',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

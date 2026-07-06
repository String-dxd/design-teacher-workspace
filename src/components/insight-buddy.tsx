import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUp, Sparkles, X } from 'lucide-react'

import type { Student } from '@/types/student'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface InsightBuddyProps {
  examplePrompts?: Array<string>
  /** When true, renders as a FAB + fixed overlay (analytics page).
   *  When false (default), renders as a sticky in-flow panel (profile page). */
  floating?: boolean
  /** Optional student context — enables student-specific responses (Student 360). */
  student?: Student
}

// ---------------------------------------------------------------------------
// Canned responses
// ---------------------------------------------------------------------------

const TERM1_WA_RESPONSE = `Here's a summary for **Sec 4 EL-G3, Term 1 WA**:

• **Students who sat:** 120
• **Students with distinction** (A1/A2): 42 (35%)
• **Students with pass** (A1–C6): 98 (82%)

**Compared to the past:**
• Distinction rate is up from ~30% in the previous year's EOY — a positive trend 📈
• Pass rate held steady at around 80–83% across terms
• ~18 students (15%) did not pass — consider targeted support for this group`

const CHART_QUESTION_RESPONSE = `Happy to help explain! Which chart are you looking at?

You can:
• **Type the chart name** (e.g. "Scores by class")
• **Paste a screenshot** directly into the chat`

const SCORES_BY_CLASS_RESPONSE = `Here's what the **Scores by class** chart shows:

**Key insights:**
• **4A leads** with the highest median (~74) and a compact spread — students perform consistently
• **4B** sits at median ~68 with moderate spread across the class
• **4C** has a wide IQR, indicating high variance — some students may need extra support
• **4D has the lowest median** (~57) and widest spread — consider differentiated instruction

**Reading the chart:**
• Blue box = middle 50% of students (IQR, Q1–Q3)
• Blue vertical line = median score
• Whiskers = min / max scores

**Takeaway:** 4A is the strongest cohort for EL-G3 Term 1 WA. 4D would benefit most from targeted intervention.`

const GENERIC_RESPONSE = `I'm here to help with analytics questions. Try asking about student performance, grade distributions, or trends — or paste a chart screenshot for an explanation.`

// ---------------------------------------------------------------------------
// Student-specific response generators
// ---------------------------------------------------------------------------

function getWellbeingResponse(student: Student): string {
  const counselling =
    student.counsellingSessions === 0
      ? 'No sessions recorded this term'
      : `${student.counsellingSessions} session(s) this term`

  const mood = student.lowMoodFlagged
    ? `Low mood flagged (${student.lowMoodFlagged})`
    : 'No concerns flagged'

  const riskNote =
    student.riskIndicators >= 3
      ? ` — elevated concern`
      : student.riskIndicators === 0
        ? ` — no active concerns`
        : ''

  const socialNote = student.socialLinks <= 1 ? ` — limited social support` : ''

  const agencies = student.externalAgencies ?? 'None'

  return `Here's a wellbeing summary for **${student.name}**:

**Counselling**
• ${counselling}

**Social Links**
• ${student.socialLinks} peer connection(s) recorded${socialNote}

**TCI Risk Indicators**
• ${student.riskIndicators} risk indicator(s) flagged${riskNote}

**Mood**
• ${mood}

**External Agencies**
• ${agencies}`
}

function getRiskFactorsResponse(student: Student): string {
  const flags: Array<string> = []

  const attendancePct = Math.round(
    (student.daysPresent / student.totalSchoolDays) * 100,
  )
  if (attendancePct < 50) {
    flags.push(
      `⚠️ **School attendance is ${attendancePct}%** (below 50%) — ${student.daysPresent}/${student.totalSchoolDays} days present`,
    )
  }

  if (student.ccaMissed >= 5) {
    flags.push(
      `⚠️ **CCA attendance concern** — ${student.ccaMissed} session(s) missed this term`,
    )
  }

  if (student.conduct === 'Poor' || student.offences >= 3) {
    flags.push(
      `⚠️ **Behavioural risk** — Conduct: ${student.conduct}, ${student.offences} offence(s) recorded`,
    )
  }

  if (student.riskIndicators >= 3) {
    flags.push(
      `⚠️ **${student.riskIndicators} risk indicator(s) flagged** — multiple concerns active`,
    )
  }

  if (student.counsellingSessions > 2) {
    flags.push(
      `⚠️ **Rise in counselling** — ${student.counsellingSessions} session(s) this term`,
    )
  }

  if (student.lowMoodFlagged) {
    flags.push(`⚠️ **Low mood flagged** — ${student.lowMoodFlagged}`)
  }

  if (student.overallPercentage < 30) {
    flags.push(
      `⚠️ **Overall score is ${student.overallPercentage}%** (below 30%)`,
    )
  }

  if (student.fas) {
    flags.push(`ℹ️ **Financial Assistance (FAS)** — ${student.fas}`)
  }

  if (flags.length === 0) {
    return `No significant risk factors identified for **${student.name}** at this time.

Key indicators:
• Attendance: ${attendancePct}%
• Overall score: ${student.overallPercentage}%
• Conduct: ${student.conduct}
• TCI risk indicators: ${student.riskIndicators}`
  }

  return `Here are the key risk factors for **${student.name}**:

${flags.join('\n')}

**Recommended:** Review with HOD and consider targeted intervention.`
}

function getBotResponse(
  text: string,
  history: Array<Message>,
  student?: Student,
): string {
  const lower = text.toLowerCase()

  // Student-specific responses (Student 360)
  if (student) {
    if (lower.includes('wellbeing')) {
      return getWellbeingResponse(student)
    }
    if (lower.includes('risk factor')) {
      return getRiskFactorsResponse(student)
    }
  }

  const lastAssistant = [...history]
    .reverse()
    .find((m) => m.role === 'assistant')
  const prevAskedAboutChart = lastAssistant?.content.includes(
    'Which chart are you looking at?',
  )

  // After asking about the chart, user types the chart name
  if (
    prevAskedAboutChart &&
    (lower.includes('score') ||
      lower.includes('class') ||
      lower.includes('box'))
  ) {
    return SCORES_BY_CLASS_RESPONSE
  }

  // "How did Sec 4 (EL-G3) do for Term 1 WA?"
  if (
    lower.includes('term 1') ||
    lower.includes('term1') ||
    lower.includes('term 1 wa')
  ) {
    return TERM1_WA_RESPONSE
  }

  // "What does this chart mean?"
  if (
    lower.includes('chart') ||
    lower.includes('what does') ||
    lower.includes('graph')
  ) {
    return CHART_QUESTION_RESPONSE
  }

  return GENERIC_RESPONSE
}

// ---------------------------------------------------------------------------
// Simple inline markdown renderer (handles **bold** and line breaks)
// ---------------------------------------------------------------------------

function parseInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-0.5 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />
        return <div key={i}>{parseInline(line)}</div>
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="animate-msg-in flex gap-2 justify-start">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-twblue-3">
        <Sparkles className="animate-sparkle-idle h-3 w-3 text-twblue-11" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted/70 px-3 py-2">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 rounded-full bg-muted-foreground/50"
            style={{
              animation: `typing-dot 1.2s ease-in-out ${delay}ms infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared chat panel content
// ---------------------------------------------------------------------------

interface PanelContentProps {
  messages: Array<Message>
  examplePrompts: Array<string>
  input: string
  setInput: (v: string) => void
  sendMessage: (text: string) => void
  onClose?: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  isTyping: boolean
}

function PanelContent({
  messages,
  examplePrompts,
  input,
  setInput,
  sendMessage,
  onClose,
  messagesEndRef,
  isTyping,
}: PanelContentProps) {
  const isEmpty = messages.length === 0 && !isTyping

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input.trim())
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-twblue-3">
            <Sparkles className="h-3.5 w-3.5 text-twblue-11" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Insight Buddy</p>
            <p className="text-[10px] leading-tight text-muted-foreground">
              Analytics assistant
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages / empty state */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {isEmpty ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-muted-foreground">Try asking:</p>
            {examplePrompts.map((prompt, i) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="animate-fade-slide-up group flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 text-left text-xs transition-all hover:-translate-y-px hover:border-twblue-6 hover:bg-twblue-3/50 active:translate-y-0"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="flex-1 text-foreground">{prompt}</span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-twblue-9/70" />
              </button>
            ))}
            {examplePrompts.length === 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Ask about student performance,
                <br />
                grade distributions, or trends.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'animate-msg-in flex gap-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-twblue-3">
                    <Sparkles className="h-3 w-3 text-twblue-11" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-xs',
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-primary text-primary-foreground'
                      : 'rounded-tl-sm bg-muted/70 text-foreground',
                  )}
                >
                  <MessageContent content={msg.content} />
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-card p-3">
        <div className="relative flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask insight buddy..."
            className="max-h-32 min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            rows={1}
          />
          <Button
            type="button"
            size="icon-sm"
            onClick={() => sendMessage(input.trim())}
            disabled={!input.trim() || isTyping}
            className="shrink-0 transition-transform active:scale-90"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// InsightBuddy
// ---------------------------------------------------------------------------

export function InsightBuddy({
  examplePrompts = [],
  floating = false,
  student,
}: InsightBuddyProps) {
  const [messages, setMessages] = useState<Array<Message>>([])
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false) // only used in floating mode
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function sendMessage(text: string) {
    if (!text.trim() || isTyping) return

    const userMsg: Message = {
      id: `${Date.now()}-u`,
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const botResponse = getBotResponse(text, messages, student)
      const assistantMsg: Message = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: botResponse,
      }
      setIsTyping(false)
      setMessages((prev) => [...prev, assistantMsg])
    }, 900)
  }

  const panelProps: PanelContentProps = {
    messages,
    examplePrompts,
    input,
    setInput,
    sendMessage,
    messagesEndRef,
    isTyping,
  }

  // ── Floating mode: FAB + fixed overlay ─────────────────────────────────────
  if (floating) {
    return (
      <>
        {/* FAB */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95',
            isOpen
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
          )}
          title={isOpen ? 'Close Insight Buddy' : 'Open Insight Buddy'}
        >
          {isOpen ? (
            <X className="h-5 w-5 transition-transform" />
          ) : (
            <Sparkles className="animate-sparkle-idle h-5 w-5" />
          )}
        </button>

        {/* Overlay panel */}
        {isOpen && (
          <div className="animate-panel-up fixed bottom-[72px] right-6 z-40 flex h-[min(560px,calc(100vh-6rem))] w-80 flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
            <PanelContent {...panelProps} onClose={() => setIsOpen(false)} />
          </div>
        )}
      </>
    )
  }

  // ── Sticky mode: in-flow panel (student profile) ────────────────────────────
  return (
    <div className="sticky top-6 flex h-[calc(100vh-3rem)] w-72 shrink-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <PanelContent {...panelProps} />
    </div>
  )
}

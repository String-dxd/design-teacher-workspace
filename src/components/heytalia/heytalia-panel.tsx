'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
  Mail,
  Maximize2,
  Minimize2,
  Minus,
  Pencil,
  Plus,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { useHeyTalia } from './heytalia-context'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

// ---------------------------------------------------------------------------
// Colour constants
// ---------------------------------------------------------------------------
const HT = {
  primary: 'var(--primary)',
  ultraLight: 'var(--slate-2)',
  light: 'var(--slate-3)',
  border: 'var(--slate-6)',
  text: 'var(--slate-11)',
} as const

// Width presets
const W_DEFAULT = 368
const W_WIDE = 560
const W_MIN = 300
const W_MAX = 720

// ---------------------------------------------------------------------------
// HeyTalia mascot — inline SVG, uid-namespaced masks
// ---------------------------------------------------------------------------
function HeyTaliaLogo({
  size = 32,
  uid,
  className,
}: {
  size?: number
  uid: string
  className?: string
}) {
  const h = Math.round((size * 163) / 211)
  const ml = `htmask-l-${uid}`
  const mr = `htmask-r-${uid}`
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 211 163"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <mask id={ml} fill="white">
        <rect y="74.9998" width="20" height="48" rx="8" />
      </mask>
      <rect
        y="74.9998"
        width="20"
        height="48"
        rx="8"
        fill="#228BE6"
        stroke="#9575CD"
        strokeWidth="20"
        mask={`url(#${ml})`}
      />
      <mask id={mr} fill="white">
        <rect x="191" y="74.9998" width="20" height="48" rx="8" />
      </mask>
      <rect
        x="191"
        y="74.9998"
        width="20"
        height="48"
        rx="8"
        fill="#228BE6"
        stroke="#9575CD"
        strokeWidth="20"
        mask={`url(#${mr})`}
      />
      <path
        d="M46.3152 9.68599C46.8095 9.67962 47.262 9.96386 47.4704 10.4122L61.116 39.7645C61.1246 39.7829 61.1286 39.7978 61.132 39.8077C61.1273 39.8178 61.1203 39.8337 61.1056 39.8518C61.091 39.8698 61.077 39.8799 61.0681 39.8867C61.0578 39.8854 61.0427 39.8848 61.0228 39.8802C57.8604 39.1501 54.5372 39.7231 51.8018 41.47L51.3475 41.7597C50.5095 42.2949 49.3986 41.7842 49.26 40.7997L45.0882 11.1158C44.9832 10.367 45.559 9.69591 46.3152 9.68599Z"
        fill="#228BE6"
        stroke="#9575CD"
        strokeWidth="12"
      />
      <path
        d="M173.585 9.68599C173.091 9.67962 172.638 9.96386 172.43 10.4122L158.784 39.7645C158.776 39.7829 158.772 39.7978 158.768 39.8077C158.773 39.8178 158.78 39.8337 158.795 39.8518C158.809 39.8698 158.823 39.8799 158.832 39.8867C158.843 39.8854 158.858 39.8848 158.878 39.8802C162.04 39.1501 165.363 39.7231 168.099 41.47L168.553 41.7597C169.391 42.2949 170.502 41.7842 170.64 40.7997L174.812 11.1158C174.917 10.367 174.341 9.69591 173.585 9.68599Z"
        fill="#228BE6"
        stroke="#9575CD"
        strokeWidth="12"
      />
      <path
        d="M106.803 41.4998C120.72 41.4998 138.332 42.9005 152.334 44.2791C159.363 44.971 165.534 45.6624 169.949 46.1814C172.157 46.4409 173.928 46.6574 175.148 46.8093C175.759 46.8853 176.232 46.9451 176.554 46.9861C176.714 47.0066 176.837 47.0222 176.921 47.033C176.956 47.0375 176.985 47.042 177.006 47.0447C177.014 47.0456 177.022 47.0457 177.029 47.0466C177.201 47.0675 177.384 47.0964 177.577 47.1355C177.965 47.2141 178.388 47.3326 178.836 47.5037C179.741 47.8494 180.688 48.3875 181.629 49.1687C183.494 50.7176 185.207 53.1104 186.677 56.6365C189.567 63.5724 192 76.0792 192 99.2224C192 122.353 189.571 134.774 186.661 141.624C185.18 145.111 183.434 147.487 181.5 149.005C180.524 149.77 179.541 150.283 178.606 150.597C178.145 150.753 177.712 150.854 177.316 150.916C177.205 150.933 177.097 150.946 176.993 150.958C176.907 150.97 176.783 150.987 176.622 151.01C176.3 151.054 175.826 151.12 175.216 151.203C173.994 151.369 172.223 151.605 170.015 151.888C165.598 152.455 159.424 153.21 152.393 153.966C138.389 155.47 120.756 157 106.803 157C81.3569 157 43.3694 151.891 37.3535 151.061C37.2869 151.052 37.2092 151.043 37.0576 151.025C36.9279 151.01 36.7187 150.987 36.501 150.957C36.0572 150.896 35.3883 150.787 34.6348 150.544C31.1418 149.418 27.1449 146.18 24.1396 138.853C21.1987 131.683 19.0008 120.176 19 101.444C18.9986 65.0929 27.3136 53.0069 32.5732 48.9324L32.9385 48.6638C34.7686 47.3842 36.6775 47.0328 37.835 46.8875C44.9745 45.9909 81.9222 41.4998 106.803 41.4998Z"
        fill="white"
        stroke="#9575CD"
        strokeWidth="12"
      />
      <rect
        x="58.5"
        y="75.4998"
        width="9"
        height="25"
        rx="4.5"
        fill="#228BE6"
        stroke="#495057"
        strokeWidth="9"
      />
      <rect
        x="81.4151"
        y="112.914"
        width="5"
        height="29"
        rx="2.5"
        transform="rotate(-60 81.4151 112.914)"
        fill="#228BE6"
        stroke="#495057"
        strokeWidth="5"
      />
      <rect
        x="105.142"
        y="127.245"
        width="5"
        height="29"
        rx="2.5"
        transform="rotate(-120 105.142 127.245)"
        fill="#228BE6"
        stroke="#495057"
        strokeWidth="5"
      />
      <rect
        x="143.5"
        y="75.4998"
        width="9"
        height="25"
        rx="4.5"
        fill="#228BE6"
        stroke="#495057"
        strokeWidth="9"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PageContext = 'list' | 'create' | 'detail' | 'other'

interface DraftBlock {
  title: string
  body: string
  warning: string
}

interface Message {
  role: 'user' | 'assistant'
  text: string
  chips?: Array<string>
  draft?: DraftBlock
}

// ---------------------------------------------------------------------------
// Context detection
// ---------------------------------------------------------------------------
function usePageContext(): PageContext {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (pathname === '/announcements') return 'list'
  if (pathname.startsWith('/announcements/new')) return 'create'
  if (/^\/announcements\/pg-/.test(pathname)) return 'detail'
  return 'other'
}

// ---------------------------------------------------------------------------
// Draft builder
// ---------------------------------------------------------------------------
function buildDraft(topic: string): DraftBlock {
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

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
const SEED: Record<
  PageContext,
  {
    greeting: string
    chips: Array<string>
    demoReplies: { [k: string]: string | undefined }
  }
> = {
  list: {
    greeting: "Hi! I'm HeyTalia. What would you like to do today?",
    chips: ['Create announcement', 'Create form'],
    demoReplies: {
      'Create announcement': '__ask_topic__',
      'Create form':
        "What type of form would you like to create?\ne.g. *Consent form*, *Survey*, or *Registration*. I'll help you set it up.",
    },
  },
  create: {
    greeting:
      'I can help you draft or improve this announcement. What do you need?',
    chips: ['Create announcement', 'Create form'],
    demoReplies: {
      'Create announcement': '__ask_topic__',
      'Create form':
        "What type of form would you like to create?\ne.g. *Consent form*, *Survey*, or *Registration*. I'll help you set it up.",
    },
  },
  detail: {
    greeting: 'Need help with this announcement?',
    chips: ['Create announcement', 'Create form'],
    demoReplies: {
      'Create announcement': '__ask_topic__',
      'Create form':
        "What type of form would you like to create?\ne.g. *Consent form*, *Survey*, or *Registration*. I'll help you set it up.",
    },
  },
  other: {
    greeting: "Hi, I'm HeyTalia. How can I help?",
    chips: ['Create announcement', 'Create form'],
    demoReplies: {},
  },
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Agent definitions
// ---------------------------------------------------------------------------
export interface AgentDef {
  id: string
  name: string
  description: string
  icon: string
  color: string
  tag?: string
}

export const AGENTS: Array<AgentDef> = [
  {
    id: 'heytalia',
    name: 'HeyTalia',
    description: 'Draft announcements, forms, and parent communications',
    icon: '/logos/heytalia-logo.svg',
    color: '#9575CD',
    tag: 'Beta',
  },
]

export function HeyTaliaPanel() {
  const { view, setView } = useHeyTalia()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<Message>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [awaitingTopic, setAwaitingTopic] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [thumbed, setThumbed] = useState<Record<number, 'up' | 'down'>>({})
  const [panelWidth, setPanelWidth] = useState(W_DEFAULT)
  const [isExpanded, setIsExpanded] = useState(false)
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  const triggerUid = useId()
  const headerUid = useId()
  const ctx = usePageContext()
  const seed = SEED[ctx]
  const isMobile = useIsMobile()

  const isOpen = view === 'chat'
  const isPickerOpen = view === 'picker'

  // Effective panel width: full-screen on mobile, state-driven on desktop
  const effectiveWidth = isMobile ? '100vw' : panelWidth

  useEffect(() => {
    setAwaitingTopic(false)
    setMessages([{ role: 'assistant', text: seed.greeting, chips: seed.chips }])
  }, [ctx])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (view === 'chat') setTimeout(() => inputRef.current?.focus(), 150)
  }, [view])

  // ── Drag-to-resize ──────────────────────────────────────────────────────
  function startResize(e: React.MouseEvent) {
    e.preventDefault()
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = panelWidth

    function onMouseMove(ev: MouseEvent) {
      if (!isDragging.current) return
      // Dragging left = growing wider
      const delta = dragStartX.current - ev.clientX
      const next = Math.min(
        W_MAX,
        Math.max(W_MIN, dragStartWidth.current + delta),
      )
      setPanelWidth(next)
      setIsExpanded(next > W_DEFAULT + 20)
    }

    function onMouseUp() {
      isDragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // ── Width toggle ─────────────────────────────────────────────────────────
  function toggleWidth() {
    const next = isExpanded ? W_DEFAULT : W_WIDE
    setPanelWidth(next)
    setIsExpanded(!isExpanded)
  }

  // ── Chat logic ───────────────────────────────────────────────────────────
  function sendMessage(text: string) {
    if (!text.trim()) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    setIsTyping(true)

    if (awaitingTopic) {
      setAwaitingTopic(false)
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: "Here's your **Announcement** draft:",
            draft: buildDraft(text),
          },
        ])
      }, 1100)
      return
    }

    const raw = seed.demoReplies[text]
    if (raw === '__ask_topic__') {
      setAwaitingTopic(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: "Sure! What's the title of your announcement? I'll draft it for you.\n\ne.g. *Learning Journey Update*, *Term 4 Letter 2026*",
          },
        ])
      }, 800)
      return
    }

    const reply =
      raw ??
      "I'm still learning that one! For now, I can help with drafting, reviewing, and navigating your announcements."

    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
    }, 900)
  }

  function handleCopy(msgIdx: number, text: string) {
    void navigator.clipboard.writeText(text)
    setCopied(msgIdx)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleThumb(msgIdx: number, dir: 'up' | 'down') {
    setThumbed((prev) => ({
      ...prev,
      [msgIdx]: prev[msgIdx] === dir ? (undefined as unknown as 'up') : dir,
    }))
  }

  function handleSelectAgent(_agentId: string) {
    setView('chat')
  }

  return (
    <>
      {/* Backdrop — dark on mobile for chat, transparent for picker */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setView('closed')}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed bottom-0 right-0 top-0 z-50 flex flex-col border-l bg-background shadow-xl',
          // Smooth slide for open/close; no width transition while dragging
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ width: effectiveWidth }}
      >
        {/* ── Drag-to-resize handle (desktop only) ── */}
        {!isMobile && (
          <div
            className="group absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize"
            onMouseDown={startResize}
          >
            {/* Visible indicator line */}
            <div className="h-full w-0.5 translate-x-0.5 bg-transparent transition-colors group-hover:bg-border group-active:bg-primary" />
          </div>
        )}

        {/* ── Header ── */}
        <div className="relative flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3">
          <button
            type="button"
            onClick={() => setAgentDropdownOpen((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-muted"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
              <img
                src="/logos/heytalia-logo.svg"
                alt="HeyTalia"
                className="h-5 w-5"
              />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  HeyTalia
                </span>
                <span className="rounded-full bg-twblue-3 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-twblue-9">
                  Beta
                </span>
              </div>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                agentDropdownOpen && 'rotate-180',
              )}
            />
          </button>

          {/* 2 icons only: expand toggle + close */}
          <div className="flex items-center">
            {!isMobile && (
              <button
                type="button"
                title={isExpanded ? 'Restore default width' : 'Expand panel'}
                onClick={toggleWidth}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {isExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <button
              type="button"
              title="Close"
              onClick={() => setView('closed')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── Agent Picker Dropdown ── */}
          {agentDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setAgentDropdownOpen(false)}
              />
              <AgentPickerDropdown
                onSelect={(id) => {
                  setAgentDropdownOpen(false)
                  handleSelectAgent(id)
                }}
                onClose={() => setAgentDropdownOpen(false)}
              />
            </>
          )}
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              msgIdx={i}
              onChipClick={sendMessage}
              copied={copied === i}
              thumbed={thumbed[i]}
              onCopy={() => handleCopy(i, msg.draft?.body ?? msg.text)}
              onThumb={(dir) => handleThumb(i, dir)}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* ── Input footer ── */}
        <div className="shrink-0 border-t bg-white px-3 pb-3 pt-2.5">
          <div className="relative flex h-9 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              placeholder="Ask HeyTalia…"
              className="h-9 w-full rounded-[var(--radius-input)] border border-input bg-white pr-10 pl-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="absolute right-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all disabled:opacity-40"
            >
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            HeyTalia can make mistakes. Always verify before sending.
          </p>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Agent picker dropdown
// ---------------------------------------------------------------------------
function AgentPickerDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (agentId: string) => void
  onClose: () => void
}) {
  return (
    <div className="absolute left-3 right-3 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border bg-white shadow-lg">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2.5">
        <p className="text-sm font-semibold text-foreground">
          Teacher Assistant
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Choose an agent to help you
        </p>
      </div>

      <div className="mx-4 border-t" />

      {/* Agent rows */}
      {AGENTS.map((agent) => (
        <button
          key={agent.id}
          type="button"
          onClick={() => onSelect(agent.id)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `color-mix(in srgb, ${agent.color} 9%, transparent)`,
            }}
          >
            <img src={agent.icon} alt={agent.name} className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {agent.name}
              </span>
              {agent.tag && (
                <span className="rounded-full bg-twblue-3 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-twblue-9">
                  {agent.tag}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {agent.description}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      ))}

      <div className="mx-4 border-t" />

      {/* Add new agents */}
      <button
        type="button"
        onClick={onClose}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40">
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground">
            Add new agents
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Browse and add more assistants
          </p>
        </div>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header icon button
// ---------------------------------------------------------------------------
function HdrBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode
  title: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/20 hover:text-white"
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
function MessageBubble({
  msg,
  msgIdx,
  onChipClick,
  copied,
  thumbed,
  onCopy,
  onThumb,
}: {
  msg: Message
  msgIdx: number
  onChipClick: (text: string) => void
  copied: boolean
  thumbed: 'up' | 'down' | undefined
  onCopy: () => void
  onThumb: (dir: 'up' | 'down') => void
}) {
  const isAI = msg.role === 'assistant'
  const avatarUid = useId()

  return (
    <div className={cn('flex gap-2', !isAI && 'flex-row-reverse')}>
      {isAI && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <img
            src="/logos/heytalia-logo.svg"
            alt="HeyTalia"
            className="h-4 w-4"
          />
        </div>
      )}

      <div
        className={cn(
          'min-w-0 space-y-2',
          isAI ? 'max-w-[85%]' : 'max-w-[78%] items-end',
        )}
      >
        {/* Bubble: white card for AI, brand colour for user */}
        <div
          className={cn(
            'rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
            isAI
              ? 'rounded-tl-sm border border-border bg-white text-foreground shadow-xs'
              : 'rounded-tr-sm text-white',
          )}
          style={!isAI ? { background: HT.primary } : undefined}
        >
          <MarkdownText text={msg.text} isUser={!isAI} />
        </div>

        {msg.draft && (
          <DraftCard
            draft={msg.draft}
            msgIdx={msgIdx}
            copied={copied}
            thumbed={thumbed}
            onCopy={onCopy}
            onThumb={onThumb}
          />
        )}

        {/* Chips — text-only, no emoji */}
        {msg.chips && msg.chips.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-0.5">
            {msg.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onChipClick(chip)}
                className="inline-flex h-8 items-center rounded-4xl border border-border bg-muted px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Draft card
// ---------------------------------------------------------------------------
function DraftCard({
  draft,
  msgIdx,
  copied,
  thumbed,
  onCopy,
  onThumb,
}: {
  draft: DraftBlock
  msgIdx: number
  copied: boolean
  thumbed: 'up' | 'down' | undefined
  onCopy: () => void
  onThumb: (dir: 'up' | 'down') => void
}) {
  return (
    <div className="space-y-2">
      <div
        className="overflow-hidden rounded-lg border bg-white"
        style={{ borderColor: HT.border }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 border-b px-3 py-2"
          style={{ borderColor: HT.border, background: HT.ultraLight }}
        >
          <span className="text-xs font-medium text-muted-foreground">
            Title
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: HT.light, color: HT.text }}
          >
            {draft.title}
          </span>
        </div>
        <div className="px-3 py-2.5">
          <DraftBody body={draft.body} />
        </div>
      </div>

      {/* Warning */}
      <div
        className="flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] leading-snug"
        style={{
          background: HT.ultraLight,
          borderColor: HT.border,
          color: HT.text,
        }}
      >
        <Info
          className="mt-0.5 h-3 w-3 shrink-0"
          style={{ color: 'var(--slate-11)' }}
        />
        <MarkdownText text={draft.warning} isUser={false} />
      </div>

      {/* Single action row: icons left · buttons right */}
      <div className="flex items-center gap-1">
        {/* Icon buttons */}
        <DraftIconBtn
          title={copied ? 'Copied!' : 'Copy draft'}
          onClick={onCopy}
          active={copied}
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </DraftIconBtn>
        <DraftIconBtn title="Edit draft">
          <Pencil className="h-3 w-3" />
        </DraftIconBtn>
        <DraftIconBtn
          title="Good response"
          onClick={() => onThumb('up')}
          active={thumbed === 'up'}
        >
          <ThumbsUp className="h-3 w-3" />
        </DraftIconBtn>
        <DraftIconBtn
          title="Poor response"
          onClick={() => onThumb('down')}
          active={thumbed === 'down'}
        >
          <ThumbsDown className="h-3 w-3" />
        </DraftIconBtn>

        {/* Action buttons pushed to right */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-4xl border border-border bg-white px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Mail className="h-3 w-3" />
            Send email
          </button>
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-4xl bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Use draft
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Draft icon button
// ---------------------------------------------------------------------------
function DraftIconBtn({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode
  title: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-secondary text-secondary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Draft body renderer
// ---------------------------------------------------------------------------
function DraftBody({ body }: { body: string }) {
  return (
    <div className="space-y-0.5">
      {body.split('\n').map((line, li) => {
        if (!line) return <div key={li} className="h-1.5" />
        return (
          <p key={li} className="text-xs leading-relaxed text-foreground">
            {line.split(/(\[For input[^\]]*\])/g).map((part, pi) =>
              part.startsWith('[For input') ? (
                <span
                  key={pi}
                  className="mx-0.5 inline-block rounded-full px-2 py-0.5 align-middle text-[10px] font-medium"
                  style={{ background: HT.light, color: HT.text }}
                >
                  {part}
                </span>
              ) : (
                <span key={pi}>{parseBold(part, false)}</span>
              ),
            )}
          </p>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <img
          src="/logos/heytalia-logo.svg"
          alt="HeyTalia"
          className="h-4 w-4"
        />
      </div>
      <div className="flex items-center gap-1 rounded-xl rounded-tl-sm border border-border bg-white px-3.5 py-2.5 shadow-xs">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------
function MarkdownText({ text, isUser }: { text: string; isUser: boolean }) {
  return (
    <>
      {text.split('\n').map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {parseBold(line, isUser)}
        </span>
      ))}
    </>
  )
}

function parseBold(text: string, isUser: boolean) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return (
        <strong
          key={i}
          className={isUser ? 'font-semibold' : 'font-semibold text-foreground'}
        >
          {part.slice(2, -2)}
        </strong>
      )
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return (
        <em key={i} className={isUser ? 'opacity-90' : 'text-muted-foreground'}>
          {part.slice(1, -1)}
        </em>
      )
    return part
  })
}

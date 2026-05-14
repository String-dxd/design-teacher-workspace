import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { ArrowRight, ArrowUp, LineChart, Search, Sparkles } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { KeyboardEvent } from 'react'
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAGS_STORAGE_KEY,
} from '@/lib/feature-flags'

import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/insight-buddy')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)
    const flags = stored
      ? { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) }
      : DEFAULT_FEATURE_FLAGS
    if (!flags['student-analytics']) throw redirect({ to: '/' })
  },
  component: InsightBuddyPage,
})

const SUGGESTIONS = [
  { label: 'Who has LTA this term?', resultType: 'lta' as const },
  { label: 'Show me students who require more support on LEAPS?' },
  {
    label: "How does this term's weighted assessment compare to last term?",
    resultType: 'performance-per-subject' as const,
  },
]

const TOTAL_SCHOOL_DAYS = 45

interface LtaStudent {
  name: string
  class: string
  attendedDays: number
  latecoming: number
  absentWithoutValidReason: number
  absentWithValidReasonPrivate: number
  absentWithValidReasonOfficial: number
  absentWithMC: number
  absencePendingReason: number
}

const LTA_STUDENTS: Array<LtaStudent> = [
  {
    name: 'Lim Zhi Yong',
    class: '3A',
    attendedDays: 30,
    latecoming: 5,
    absentWithoutValidReason: 4,
    absentWithValidReasonPrivate: 2,
    absentWithValidReasonOfficial: 1,
    absentWithMC: 2,
    absencePendingReason: 1,
  },
  {
    name: 'Tan Mei Ling',
    class: '3A',
    attendedDays: 32,
    latecoming: 3,
    absentWithoutValidReason: 3,
    absentWithValidReasonPrivate: 1,
    absentWithValidReasonOfficial: 0,
    absentWithMC: 4,
    absencePendingReason: 2,
  },
  {
    name: 'Tan Wei Ming',
    class: '3B',
    attendedDays: 28,
    latecoming: 8,
    absentWithoutValidReason: 6,
    absentWithValidReasonPrivate: 3,
    absentWithValidReasonOfficial: 0,
    absentWithMC: 3,
    absencePendingReason: 2,
  },
  {
    name: 'Goh Hui Wen',
    class: '3B',
    attendedDays: 31,
    latecoming: 2,
    absentWithoutValidReason: 5,
    absentWithValidReasonPrivate: 2,
    absentWithValidReasonOfficial: 1,
    absentWithMC: 3,
    absencePendingReason: 1,
  },
  {
    name: 'Lim Jia Xuan',
    class: '3C',
    attendedDays: 29,
    latecoming: 6,
    absentWithoutValidReason: 3,
    absentWithValidReasonPrivate: 4,
    absentWithValidReasonOfficial: 2,
    absentWithMC: 1,
    absencePendingReason: 0,
  },
  {
    name: 'Chua Jian Hao',
    class: '4A',
    attendedDays: 27,
    latecoming: 10,
    absentWithoutValidReason: 7,
    absentWithValidReasonPrivate: 1,
    absentWithValidReasonOfficial: 0,
    absentWithMC: 2,
    absencePendingReason: 1,
  },
  {
    name: 'Chen Yu Ting',
    class: '4A',
    attendedDays: 33,
    latecoming: 4,
    absentWithoutValidReason: 2,
    absentWithValidReasonPrivate: 3,
    absentWithValidReasonOfficial: 1,
    absentWithMC: 2,
    absencePendingReason: 1,
  },
  {
    name: 'Ng Wei Sheng',
    class: '4B',
    attendedDays: 26,
    latecoming: 7,
    absentWithoutValidReason: 8,
    absentWithValidReasonPrivate: 2,
    absentWithValidReasonOfficial: 0,
    absentWithMC: 1,
    absencePendingReason: 1,
  },
  {
    name: 'Foo Jia Min',
    class: '4B',
    attendedDays: 34,
    latecoming: 3,
    absentWithoutValidReason: 2,
    absentWithValidReasonPrivate: 1,
    absentWithValidReasonOfficial: 2,
    absentWithMC: 3,
    absencePendingReason: 0,
  },
  {
    name: 'Lee Kai Wen',
    class: '4C',
    attendedDays: 30,
    latecoming: 5,
    absentWithoutValidReason: 4,
    absentWithValidReasonPrivate: 2,
    absentWithValidReasonOfficial: 1,
    absentWithMC: 2,
    absencePendingReason: 1,
  },
  {
    name: 'Tan Hui Xian',
    class: '3C',
    attendedDays: 25,
    latecoming: 9,
    absentWithoutValidReason: 6,
    absentWithValidReasonPrivate: 1,
    absentWithValidReasonOfficial: 0,
    absentWithMC: 2,
    absencePendingReason: 2,
  },
  {
    name: 'Wong Jing Yi',
    class: '4C',
    attendedDays: 31,
    latecoming: 4,
    absentWithoutValidReason: 3,
    absentWithValidReasonPrivate: 2,
    absentWithValidReasonOfficial: 1,
    absentWithMC: 3,
    absencePendingReason: 1,
  },
]

const PERFORMANCE_DATA = [
  { subject: 'English', thisTerm: 72, lastTerm: 68 },
  { subject: 'Maths', thisTerm: 65, lastTerm: 70 },
  { subject: 'Science', thisTerm: 78, lastTerm: 74 },
  { subject: 'History', thisTerm: 60, lastTerm: 63 },
  { subject: 'Geography', thisTerm: 74, lastTerm: 69 },
  { subject: 'Literature', thisTerm: 81, lastTerm: 77 },
]

type ResultType = 'performance-per-subject' | 'lta' | 'generic'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  resultType?: ResultType
}

function ChatEmptyState({
  onSuggestion,
}: {
  onSuggestion: (text: string, resultType?: ResultType) => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      {/* Animated icon */}
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="animate-sparkle-idle size-7 text-primary" />
        {/* Subtle ring */}
        <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/5 [animation-duration:2.5s]" />
      </div>

      {/* Title + description */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          What would you like to explore?
        </h2>
        <p className="text-sm text-muted-foreground">
          Spot patterns, understand trends, or identify students who may need
          support.
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="flex w-full flex-col gap-2">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => onSuggestion(s.label, s.resultType)}
            className="group animate-fade-slide-up flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-left text-sm transition-all hover:-translate-y-px hover:border-primary/20 hover:bg-primary/5 hover:shadow-sm active:translate-y-0"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="text-foreground flex-1">{s.label}</span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary/60" />
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultsEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted opacity-50">
        <LineChart className="size-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-muted-foreground">Your canvas awaits</p>
        <p className="text-sm text-muted-foreground/60">
          Ask a question on the left — charts and tables will appear here
        </p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="animate-msg-in flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="animate-sparkle-idle size-4" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3">
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

function PerformancePerSubjectChart() {
  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold">Results over time</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Weighted assessment comparison: this term vs last term
        </p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={PERFORMANCE_DATA}
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          barCategoryGap="30%"
          barGap={4}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid hsl(var(--border))',
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}%`]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
            formatter={(value) =>
              value === 'thisTerm' ? 'This Term' : 'Last Term'
            }
          />
          <Bar
            dataKey="thisTerm"
            name="thisTerm"
            fill="#228be6"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="lastTerm"
            name="lastTerm"
            fill="#12b886"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function LtaResultsTable() {
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')

  const classes = useMemo(
    () => [...new Set(LTA_STUDENTS.map((s) => s.class))].sort(),
    [],
  )

  const filtered = useMemo(() => {
    return LTA_STUDENTS.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase())
      const matchesClass = classFilter === 'all' || s.class === classFilter
      return matchesSearch && matchesClass
    })
  }, [search, classFilter])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-xl border bg-background shadow-sm">
        {/* Search & Filters */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="pl-9"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background">
                  Name
                </TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-center">Attendance</TableHead>
                <TableHead className="text-center">Latecoming</TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  Absent w/o Valid Reason
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  Absent w/ Valid Reason (Private)
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  Absent w/ Valid Reason (Official)
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  Absent w/ MC
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  Absence Pending Reason
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => (
                <TableRow key={student.name}>
                  <TableCell className="sticky left-0 bg-background font-medium">
                    {student.name}
                  </TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell className="text-center">
                    {student.attendedDays}/{TOTAL_SCHOOL_DAYS}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.latecoming}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.absentWithoutValidReason}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.absentWithValidReasonPrivate}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.absentWithValidReasonOfficial}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.absentWithMC}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.absencePendingReason}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No students found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          Showing {filtered.length} of {LTA_STUDENTS.length} students with LTA
          this term
        </div>
      </div>
    </div>
  )
}

function InsightBuddyPage() {
  useSetBreadcrumbs([{ label: 'Insight Buddy', href: '/insight-buddy' }])

  const [messages, setMessages] = useState<Array<Message>>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeResultType, setActiveResultType] = useState<ResultType | null>(
    null,
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleSend(text?: string, resultType?: ResultType) {
    const query = (text ?? input).trim()
    if (!query || isTyping) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const assistantContent =
        resultType === 'performance-per-subject'
          ? "Here's a comparison of weighted assessment scores per subject for this term versus last term."
          : resultType === 'lta'
            ? `I found ${LTA_STUDENTS.length} students with Long-Term Absenteeism (LTA) this term. The results are shown on the right.`
            : `I'm analysing your query: "${query}". Results will appear on the right.`

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        resultType,
      }

      setIsTyping(false)
      setMessages((prev) => [...prev, assistantMsg])
      setActiveResultType(resultType ?? 'generic')
    }, 900)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0 && !isTyping

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left: Chat panel ───────────────────────────── */}
      <div className="flex w-2/5 shrink-0 flex-col border-r bg-background">
        {/* Header */}
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Sparkles className="size-4 text-primary" />
          <span className="font-semibold">Insight Buddy</span>
          <Badge
            variant="outline"
            className="border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300"
          >
            Experiment
          </Badge>
        </div>

        {/* Messages / Empty state */}
        {isEmpty ? (
          <ChatEmptyState onSuggestion={handleSend} />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'animate-msg-in flex gap-3',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                      msg.role === 'assistant'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <Sparkles className="size-4" />
                    ) : (
                      'You'
                    )}
                  </div>
                  {/* Bubble */}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-3">
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
              size="icon-sm"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="shrink-0 transition-transform active:scale-90"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right: Results panel ───────────────────────── */}
      <div className="flex w-3/5 flex-col overflow-hidden bg-muted/30">
        <div className="flex h-14 items-center gap-2 border-b bg-background px-6">
          <span className="font-semibold text-muted-foreground">
            {activeResultType ? 'Generated View' : 'Results'}
          </span>
        </div>

        {activeResultType === 'lta' ? (
          <div
            key="lta"
            className="animate-fade-slide-up flex-1 overflow-auto p-6"
          >
            <LtaResultsTable />
          </div>
        ) : activeResultType === 'performance-per-subject' ? (
          <div
            key="perf"
            className="animate-fade-slide-up flex-1 overflow-auto p-6"
          >
            <PerformancePerSubjectChart />
          </div>
        ) : activeResultType === 'generic' ? (
          <div
            key="generic"
            className="animate-fade-slide-up flex-1 overflow-auto p-6"
          >
            <div className="rounded-xl border bg-background p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Analytics results will appear here based on your query.
              </p>
            </div>
          </div>
        ) : (
          <ResultsEmptyState />
        )}
      </div>
    </div>
  )
}

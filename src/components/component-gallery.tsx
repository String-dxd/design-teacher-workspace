'use client'

import { useState } from 'react'
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ArrowRightIcon,
  BoldIcon,
  GraduationCap,
  Inbox,
  LogOutIcon,
  SearchIcon,
  SettingsIcon,
  TerminalIcon,
  UserIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import type { FormQuestion } from '@/types/form'
import type { AnnouncementFilters } from '@/components/comms/announcement-filter-bar'
import { Example } from '@/components/example'
// UI primitives
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
// Shared components
import { AgencyLogo } from '@/components/agency-logo'
import { AppCard, FeaturedAppCard } from '@/components/app-card'
import {
  AnnouncementFilterBar,
  EMPTY_ANNOUNCEMENT_FILTERS,
} from '@/components/comms/announcement-filter-bar'
import { QuestionBuilder } from '@/components/comms/question-builder'
import { ReadRate } from '@/components/comms/read-rate'
import { StatusBadge } from '@/components/comms/status-badge'
import { DataCard } from '@/components/data-card'
import { EmptyState } from '@/components/empty-state'
import { FeedbackDialog } from '@/components/feedback-dialog'

// Stateful demos ----------------------------------------------------------

function FeedbackDialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Send feedback</Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

function AnnouncementFilterBarDemo() {
  const [filters, setFilters] = useState<AnnouncementFilters>(
    EMPTY_ANNOUNCEMENT_FILTERS,
  )
  return <AnnouncementFilterBar filters={filters} onChange={setFilters} />
}

function QuestionBuilderDemo() {
  const [questions, setQuestions] = useState<Array<FormQuestion>>([
    { id: '1', text: 'Will your child attend?', type: 'free-text' },
    {
      id: '2',
      text: 'Preferred slot',
      type: 'mcq',
      options: ['Morning', 'Afternoon'],
    },
  ])
  return (
    <QuestionBuilder questions={questions} onChange={setQuestions} />
  )
}

// Section + item scaffolding ----------------------------------------------

type GalleryItem = { title: string; node: ReactNode }

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const PRIMITIVES: Array<GalleryItem> = [
  {
    title: 'Button',
    node: (
      <div className="flex flex-wrap items-center gap-2">
        <Button>Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button disabled>Disabled</Button>
      </div>
    ),
  },
  {
    title: 'Badge',
    node: (
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    ),
  },
  {
    title: 'Input',
    node: (
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Input placeholder="Email address" type="email" />
        <Input defaultValue="Read-only value" disabled />
        <Input placeholder="Invalid" aria-invalid />
      </div>
    ),
  },
  {
    title: 'Textarea',
    node: (
      <Textarea
        className="max-w-sm"
        placeholder="Add any additional comments"
      />
    ),
  },
  {
    title: 'Field',
    node: (
      <FieldGroup className="max-w-sm">
        <Field>
          <FieldLabel htmlFor="g-name">Name</FieldLabel>
          <Input id="g-name" placeholder="Enter your name" />
        </Field>
      </FieldGroup>
    ),
  },
  {
    title: 'Checkbox',
    node: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox id="g-cb1" defaultChecked />
          <Label htmlFor="g-cb1">Accept terms</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="g-cb2" indeterminate />
          <Label htmlFor="g-cb2">Indeterminate</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="g-cb3" disabled />
          <Label htmlFor="g-cb3">Disabled</Label>
        </div>
      </div>
    ),
  },
  {
    title: 'Switch',
    node: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Switch id="g-sw1" defaultChecked />
          <Label htmlFor="g-sw1">Notifications</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="g-sw2" size="sm" />
          <Label htmlFor="g-sw2">Small, off</Label>
        </div>
      </div>
    ),
  },
  {
    title: 'Toggle',
    node: (
      <div className="flex items-center gap-2">
        <Toggle defaultPressed aria-label="Bold">
          <BoldIcon />
        </Toggle>
        <Toggle variant="outline">Outline</Toggle>
        <Toggle disabled>Disabled</Toggle>
      </div>
    ),
  },
  {
    title: 'Toggle Group',
    node: (
      <ToggleGroup variant="outline" defaultValue={['center']}>
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRightIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    ),
  },
  {
    title: 'Tabs',
    node: (
      <Tabs defaultValue="overview" className="w-full max-w-sm">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview panel content.</TabsContent>
        <TabsContent value="activity">Activity panel content.</TabsContent>
      </Tabs>
    ),
  },
  {
    title: 'Select',
    node: (
      <Select defaultValue="apple">
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="cherry">Cherry</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    ),
  },
  {
    title: 'Combobox',
    node: (
      <Combobox items={['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro']}>
        <ComboboxInput placeholder="Select a framework" className="w-56" />
        <ComboboxContent>
          <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ),
  },
  {
    title: 'Avatar',
    node: (
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src="https://i.pravatar.cc/80?img=1" alt="User" />
          <AvatarFallback>RA</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
      </div>
    ),
  },
  {
    title: 'Alert',
    node: (
      <div className="flex w-full flex-col gap-3">
        <Alert>
          <TerminalIcon />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components to your app.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <TerminalIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Your session has expired.</AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    title: 'Accordion',
    node: (
      <Accordion className="w-full max-w-sm" defaultValue={['item-1']}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It follows WAI-ARIA patterns.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>Yes, with matching tokens.</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  {
    title: 'Skeleton',
    node: (
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    ),
  },
  {
    title: 'Separator',
    node: (
      <div className="flex flex-col gap-3">
        <span>Above</span>
        <Separator />
        <div className="flex h-5 items-center gap-3">
          <span>Left</span>
          <Separator orientation="vertical" />
          <span>Right</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Breadcrumb',
    node: (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Students</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    ),
  },
  {
    title: 'Pagination',
    node: (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    ),
  },
  {
    title: 'Input Group',
    node: (
      <InputGroup className="max-w-xs">
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search…" />
        <InputGroupAddon align="inline-end">
          <ArrowRightIcon />
        </InputGroupAddon>
      </InputGroup>
    ),
  },
  {
    title: 'Card',
    node: (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Please fill in your details below.</CardDescription>
        </CardHeader>
        <CardContent>Card body content goes here.</CardContent>
        <CardFooter>
          <Button>Save</Button>
        </CardFooter>
      </Card>
    ),
  },
  {
    title: 'Tooltip',
    node: (
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
        <TooltipContent>Add to library</TooltipContent>
      </Tooltip>
    ),
  },
  {
    title: 'Dialog',
    node: (
      <Dialog>
        <DialogTrigger render={<Button>Open dialog</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Make changes, then save.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
  },
  {
    title: 'Sheet',
    node: (
      <Sheet>
        <SheetTrigger render={<Button variant="outline">Open sheet</Button>} />
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Panel title</SheetTitle>
            <SheetDescription>Slide-over content.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button>Done</Button>} />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    ),
  },
  {
    title: 'Popover',
    node: (
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline">Open popover</Button>}
        />
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>Set the layout dimensions.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    ),
  },
  {
    title: 'Dropdown Menu',
    node: (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline">Open menu</Button>}
        />
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>
            <UserIcon />
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    title: 'Alert Dialog',
    node: (
      <AlertDialog>
        <AlertDialogTrigger
          render={<Button variant="destructive">Delete</Button>}
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
  },
]

const SHARED: Array<GalleryItem> = [
  {
    title: 'Status Badge',
    node: (
      <div className="flex gap-2">
        <StatusBadge status="posted" />
        <StatusBadge status="scheduled" />
        <StatusBadge status="draft" />
      </div>
    ),
  },
  {
    title: 'Read Rate',
    node: (
      <div className="flex w-full flex-col gap-3">
        <ReadRate readCount={42} totalCount={58} />
        <ReadRate readCount={11} totalCount={58} />
        <ReadRate readCount={42} totalCount={58} compact />
      </div>
    ),
  },
  {
    title: 'Data Card',
    node: (
      <div className="grid w-full grid-cols-2 gap-3">
        <DataCard
          label="Read rate"
          value="92%"
          description="vs 78% last term"
          trend="improving"
        />
        <DataCard
          label="Pending"
          value={14}
          description="awaiting response"
          trend="declining"
        />
      </div>
    ),
  },
  {
    title: 'App Card',
    node: (
      <div className="flex w-full flex-col gap-4">
        <AppCard
          name="Parents Gateway"
          description="Send announcements and consent forms to parents."
          icon={GraduationCap}
          color="blue"
          href="https://example.com"
          badge="Beta"
        />
        <FeaturedAppCard
          name="Student Analytics"
          description="Track wellbeing and academic signals."
          icon={GraduationCap}
          color="green"
          href="https://example.com"
          badge="New"
        />
      </div>
    ),
  },
  {
    title: 'Agency Logo',
    node: (
      <div className="flex items-end gap-4">
        <AgencyLogo agency="Ministry of Education" size="sm" />
        <AgencyLogo agency="Health Promotion Board" size="md" />
      </div>
    ),
  },
  {
    title: 'Empty State',
    node: (
      <div className="flex min-h-[260px] w-full">
        <EmptyState
          icon={<Inbox className="size-8 text-muted-foreground" />}
          title="No announcements yet"
          description="When you post to Parents Gateway, your announcements show up here."
          action={<Button>Create announcement</Button>}
        />
      </div>
    ),
  },
  { title: 'Feedback Dialog', node: <FeedbackDialogDemo /> },
  { title: 'Announcement Filter Bar', node: <AnnouncementFilterBarDemo /> },
  { title: 'Question Builder', node: <QuestionBuilderDemo /> },
]

function Item({
  title,
  group,
  children,
}: {
  title: string
  group: string
  children: ReactNode
}) {
  return (
    <div
      id={slug(title)}
      data-ds-section={title}
      data-ds-group={group}
      className="scroll-mt-6"
    >
      <Example title={title}>{children}</Example>
    </div>
  )
}

function Section({
  group,
  description,
  items,
}: {
  group: string
  description: string
  items: Array<GalleryItem>
}) {
  return (
    <section className="mb-12">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">{group}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {items.map((item) => (
          <Item key={item.title} title={item.title} group={group}>
            {item.node}
          </Item>
        ))}
      </div>
    </section>
  )
}

export function ComponentGallery() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">Components</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live, real components from the app — primitives and shared
          communication components.
        </p>
      </header>
      <Section
        group="UI Primitives"
        description="Shadcn on Base UI — src/components/ui."
        items={PRIMITIVES}
      />
      <Section
        group="Shared Components"
        description="Reusable app components — src/components & src/components/comms."
        items={SHARED}
      />
    </div>
  )
}

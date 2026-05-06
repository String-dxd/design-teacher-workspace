import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  onBlur?: () => void
  minHeight?: string
  toolbar?: 'full' | 'simple'
}

interface ToolbarButtonProps {
  onClick: () => void
  title: string
  isActive?: boolean
  children: React.ReactNode
}

function ToolbarButton({
  onClick,
  title,
  isActive,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors',
        isActive
          ? 'bg-slate-100 text-foreground ring-1 ring-slate-200'
          : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-4 w-px shrink-0 bg-border" />
}

export const RichTextEditor = memo(function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  onBlur,
  minHeight = '120px',
  toolbar = 'full',
}: RichTextEditorProps) {
  const [alignOpen, setAlignOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const alignRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // With immediatelyRender: false, useEditor returns null on the first render pass (SSR-safe).
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class: [
          'outline-none px-3 py-2.5 text-sm leading-relaxed focus:outline-none',
          '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-1',
          '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-1',
          '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-0.5',
          '[&_a]:text-primary [&_a]:underline',
          '[&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-0.5',
          '[&_ol]:ml-4 [&_ol]:list-decimal [&_ol]:space-y-0.5',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic',
          '[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em]',
          '[&_mark]:rounded [&_mark]:bg-yellow-100 [&_mark]:px-0.5',
        ].join(' '),
      },
    },
  })

  // Sync external value when not focused (e.g. loading a saved draft)
  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML() && !editor.view.hasFocus()) {
      editor.commands.setContent(value || '', false)
    }
  }, [editor, value])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter link URL:', previousUrl ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
  }, [editor])

  // Guard: immediatelyRender: false causes useEditor to return null on the first render pass.
  // All hooks above are called unconditionally (Rules of Hooks). This guard is placed after
  // all hooks, before any editor.* access, so it is safe.
  if (!editor) return null

  const showPlaceholder = editor.isEmpty && !value && Boolean(placeholder)

  // Pre-compute active states for toolbar buttons
  const active = {
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    underline: editor.isActive('underline'),
    strike: editor.isActive('strike'),
    code: editor.isActive('code'),
    h1: editor.isActive('heading', { level: 1 }),
    h2: editor.isActive('heading', { level: 2 }),
    h3: editor.isActive('heading', { level: 3 }),
    alignLeft: editor.isActive({ textAlign: 'left' }),
    alignCenter: editor.isActive({ textAlign: 'center' }),
    alignRight: editor.isActive({ textAlign: 'right' }),
    bulletList: editor.isActive('bulletList'),
    orderedList: editor.isActive('orderedList'),
    taskList: editor.isActive('taskList'),
    blockquote: editor.isActive('blockquote'),
    link: editor.isActive('link'),
    highlight: editor.isActive('highlight'),
  }

  // Convenience — chain always from focus
  const cmd = editor.chain().focus()

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border bg-background',
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 overflow-x-auto border-b px-2 py-1 scrollbar-none">
        {toolbar === 'simple' ? (
          <>
            {/* Bold */}
            <ToolbarButton
              onClick={() => cmd.toggleBold().run()}
              isActive={active.bold}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            {/* Italic */}
            <ToolbarButton
              onClick={() => cmd.toggleItalic().run()}
              isActive={active.italic}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            {/* Underline */}
            <ToolbarButton
              onClick={() => cmd.toggleUnderline().run()}
              isActive={active.underline}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            {/* Alignment dropdown */}
            <div className="relative" ref={alignRef}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setAlignOpen((o) => !o)
                  setListOpen(false)
                }}
                title="Text alignment"
                className="flex h-7 items-center gap-0.5 rounded px-1 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
              >
                {active.alignCenter ? (
                  <AlignCenter className="h-3.5 w-3.5" />
                ) : active.alignRight ? (
                  <AlignRight className="h-3.5 w-3.5" />
                ) : (
                  <AlignLeft className="h-3.5 w-3.5" />
                )}
                <ChevronDown className="h-3 w-3" />
              </button>
              {alignOpen && (
                <div className="absolute left-0 top-full z-20 mt-0.5 flex flex-col rounded-md border bg-background shadow-md">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      cmd.setTextAlign('left').run()
                      setAlignOpen(false)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-100"
                  >
                    <AlignLeft className="h-3.5 w-3.5" /> Left
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      cmd.setTextAlign('center').run()
                      setAlignOpen(false)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-100"
                  >
                    <AlignCenter className="h-3.5 w-3.5" /> Centre
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      cmd.setTextAlign('right').run()
                      setAlignOpen(false)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-100"
                  >
                    <AlignRight className="h-3.5 w-3.5" /> Right
                  </button>
                </div>
              )}
            </div>

            {/* List dropdown */}
            <div className="relative" ref={listRef}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setListOpen((o) => !o)
                  setAlignOpen(false)
                }}
                title="Lists"
                className="flex h-7 items-center gap-0.5 rounded px-1 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
              >
                {active.orderedList ? (
                  <ListOrdered className="h-3.5 w-3.5" />
                ) : active.taskList ? (
                  <ListChecks className="h-3.5 w-3.5" />
                ) : (
                  <List className="h-3.5 w-3.5" />
                )}
                <ChevronDown className="h-3 w-3" />
              </button>
              {listOpen && (
                <div className="absolute left-0 top-full z-20 mt-0.5 flex flex-col rounded-md border bg-background shadow-md">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      cmd.toggleBulletList().run()
                      setListOpen(false)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-100"
                  >
                    <List className="h-3.5 w-3.5" /> Bullet list
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      cmd.toggleOrderedList().run()
                      setListOpen(false)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-100"
                  >
                    <ListOrdered className="h-3.5 w-3.5" /> Numbered list
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      cmd.toggleTaskList().run()
                      setListOpen(false)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-100"
                  >
                    <ListChecks className="h-3.5 w-3.5" /> Checklist
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Group 1: inline marks */}
            <ToolbarButton
              onClick={() => cmd.toggleBold().run()}
              isActive={active.bold}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.toggleItalic().run()}
              isActive={active.italic}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.toggleUnderline().run()}
              isActive={active.underline}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.toggleStrike().run()}
              isActive={active.strike}
              title="Strikethrough"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.toggleCode().run()}
              isActive={active.code}
              title="Inline code"
            >
              <Code className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            {/* Group 2: headings */}
            <ToolbarButton
              onClick={() => cmd.toggleHeading({ level: 1 }).run()}
              isActive={active.h1}
              title="Heading 1"
            >
              <Heading1 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.toggleHeading({ level: 2 }).run()}
              isActive={active.h2}
              title="Heading 2"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.toggleHeading({ level: 3 }).run()}
              isActive={active.h3}
              title="Heading 3"
            >
              <Heading3 className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            {/* Group 3: alignment */}
            <ToolbarButton
              onClick={() => cmd.setTextAlign('left').run()}
              isActive={active.alignLeft}
              title="Align left"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.setTextAlign('center').run()}
              isActive={active.alignCenter}
              title="Align centre"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.setTextAlign('right').run()}
              isActive={active.alignRight}
              title="Align right"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            {/* Group 4: lists */}
            <ToolbarButton
              onClick={() => cmd.toggleBulletList().run()}
              isActive={active.bulletList}
              title="Bullet list"
            >
              <List className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.toggleOrderedList().run()}
              isActive={active.orderedList}
              title="Numbered list"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.toggleTaskList().run()}
              isActive={active.taskList}
              title="Checklist"
            >
              <ListChecks className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            {/* Group 5: block */}
            <ToolbarButton
              onClick={() => cmd.toggleBlockquote().run()}
              isActive={active.blockquote}
              title="Blockquote"
            >
              <Quote className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            {/* Group 6: insert + highlight */}
            <ToolbarButton
              onClick={setLink}
              isActive={active.link}
              title="Insert / edit link"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => cmd.toggleHighlight().run()}
              isActive={active.highlight}
              title="Highlight"
            >
              <Highlighter className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            {/* Group 7: utilities */}
            <ToolbarButton
              onClick={() => cmd.unsetAllMarks().clearNodes().run()}
              title="Clear formatting"
            >
              <RemoveFormatting className="h-3.5 w-3.5" />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editable area with overlay placeholder */}
      <div className="relative">
        {showPlaceholder && (
          <p className="pointer-events-none absolute left-3 top-2.5 select-none text-sm text-muted-foreground">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} style={{ minHeight }} />
      </div>
    </div>
  )
})

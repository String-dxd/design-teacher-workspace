import { createFileRoute } from '@tanstack/react-router'

import { CHART_LABEL, CHART_SURFACE } from '@/lib/chart-colors'

export const Route = createFileRoute('/_guest/preview-menu')({
  component: PreviewMenu,
})

const TWBLUE = {
  3: 'var(--color-twblue-3)',
  4: 'var(--color-twblue-4)',
  5: 'var(--color-twblue-5)',
  9: 'var(--color-twblue-9)',
  11: 'var(--color-twblue-11)',
}

const SLATE = {
  1: 'var(--color-slate-1)',
  2: 'var(--color-slate-2)',
  3: 'var(--color-slate-3)',
  5: 'var(--color-slate-5)',
  6: 'var(--color-slate-6)',
  7: 'var(--color-slate-7)',
  8: 'var(--color-slate-8)',
  9: 'var(--color-slate-9)',
  10: 'var(--color-slate-10)',
  11: 'var(--color-slate-11)',
  12: 'var(--color-slate-12)',
}

// HeyTalia mascot artwork hue — reserved, do not migrate to a palette var.
const AGENT_PURPLE = '#9575CD'

function PreviewMenu() {
  return (
    <div
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: SLATE[2],
        minHeight: '100vh',
        padding: '48px 32px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 56,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: SLATE[9],
        }}
      >
        HeyTalia Panel — Agent Switcher Inside the Panel
      </p>

      <div
        style={{
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* ── A: HEADER DROPDOWN ── */}
        <PanelCol
          label="A · Header Dropdown"
          desc="Agent name in the header is clickable. Opens a compact inline menu to switch agents."
        >
          <div
            style={{
              width: 310,
              background: CHART_SURFACE,
              border: `1px solid ${SLATE[6]}`,
              borderRadius: 16,
              boxShadow: '0 12px 40px rgba(0,0,0,.09)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            {/* Header */}
            <div
              style={{
                height: 56,
                borderBottom: `1px solid ${SLATE[6]}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 10px 0 12px',
                borderRadius: '16px 16px 0 0',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                  padding: '5px 8px 5px 6px',
                  borderRadius: 9,
                  border: `1px solid ${SLATE[5]}`,
                  background: SLATE[2],
                }}
              >
                <AgentIcon />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: SLATE[12],
                      }}
                    >
                      HeyTalia
                    </span>
                    <BetaBadge />
                  </div>
                  <div style={{ fontSize: 11, color: SLATE[9], marginTop: 1 }}>
                    Teacher Assistant
                  </div>
                </div>
                <ChevronDownIcon />
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <IconBtn>
                  <ExpandIcon />
                </IconBtn>
                <IconBtn>
                  <MinusIcon />
                </IconBtn>
              </div>
              {/* Dropdown shown open */}
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 8,
                  right: 8,
                  background: CHART_SURFACE,
                  border: `1px solid ${SLATE[6]}`,
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,.1)',
                  padding: 6,
                  zIndex: 10,
                }}
              >
                {/* Active item */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: 8,
                    borderRadius: 9,
                    background: SLATE[3],
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: `color-mix(in srgb, ${AGENT_PURPLE} 9%, transparent)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src="/logos/heytalia-logo.svg"
                      alt="HeyTalia"
                      style={{ width: 20, height: 20 }}
                    />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: SLATE[12],
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      HeyTalia <BetaBadge />
                    </div>
                    <div
                      style={{ fontSize: 11, color: SLATE[9], marginTop: 1 }}
                    >
                      Draft announcements &amp; parent comms
                    </div>
                  </div>
                  <CheckIcon />
                </div>
                <div
                  style={{
                    height: 1,
                    background: SLATE[5],
                    margin: '4px 0',
                    opacity: 0.6,
                  }}
                />
                {/* Add row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '7px 8px',
                    borderRadius: 9,
                    color: SLATE[9],
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: `1.5px dashed ${SLATE[6]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PlusIcon color={SLATE[8]} />
                  </div>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: SLATE[10],
                    }}
                  >
                    Add assistants
                  </span>
                </div>
              </div>
            </div>
            {/* Messages — pushed down to clear dropdown */}
            <div
              style={{
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginTop: 100,
              }}
            >
              <ChatBubble />
            </div>
            <PanelInput />
          </div>
        </PanelCol>

        {/* ── B: AVATAR STACK ── */}
        <PanelCol
          label="B · Avatar Stack in Header"
          desc="All agents shown as pill buttons at the top. Active one is highlighted. One-tap to switch."
          recommended
        >
          <div
            style={{
              width: 310,
              background: CHART_SURFACE,
              border: `1px solid ${SLATE[6]}`,
              borderRadius: 16,
              boxShadow: '0 12px 40px rgba(0,0,0,.09)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                borderBottom: `1px solid ${SLATE[6]}`,
                padding: '10px 12px 0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  paddingBottom: 10,
                }}
              >
                {/* Agent pills */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flex: 1,
                  }}
                >
                  {/* Active pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '4px 10px 4px 5px',
                      borderRadius: 99,
                      background: `color-mix(in srgb, ${AGENT_PURPLE} 6%, transparent)`,
                      border: `1.5px solid color-mix(in srgb, ${AGENT_PURPLE} 30%, transparent)`,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 99,
                        background: `color-mix(in srgb, ${AGENT_PURPLE} 13%, transparent)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src="/logos/heytalia-logo.svg"
                        alt=""
                        style={{ width: 14, height: 14 }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: AGENT_PURPLE,
                      }}
                    >
                      HeyTalia
                    </span>
                    <BetaBadge small />
                  </div>
                  {/* Ghost future agent */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '4px 10px 4px 5px',
                      borderRadius: 99,
                      opacity: 0.35,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 99,
                        background: SLATE[4],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <PlusIcon color={SLATE[8]} size={10} />
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: SLATE[10],
                      }}
                    >
                      Agent 2
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: 2,
                    marginLeft: 'auto',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 99,
                      border: `1.5px dashed ${SLATE[6]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: SLATE[8],
                    }}
                  >
                    <PlusIcon color={SLATE[8]} size={12} />
                  </div>
                  <IconBtn>
                    <ExpandIcon />
                  </IconBtn>
                  <IconBtn>
                    <MinusIcon />
                  </IconBtn>
                </div>
              </div>
              {/* Underline tab indicator */}
              <div
                style={{
                  display: 'flex',
                  borderTop: `1px solid ${SLATE[5]}`,
                  margin: '0 -12px',
                  padding: '0 12px',
                }}
              >
                <div
                  style={{
                    padding: '7px 2px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: SLATE[12],
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <img
                    src="/logos/heytalia-logo.svg"
                    alt=""
                    style={{ width: 13, height: 13, borderRadius: 3 }}
                  />
                  HeyTalia
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: TWBLUE[9],
                      borderRadius: '2px 2px 0 0',
                    }}
                  />
                </div>
              </div>
            </div>
            <div
              style={{
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <ChatBubble />
            </div>
            <PanelInput />
          </div>
        </PanelCol>

        {/* ── C: SLIM TAB STRIP ── */}
        <PanelCol
          label="C · Slim Tab Strip"
          desc="A browser-tab-style strip sits between the header and messages. Familiar, scales cleanly as agents are added."
        >
          <div
            style={{
              width: 310,
              background: CHART_SURFACE,
              border: `1px solid ${SLATE[6]}`,
              borderRadius: 16,
              boxShadow: '0 12px 40px rgba(0,0,0,.09)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                height: 56,
                borderBottom: `1px solid ${SLATE[6]}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 10px 0 12px',
              }}
            >
              <AgentIcon />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: SLATE[12],
                  flex: 1,
                }}
              >
                Teacher Assistant
              </span>
              <div style={{ display: 'flex', gap: 2 }}>
                <IconBtn>
                  <ExpandIcon />
                </IconBtn>
                <IconBtn>
                  <MinusIcon />
                </IconBtn>
              </div>
            </div>
            {/* Tab strip */}
            <div
              style={{
                background: SLATE[1],
                borderBottom: `1px solid ${SLATE[5]}`,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {/* Active tab */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: SLATE[12],
                  position: 'relative',
                  background: CHART_SURFACE,
                  borderRadius: '8px 8px 0 0',
                  boxShadow: `0 -1px 0 0 ${SLATE[5]} inset, 1px 0 0 0 ${SLATE[5]} inset, -1px 0 0 0 ${SLATE[5]} inset`,
                }}
              >
                <img
                  src="/logos/heytalia-logo.svg"
                  alt=""
                  style={{ width: 14, height: 14, borderRadius: 3 }}
                />
                HeyTalia
                <BetaBadge small />
                <div
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: CHART_SURFACE,
                  }}
                />
              </div>
              {/* Ghost tab */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: SLATE[9],
                  opacity: 0.35,
                }}
              >
                <img
                  src="/logos/heytalia-logo.svg"
                  alt=""
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    filter: 'grayscale(1)',
                  }}
                />
                Agent 2
              </div>
              {/* Add */}
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 8px',
                  fontSize: 11,
                  color: SLATE[8],
                }}
              >
                <PlusIcon color={SLATE[8]} size={11} />
                Add
              </div>
            </div>
            <div
              style={{
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <ChatBubble />
            </div>
            <PanelInput />
          </div>
        </PanelCol>
      </div>
    </div>
  )
}

/* ── Shared sub-components ── */

function PanelCol({
  label,
  desc,
  recommended,
  children,
}: {
  label: string
  desc: string
  recommended?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: SLATE[9],
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        {label}
        {recommended && (
          <span
            style={{
              background: TWBLUE[3],
              color: TWBLUE[9],
              padding: '2px 7px',
              borderRadius: 99,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            Recommended
          </span>
        )}
      </div>
      <p
        style={{
          fontSize: 11.5,
          color: SLATE[10],
          textAlign: 'center',
          maxWidth: 280,
          lineHeight: 1.5,
        }}
      >
        {desc}
      </p>
      {children}
    </div>
  )
}

function AgentIcon() {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        border: `1px solid ${SLATE[5]}`,
        background: `color-mix(in srgb, ${AGENT_PURPLE} 9%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src="/logos/heytalia-logo.svg"
        alt="HeyTalia"
        style={{ width: 18, height: 18 }}
      />
    </div>
  )
}

function BetaBadge({ small }: { small?: boolean }) {
  return (
    <span
      style={{
        background: TWBLUE[3],
        color: TWBLUE[9],
        fontSize: small ? 8.5 : 9,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        padding: small ? '1px 5px' : '1.5px 5px',
        borderRadius: 99,
      }}
    >
      Beta
    </span>
  )
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 99,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: SLATE[9],
      }}
    >
      {children}
    </div>
  )
}

function ChatBubble() {
  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 99,
            background: TWBLUE[3],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <img
            src="/logos/heytalia-logo.svg"
            style={{ width: 16, height: 16 }}
          />
        </div>
        <div>
          <div
            style={{
              background: CHART_SURFACE,
              border: `1px solid ${SLATE[5]}`,
              borderRadius: '12px 12px 12px 3px',
              padding: '9px 12px',
              fontSize: 12.5,
              color: SLATE[12],
              lineHeight: 1.45,
              boxShadow: '0 1px 2px rgba(0,0,0,.04)',
            }}
          >
            Hi, I'm HeyTalia. How can I help?
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              marginTop: 6,
            }}
          >
            {['Create announcement', 'Create form'].map((chip) => (
              <div
                key={chip}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 32,
                  padding: '0 14px',
                  borderRadius: 99,
                  border: `1px solid ${TWBLUE[5]}`,
                  background: TWBLUE[3],
                  fontSize: 12,
                  fontWeight: 500,
                  color: TWBLUE[11],
                  width: 'fit-content',
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function PanelInput() {
  return (
    <div
      style={{
        borderTop: `1px solid ${SLATE[5]}`,
        padding: '10px 12px 11px',
        background: CHART_SURFACE,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          height: 36,
          border: `1px solid ${SLATE[6]}`,
          borderRadius: 99,
          padding: '0 5px 0 12px',
          background: CHART_SURFACE,
        }}
      >
        <span style={{ flex: 1, fontSize: 12.5, color: SLATE[8] }}>
          Ask HeyTalia…
        </span>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 99,
            background: TWBLUE[9],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.35,
          }}
        >
          <UpArrowIcon />
        </div>
      </div>
      <p
        style={{
          fontSize: 10,
          color: SLATE[8],
          textAlign: 'center',
          marginTop: 6,
        }}
      >
        HeyTalia can make mistakes. Always verify before sending.
      </p>
    </div>
  )
}

/* ── SVG icons ── */
function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={SLATE[8]}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
    </svg>
  )
}

function PlusIcon({
  color = 'currentColor',
  size = 13,
}: {
  color?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TWBLUE[9]}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function UpArrowIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke={CHART_LABEL}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}

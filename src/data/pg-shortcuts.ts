interface PGShortcutPreset {
  id: string
  label: string // parent-facing label shown in the PG app
  composerLabel: string // teacher-facing label shown in the announcement composer
  emoji: string // emoji icon shown in the parent preview
  url: string
}

export const PG_SHORTCUT_PRESETS: Array<PGShortcutPreset> = [
  {
    id: 'travel',
    label: 'Go to Travel Declaration',
    composerLabel: 'Declare travels',
    emoji: '✈️',
    url: 'https://pg.moe.edu.sg/travel',
  },
  {
    id: 'contact',
    label: 'Go to Contact Details',
    composerLabel: 'Edit contact details',
    emoji: '🧑',
    url: 'https://pg.moe.edu.sg/contact',
  },
]

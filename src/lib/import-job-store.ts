import { useSyncExternalStore } from 'react'

import type { ColumnConfig } from '@/components/students/column-visibility-popover'

export type ImportJobPayload = {
  filename: string
  fieldsByCategory: Record<string, Array<string>>
  columns: Array<ColumnConfig>
}

export type ImportJob =
  | { status: 'idle' }
  | {
      status: 'importing'
      filename: string
      progress: number
      startedAt: number
      fieldsByCategory: Record<string, Array<string>>
      columns: Array<ColumnConfig>
    }
  | {
      status: 'success'
      filename: string
      fieldsByCategory: Record<string, Array<string>>
      columns: Array<ColumnConfig>
    }
  | { status: 'error'; filename: string; message: string }

export type WizardOpenState =
  | { open: false }
  | {
      open: true
      initialStep: 1 | 4
      seedJobResult?: {
        fieldsByCategory: Record<string, Array<string>>
        columns: Array<ColumnConfig>
      }
    }

export type DesignToolsState = {
  uploadError: boolean
  hasIssues: boolean
  confirmationShowAll: boolean
}

type State = {
  job: ImportJob
  wizard: WizardOpenState
  designTools: DesignToolsState
}

let state: State = {
  job: { status: 'idle' },
  wizard: { open: false },
  designTools: {
    uploadError: false,
    hasIssues: false,
    confirmationShowAll: false,
  },
}

const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

// Simulator state — module-level so it can be cancelled
let simulatorInterval: ReturnType<typeof setInterval> | null = null

const TOTAL_MS = 20_000
const TICK_MS = 200

function stopSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval)
    simulatorInterval = null
  }
}

export function startImportJob(payload: ImportJobPayload) {
  stopSimulator()

  state = {
    ...state,
    job: {
      status: 'importing',
      filename: payload.filename,
      progress: 0,
      startedAt: Date.now(),
      fieldsByCategory: payload.fieldsByCategory,
      columns: payload.columns,
    },
  }
  notify()

  const shouldFail = payload.filename.toLowerCase().includes('failimport')
  const totalTicks = TOTAL_MS / TICK_MS
  let tickIndex = 0

  simulatorInterval = setInterval(() => {
    tickIndex += 1
    const progress = Math.min(100, Math.round((tickIndex / totalTicks) * 100))

    if (state.job.status !== 'importing') {
      stopSimulator()
      return
    }

    if (shouldFail && progress >= 50) {
      stopSimulator()
      state = {
        ...state,
        job: {
          status: 'error',
          filename: payload.filename,
          message:
            "We couldn't finish importing this file. Check the file and try again.",
        },
      }
      notify()
      return
    }

    state = {
      ...state,
      job: { ...state.job, progress },
    }
    notify()

    if (progress >= 100) {
      stopSimulator()
      state = {
        ...state,
        job: {
          status: 'success',
          filename: payload.filename,
          fieldsByCategory: payload.fieldsByCategory,
          columns: payload.columns,
        },
      }
      notify()
    }
  }, TICK_MS)
}

export function clearImportJob() {
  stopSimulator()
  if (state.job.status === 'idle') return
  state = { ...state, job: { status: 'idle' } }
  notify()
}

export function openImportWizard(
  initialStep: 1 | 4,
  seedJobResult?: {
    fieldsByCategory: Record<string, Array<string>>
    columns: Array<ColumnConfig>
  },
) {
  state = {
    ...state,
    wizard: { open: true, initialStep, seedJobResult },
  }
  notify()
}

export function closeImportWizard(options?: { clearJob?: boolean }) {
  state = { ...state, wizard: { open: false } }
  if (options?.clearJob) {
    if (state.job.status !== 'idle') {
      state = { ...state, job: { status: 'idle' } }
    }
  }
  notify()
}

export function retryImport() {
  clearImportJob()
  openImportWizard(1)
}

export function openImportSummary() {
  if (state.job.status !== 'success') return
  openImportWizard(4, {
    fieldsByCategory: state.job.fieldsByCategory,
    columns: state.job.columns,
  })
}

export function setDesignTools(patch: Partial<DesignToolsState>) {
  state = { ...state, designTools: { ...state.designTools, ...patch } }
  notify()
}

export function previewImportToast(
  status: 'idle' | 'importing' | 'success' | 'error',
) {
  stopSimulator()
  const filename = 'preview-import.csv'
  if (status === 'idle') {
    state = { ...state, job: { status: 'idle' } }
  } else if (status === 'importing') {
    state = {
      ...state,
      job: {
        status: 'importing',
        filename,
        progress: 50,
        startedAt: Date.now(),
        fieldsByCategory: {},
        columns: [],
      },
    }
  } else if (status === 'success') {
    state = {
      ...state,
      job: {
        status: 'success',
        filename,
        fieldsByCategory: {},
        columns: [],
      },
    }
  } else {
    state = {
      ...state,
      job: {
        status: 'error',
        filename,
        message: "We couldn't finish importing this file.",
      },
    }
  }
  notify()
}

export function useImportJob(): ImportJob {
  return useSyncExternalStore(
    subscribe,
    () => state.job,
    () => state.job,
  )
}

export function useImportWizardState(): WizardOpenState {
  return useSyncExternalStore(
    subscribe,
    () => state.wizard,
    () => state.wizard,
  )
}

export function useDesignToolsState(): DesignToolsState {
  return useSyncExternalStore(
    subscribe,
    () => state.designTools,
    () => state.designTools,
  )
}

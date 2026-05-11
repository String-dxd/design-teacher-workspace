import { useEffect } from 'react'
import { toast } from 'sonner'

import {
  ImportErrorToast,
  ImportProgressToast,
  ImportSuccessToast,
} from './import-progress-toast'
import {
  openImportSummary,
  retryImport,
  useImportJob,
} from '@/lib/import-job-store'

const TOAST_ID = 'student-import'

export function ImportJobToastBridge() {
  const job = useImportJob()

  useEffect(() => {
    switch (job.status) {
      case 'idle':
        toast.dismiss(TOAST_ID)
        break
      case 'importing':
        toast.custom(
          () => (
            <ImportProgressToast
              filename={job.filename}
              progress={job.progress}
            />
          ),
          {
            id: TOAST_ID,
            duration: Infinity,
            dismissible: false,
          },
        )
        break
      case 'success':
        toast.custom(
          (t) => (
            <ImportSuccessToast
              filename={job.filename}
              onAction={() => openImportSummary()}
              onDismiss={() => toast.dismiss(t)}
            />
          ),
          {
            id: TOAST_ID,
            duration: Infinity,
          },
        )
        break
      case 'error':
        toast.custom(
          (t) => (
            <ImportErrorToast
              message={job.message}
              onAction={() => retryImport()}
              onDismiss={() => toast.dismiss(t)}
            />
          ),
          {
            id: TOAST_ID,
            duration: Infinity,
          },
        )
        break
    }
  }, [job])

  return null
}

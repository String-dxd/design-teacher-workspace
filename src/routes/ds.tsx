import { createFileRoute } from '@tanstack/react-router'
import { ComponentGallery } from '@/components/component-gallery'
import { DesignTokens } from '@/components/design-tokens'
import { DsNav } from '@/components/ds-nav'

function DesignSystemPage() {
  return (
    <div className="w-full bg-background">
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <DsNav />
        <div className="min-w-0 flex-1 space-y-12">
          <DesignTokens />
          <ComponentGallery />
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/ds')({
  component: DesignSystemPage,
})

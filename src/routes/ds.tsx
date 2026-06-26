import { createFileRoute } from '@tanstack/react-router'
import { ComponentExample } from '@/components/component-example'
import { DesignTokens } from '@/components/design-tokens'

function DesignSystemPage() {
  return (
    <>
      <DesignTokens />
      <ComponentExample />
    </>
  )
}

export const Route = createFileRoute('/ds')({
  component: DesignSystemPage,
})

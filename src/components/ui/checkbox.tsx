import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'

import { CheckIcon, MinusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends CheckboxPrimitive.Root.Props {
  indeterminate?: boolean
}

function Checkbox({ className, indeterminate, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      // Base UI defaults to a <span role="checkbox">; render a real
      // <button> so the control gets native button semantics (forms,
      // keyboard, a11y) instead of ARIA re-implementation.
      nativeButton
      render={<button type="button" />}
      indeterminate={indeterminate}
      className={cn(
        'border-muted-foreground/50 bg-background dark:bg-input/30 hover:border-muted-foreground/80 hover:bg-muted/50 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary data-checked:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-indeterminate:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex size-[18px] items-center justify-center rounded-sm border-[1.5px] transition-all group-has-disabled/field:opacity-50 focus-visible:ring-[3px] aria-invalid:ring-[3px] peer relative shrink-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="[&>svg]:size-4 grid place-content-center text-current transition-none"
      >
        {indeterminate ? <MinusIcon /> : <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

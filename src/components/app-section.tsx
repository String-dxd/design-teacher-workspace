import type { App } from '@/data/apps'
import { AppCard } from '@/components/app-card'

interface AppSectionProps {
  title: string
  description?: string
  apps: Array<App>
}

export function AppSection({ title, description, apps }: AppSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 rounded-2xl sm:grid-cols-3">
        {apps.map((app) => (
          <AppCard
            key={app.id}
            name={app.name}
            description={app.description}
            icon={app.icon}
            color={app.color}
            href={app.href}
            badge={app.badge}
          />
        ))}
      </div>
    </section>
  )
}

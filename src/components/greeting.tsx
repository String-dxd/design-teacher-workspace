import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'

interface GreetingProps {
  userName?: string
}

export function getGreeting(hour: number): string {
  if (hour < 12) {
    return 'Good morning'
  } else if (hour < 17) {
    return 'Good afternoon'
  } else {
    return 'Good evening'
  }
}

export function Greeting({ userName = 'Mr. Tan' }: GreetingProps) {
  const [greeting, setGreeting] = useState('Good day')
  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours()))
  }, [])
  const { isLoggedIn } = useAuth()

  return (
    <h1 className="py-0 text-center text-2xl font-semibold text-foreground">
      {greeting}
      {isLoggedIn ? `, ${userName}` : ''}
    </h1>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StudentInfoCardProps {
  name: string
  studentClass: string
  nric: string
  indexNumber: number
  formTeacher: string
  coFormTeacher: string | null
  promotionStatus: string | null
  schoolName?: string
}

export function StudentInfoCard({
  name,
  studentClass,
  nric,
  indexNumber,
  formTeacher,
  coFormTeacher,
  schoolName,
}: StudentInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {name} ({studentClass})
        </CardTitle>
        <p className="text-muted-foreground text-sm">{nric}</p>
        {schoolName && (
          <p className="text-muted-foreground text-sm">{schoolName}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Class
            </span>
            <span className="text-lg font-semibold">{studentClass}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Index
            </span>
            <span className="text-lg font-semibold">{indexNumber}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Form Teacher
            </span>
            <span className="font-medium text-orange-9">{formTeacher}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Co-Form Teacher
            </span>
            <span className="font-medium text-lime-11">
              {coFormTeacher || '-'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

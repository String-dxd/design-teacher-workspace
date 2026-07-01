import { SecondarySubjectDetail } from './secondary-subject-detail'
import type { SecondarySubjectPerformance } from '@/types/report'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface SecondarySubjectAccordionProps {
  subjects: Array<SecondarySubjectPerformance>
}

export function SecondarySubjectAccordion({
  subjects,
}: SecondarySubjectAccordionProps) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Subject Performance</h2>
      <Accordion defaultValue={[0]}>
        {subjects.map((subject, index) => (
          <AccordionItem key={subject.name} value={index}>
            <AccordionTrigger className="text-base font-semibold">
              <div className="flex w-full items-center justify-between pr-2">
                <span>{subject.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-base font-bold">
                    {subject.currentScore}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                    {subject.currentGrade}
                  </span>
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <SecondarySubjectDetail subject={subject} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

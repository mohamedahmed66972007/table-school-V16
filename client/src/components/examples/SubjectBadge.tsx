import SubjectBadge from '../SubjectBadge'
import { SUBJECTS } from '@shared/schema'

export default function SubjectBadgeExample() {
  return (
    <div className="flex flex-wrap gap-3 p-6 bg-background">
      {SUBJECTS.map((subject) => (
        <SubjectBadge key={subject} subject={subject} />
      ))}
    </div>
  )
}

import { useState } from 'react'
import ScheduleGrid from '../ScheduleGrid'
import type { ScheduleSlotData } from '@/types/schedule'

export default function ScheduleGridExample() {
  const [slots, setSlots] = useState<ScheduleSlotData[]>([
    { day: 'الأحد', period: 1, grade: 11, section: 4 },
    { day: 'الأحد', period: 2, grade: 10, section: 2 },
    { day: 'الاثنين', period: 1, grade: 12, section: 1 },
    { day: 'الثلاثاء', period: 3, grade: 11, section: 5 },
  ])

  const handleSlotClick = (day: string, period: number) => {
    console.log('Slot clicked:', day, period)
    const exists = slots.find(s => s.day === day && s.period === period)
    if (exists) {
      setSlots(slots.filter(s => !(s.day === day && s.period === period)))
    } else {
      setSlots([...slots, { day, period, grade: 10, section: 1 }])
    }
  }

  return (
    <div className="p-6 bg-background">
      <ScheduleGrid slots={slots} onSlotClick={handleSlotClick} />
    </div>
  )
}

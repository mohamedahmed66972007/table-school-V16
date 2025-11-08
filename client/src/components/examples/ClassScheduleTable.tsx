import { useState } from 'react'
import ClassScheduleTable, { ClassScheduleSlot } from '../ClassScheduleTable'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'

export default function ClassScheduleTableExample() {
  const [showTeachers, setShowTeachers] = useState(true)

  const slots: ClassScheduleSlot[] = [
    { day: 'الأحد', period: 1, subject: 'عربي', teacherName: 'أحمد محمود' },
    { day: 'الأحد', period: 2, subject: 'رياضيات', teacherName: 'سارة خالد' },
    { day: 'الأحد', period: 3, subject: 'إنجليزي', teacherName: 'محمد علي' },
    { day: 'الاثنين', period: 1, subject: 'فيزياء', teacherName: 'ليلى حسن' },
    { day: 'الاثنين', period: 2, subject: 'كيمياء', teacherName: 'عمر سعيد' },
    { day: 'الثلاثاء', period: 1, subject: 'أحياء', teacherName: 'فاطمة أحمد' },
  ]

  return (
    <div className="p-6 bg-background space-y-4">
      <div className="flex items-center gap-2">
        <Switch
          id="show-teachers"
          checked={showTeachers}
          onCheckedChange={setShowTeachers}
        />
        <Label htmlFor="show-teachers">عرض أسماء المعلمين</Label>
      </div>
      <ClassScheduleTable
        grade={11}
        section={4}
        slots={slots}
        showTeacherNames={showTeachers}
      />
    </div>
  )
}

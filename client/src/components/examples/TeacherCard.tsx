import TeacherCard from '../TeacherCard'

export default function TeacherCardExample() {
  return (
    <div className="p-6 bg-background space-y-4 max-w-2xl">
      <TeacherCard
        id="1"
        name="أحمد محمود"
        subject="عربي"
        completedSlots={25}
        totalSlots={35}
        onEdit={(id) => console.log('Edit teacher:', id)}
        onDelete={(id) => console.log('Delete teacher:', id)}
        onExportPDF={(id) => console.log('Export PDF:', id)}
      />
      <TeacherCard
        id="2"
        name="سارة خالد"
        subject="رياضيات"
        completedSlots={35}
        totalSlots={35}
        onEdit={(id) => console.log('Edit teacher:', id)}
        onDelete={(id) => console.log('Delete teacher:', id)}
        onExportPDF={(id) => console.log('Export PDF:', id)}
      />
    </div>
  )
}

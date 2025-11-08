import { useState } from 'react'
import TeacherFormDialog from '../TeacherFormDialog'
import { Button } from '../ui/button'

export default function TeacherFormDialogExample() {
  const [open, setOpen] = useState(false)

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setOpen(true)} data-testid="button-open-form">
        فتح نموذج المعلم
      </Button>
      <TeacherFormDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={(name, subject) => {
          console.log('Teacher saved:', name, subject)
          setOpen(false)
        }}
      />
    </div>
  )
}

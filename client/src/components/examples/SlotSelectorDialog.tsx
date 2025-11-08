import { useState } from 'react'
import SlotSelectorDialog from '../SlotSelectorDialog'
import { Button } from '../ui/button'

export default function SlotSelectorDialogExample() {
  const [open, setOpen] = useState(false)

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setOpen(true)} data-testid="button-open-dialog">
        فتح نافذة الاختيار
      </Button>
      <SlotSelectorDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={(grade, section) => {
          console.log('Selected:', grade, section)
          setOpen(false)
        }}
        day="الأحد"
        period={1}
      />
    </div>
  )
}

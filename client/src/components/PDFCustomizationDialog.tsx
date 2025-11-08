import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Palette } from "lucide-react";
import { type PDFCustomizationOptions, DEFAULT_PDF_OPTIONS } from "@/types/pdfCustomization";

interface PDFCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: PDFCustomizationOptions) => Promise<void>;
  title: string;
}

export function PDFCustomizationDialog({
  open,
  onOpenChange,
  onExport,
  title,
}: PDFCustomizationDialogProps) {
  const [customColor, setCustomColor] = useState("#428bca");
  const [isExporting, setIsExporting] = useState(false);

  const handleColorChange = (color: string) => {
    setCustomColor(color);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: PDFCustomizationOptions = {
        ...DEFAULT_PDF_OPTIONS,
        themeColor: hexToRgb(customColor),
      };
      await onExport(options);
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4" />
              لون خلفية الرأس
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-20 h-12 cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  اختر اللون المناسب لخلفية رأس الجدول
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  اللون الحالي: {customColor}
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-3">معاينة اللون</h3>
            <div className="grid grid-cols-5 gap-2">
              {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]
                .map((day) => (
                  <div
                    key={day}
                    className="text-center p-2 rounded text-white text-sm"
                    style={{ backgroundColor: customColor }}
                  >
                    {day}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "جاري التصدير..." : "تصدير PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}
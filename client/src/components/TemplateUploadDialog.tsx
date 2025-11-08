import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplateUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateUploadDialog({ open, onOpenChange }: TemplateUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "خطأ",
          description: "يجب أن يكون الملف بصيغة .xlsx",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار ملف قالب",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('template', file);

      const response = await fetch('/api/upload-template', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload template');
      }

      const result = await response.json();
      
      toast({
        title: "تم التحميل بنجاح",
        description: "تم استبدال القالب بنجاح. سيتم استخدام القالب الجديد في التصدير القادم.",
      });

      setFile(null);
      onOpenChange(false);
      
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل القالب",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-right">رفع قالب جديد</DialogTitle>
          <DialogDescription className="text-right">
            قم برفع ملف Excel (.xlsx) ليصبح القالب الجديد المستخدم في التصدير
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-6">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium mb-2">
                {file ? file.name : "اختر ملف القالب"}
              </p>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="template-upload"
              />
              <label htmlFor="template-upload">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 ml-2" />
                    اختر ملف
                  </span>
                </Button>
              </label>
            </div>
            {file && (
              <p className="text-xs text-muted-foreground">
                حجم الملف: {(file.size / 1024).toFixed(2)} KB
              </p>
            )}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-right">
            <p className="text-sm text-muted-foreground">
              <strong>ملاحظة:</strong> سيتم استبدال القالب الحالي (جداول_template_new.xlsx) 
              بالقالب الجديد. تأكد من أن القالب الجديد يحتوي على نفس البنية.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? "جاري الرفع..." : "رفع القالب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

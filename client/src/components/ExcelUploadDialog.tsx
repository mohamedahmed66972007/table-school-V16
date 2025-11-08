import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Conflict {
  type: string;
  message: string;
  details: {
    day?: string;
    period?: number;
    grade?: number;
    section?: number;
    teachers?: string[];
  };
}

interface ExcelUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExcelUploadDialog({ open, onOpenChange }: ExcelUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, ignoreConflicts }: { file: File; ignoreConflicts: boolean }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ignoreConflicts', ignoreConflicts.toString());

      const response = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409 && error.conflicts) {
          throw { conflicts: error.conflicts, status: 409 };
        }
        throw new Error(error.message || 'فشل رفع الملف');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم الاستيراد بنجاح",
        description: `تم استيراد ${data.teachersImported} معلم و ${data.slotsImported} حصة`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-slots"] });
      setSelectedFile(null);
      onOpenChange(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      if (error.status === 409 && error.conflicts) {
        setConflicts(error.conflicts);
        setShowConflictDialog(true);
      } else {
        toast({
          title: "خطأ",
          description: error.message || "حدث خطأ أثناء استيراد الملف",
          variant: "destructive",
        });
      }
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار ملف أولاً",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file: selectedFile, ignoreConflicts: false });
  };

  const handleContinueAnyway = () => {
    if (!selectedFile) return;
    setShowConflictDialog(false);
    uploadMutation.mutate({ file: selectedFile, ignoreConflicts: true });
  };

  const handleFixConflict = () => {
    setShowConflictDialog(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "تم الإلغاء",
      description: "الرجاء إصلاح التعارضات في الملف وإعادة رفعه",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>استيراد جدول من ملف Excel</DialogTitle>
            <DialogDescription>
              اختر ملف Excel الذي يحتوي على جدول المعلمين والحصص
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
              <Upload className="ml-2 h-4 w-4" />
              {uploadMutation.isPending ? "جاري الرفع..." : "رفع الملف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              تم اكتشاف تعارضات في البيانات
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>تم العثور على التعارضات التالية في الملف:</p>
                <div className="space-y-2 text-sm">
                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                      <p className="font-medium">{conflict.message}</p>
                      {conflict.details.teachers && conflict.details.teachers.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          المعلمون: {conflict.details.teachers.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium">يمكنك:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>إصلاح التعارضات في الملف ثم إعادة رفعه</li>
                  <li>المتابعة على أي حال (سيتم الاحتفاظ بجميع البيانات كما هي)</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleFixConflict}>
              إصلاح التعارضات
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueAnyway}>
              الاحتفاظ على أي حال
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

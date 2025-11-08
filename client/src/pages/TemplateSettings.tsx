import { useState } from "react";
import { Settings, Upload, FileSpreadsheet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function TemplateSettings() {
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

      toast({
        title: "تم التحميل بنجاح",
        description: "تم استبدال القالب بنجاح. سيتم استخدام القالب الجديد في التصدير القادم.",
      });

      setFile(null);
      
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 1500);
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

  const handleReset = () => {
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold font-heading">إعدادات القالب</h1>
              <p className="text-muted-foreground font-body mt-1">
                إدارة قالب التصدير المستخدم في جداول Excel
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                تغيير قالب Excel
              </CardTitle>
              <CardDescription>
                قم برفع ملف Excel (.xlsx) ليصبح القالب الجديد المستخدم في جميع عمليات التصدير
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-8 bg-muted/20">
                <FileSpreadsheet className="h-16 w-16 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">
                    {file ? file.name : "لم يتم اختيار ملف"}
                  </p>
                  {file && (
                    <p className="text-sm text-muted-foreground mb-4">
                      حجم الملف: {(file.size / 1024).toFixed(2)} كيلوبايت
                    </p>
                  )}
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="template-upload"
                  />
                  <div className="flex gap-2 justify-center">
                    <label htmlFor="template-upload">
                      <Button variant="outline" size="lg" asChild>
                        <span className="cursor-pointer">
                          <Upload className="h-4 w-4 ml-2" />
                          اختر ملف القالب
                        </span>
                      </Button>
                    </label>
                    {file && (
                      <Button variant="ghost" size="lg" onClick={handleReset}>
                        <RefreshCw className="h-4 w-4 ml-2" />
                        إلغاء الاختيار
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {file && (
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="min-w-[200px]"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                        جاري الرفع...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 ml-2" />
                        رفع القالب
                      </>
                    )}
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

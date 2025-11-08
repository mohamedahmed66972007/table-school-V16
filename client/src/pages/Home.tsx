import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, BookOpen, Users, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TeacherFormDialog from "@/components/TeacherFormDialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Subject, Teacher } from "@shared/schema";

export default function Home() {
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const createTeacherMutation = useMutation({
    mutationFn: async (data: { name: string; subject: Subject }) => {
      const response = await apiRequest<Teacher>("/api/teachers", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (teacher) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "تم إنشاء المعلم بنجاح",
        description: `تم إضافة ${teacher.name} - ${teacher.subject}`,
      });
      setShowTeacherDialog(false);
      setLocation("/teachers");
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء المعلم",
        variant: "destructive",
      });
      console.error("Error creating teacher:", error);
    },
  });

  const handleCreateTeacher = (name: string, subject: Subject) => {
    createTeacherMutation.mutate({ name, subject });
  };

  const features = [
    {
      icon: Users,
      title: "إدارة المعلمين",
      description: "إضافة المعلمين وإنشاء جداولهم الشخصية بسهولة",
    },
    {
      icon: LayoutGrid,
      title: "جداول الصفوف",
      description: "توليد تلقائي لجداول جميع الصفوف والشعب",
    },
    {
      icon: BookOpen,
      title: "تصدير PDF",
      description: "تصدير وطباعة الجداول بصيغة PDF احترافية",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-in">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold font-heading text-foreground">
              نظام جدولة الحصص المدرسية
            </h1>
            <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
              نظام متطور وسهل الاستخدام لإنشاء وإدارة جداول الحصص للمعلمين والصفوف
              مع إمكانية التصدير والطباعة
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => setShowTeacherDialog(true)}
              disabled={createTeacherMutation.isPending}
              className="gap-3 text-lg px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-105 active:scale-95"
              data-testid="button-create-schedule"
            >
              <Plus className="h-6 w-6" />
              <span className="font-heading">
                {createTeacherMutation.isPending ? "جاري الإنشاء..." : "إنشاء جدول جديد"}
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover-elevate transition-all duration-200 text-center space-y-3"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold font-heading">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>

          <div className="pt-12 space-y-4">
            <h2 className="text-2xl font-bold font-heading">كيف يعمل النظام؟</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
              <Card className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-data">
                    1
                  </div>
                  <h3 className="font-semibold font-heading">إضافة المعلمين</h3>
                </div>
                <p className="text-sm text-muted-foreground font-body pr-11">
                  يقوم كل معلم بإدخال اسمه واختيار المادة التي يدرسها
                </p>
              </Card>

              <Card className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-data">
                    2
                  </div>
                  <h3 className="font-semibold font-heading">بناء الجدول</h3>
                </div>
                <p className="text-sm text-muted-foreground font-body pr-11">
                  يختار المعلم الحصص ويحدد الصف والشعبة لكل حصة (7 حصص × 5 أيام)
                </p>
              </Card>

              <Card className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-data">
                    3
                  </div>
                  <h3 className="font-semibold font-heading">توليد جداول الصفوف</h3>
                </div>
                <p className="text-sm text-muted-foreground font-body pr-11">
                  يقوم النظام تلقائياً بإنشاء جداول لجميع الصفوف بناءً على المدخلات
                </p>
              </Card>

              <Card className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-data">
                    4
                  </div>
                  <h3 className="font-semibold font-heading">التصدير والطباعة</h3>
                </div>
                <p className="text-sm text-muted-foreground font-body pr-11">
                  يمكن تصدير الجداول إلى PDF للطباعة أو المشاركة
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <TeacherFormDialog
        open={showTeacherDialog}
        onClose={() => setShowTeacherDialog(false)}
        onSave={handleCreateTeacher}
      />
    </div>
  );
}

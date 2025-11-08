import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeacherCard from "@/components/TeacherCard";
import TeacherFormDialog from "@/components/TeacherFormDialog";
import { ScheduleAssistant } from "@/components/ScheduleAssistant";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Subject, Teacher, ScheduleSlot } from "@shared/schema";
import { exportTeacherScheduleExcel, exportAllTeachersExcel } from "@/lib/excelGenerator";
import type { ScheduleSlotData } from "@/types/schedule";

export default function Teachers() {
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: allSlots = [] } = useQuery<ScheduleSlot[]>({
    queryKey: ["/api/schedule-slots"],
  });

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
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء المعلم",
        variant: "destructive",
      });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/teachers/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-slots"] });
      // Invalidate all class schedules since deleting a teacher affects them
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "/api/class-schedules",
      });
      toast({
        title: "تم الحذف",
        description: "تم حذف المعلم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المعلم",
        variant: "destructive",
      });
    },
  });

  const handleCreateTeacher = (name: string, subject: Subject) => {
    createTeacherMutation.mutate({ name, subject });
  };

  const handleEditTeacher = (id: string) => {
    setLocation(`/teacher/${id}`);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المعلم؟ سيتم حذف جميع حصصه أيضاً.")) {
      deleteTeacherMutation.mutate(id);
    }
  };

  const handleExportTeacher = async (teacherId: string) => {
    try {
      const teacher = teachers.find((t) => t.id === teacherId);
      if (!teacher) return;

      const teacherSlots: ScheduleSlotData[] = allSlots
        .filter((slot) => slot.teacherId === teacherId)
        .map((slot) => ({
          day: slot.day,
          period: slot.period,
          grade: slot.grade,
          section: slot.section,
        }));

      await exportTeacherScheduleExcel(teacher, teacherSlots);
      toast({
        title: "تم التصدير",
        description: `تم تصدير جدول ${teacher.name} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportAllTeachers = async () => {
    try {
      if (teachers.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا يوجد معلمون لتصديرهم",
        });
        return;
      }

      await exportAllTeachersExcel(teachers, allSlots);
      toast({
        title: "تم التصدير",
        description: `تم تصدير جداول ${teachers.length} معلم بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير Excel",
        variant: "destructive",
      });
    }
  };

  const getTeacherSlotCount = (teacherId: string) => {
    return allSlots.filter((slot) => slot.teacherId === teacherId).length;
  };

  // ترتيب المواد المخصص
  const subjectOrder = [
    "إسلامية",
    "عربي",
    "إنجليزي",
    "رياضيات",
    "كيمياء",
    "فيزياء",
    "أحياء",
    "اجتماعيات",
    "حاسوب",
    "بدنية",
    "فنية",
  ];

  // Sort teachers by custom subject order, then by name
  const sortedTeachers = [...teachers].sort((a, b) => {
    if (a.subject !== b.subject) {
      const indexA = subjectOrder.indexOf(a.subject);
      const indexB = subjectOrder.indexOf(b.subject);
      return indexA - indexB;
    }
    return a.name.localeCompare(b.name, 'ar');
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold font-heading">المعلمون</h1>
              <p className="text-muted-foreground font-body mt-1">
                إدارة جداول المعلمين وتصديرها ({teachers.length} معلم)
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowTeacherDialog(true)}
                className="gap-2"
                data-testid="button-create-teacher"
              >
                <Plus className="h-4 w-4" />
                إنشاء جدول جديد
              </Button>
              <Button
                variant="outline"
                onClick={handleExportAllTeachers}
                className="gap-2"
                data-testid="button-export-all"
              >
                <FileDown className="h-4 w-4" />
                تصدير جميع الجداول Excel
              </Button>
            </div>
          </div>

          {sortedTeachers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body mb-4">
                لا يوجد معلمون حالياً
              </p>
              <Button onClick={() => setShowTeacherDialog(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة معلم جديد
              </Button>
            </div>
          ) : (
            <div>
              {(() => {
                // تجميع المعلمين حسب المادة
                const teachersBySubject = sortedTeachers.reduce((acc, teacher) => {
                  if (!acc[teacher.subject]) {
                    acc[teacher.subject] = [];
                  }
                  acc[teacher.subject].push(teacher);
                  return acc;
                }, {} as Record<string, Teacher[]>);

                // إنشاء قائمة المواد الكاملة (المواد من القائمة + المواد الإضافية)
                const allSubjects = [
                  ...subjectOrder,
                  ...Object.keys(teachersBySubject).filter(
                    (subject) => !subjectOrder.includes(subject)
                  ),
                ];

                // عرض كل مجموعة مادة
                return allSubjects.map((subject) => {
                  const teachersInSubject = teachersBySubject[subject];
                  if (!teachersInSubject || teachersInSubject.length === 0) {
                    return null;
                  }

                  return (
                    <div key={subject} className="mb-8">
                      <div className="mb-4">
                        <h2 className="text-xl font-bold text-primary font-heading border-b-2 border-primary/30 pb-2">
                          {subject}
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {teachersInSubject.map((teacher) => (
                          <TeacherCard
                            key={teacher.id}
                            id={teacher.id}
                            name={teacher.name}
                            subject={teacher.subject as any}
                            completedSlots={getTeacherSlotCount(teacher.id)}
                            totalSlots={35}
                            onEdit={handleEditTeacher}
                            onDelete={handleDeleteTeacher}
                            onExportPDF={handleExportTeacher}
                          />
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      <TeacherFormDialog
        open={showTeacherDialog}
        onClose={() => setShowTeacherDialog(false)}
        onSave={handleCreateTeacher}
      />

      {/* Schedule Assistant anchored to the bottom left */}
      <div className="fixed bottom-4 left-4 z-50">
        <ScheduleAssistant allSlots={allSlots} />
      </div>
    </div>
  );
}
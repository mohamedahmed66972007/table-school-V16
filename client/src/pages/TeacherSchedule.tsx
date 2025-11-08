import { useState, useEffect } from "react";
import { useRoute, useLocation, useParams } from "wouter";
import { ArrowRight, Save, FileDown, GraduationCap, Pencil } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ScheduleGrid from "@/components/ScheduleGrid";
import SlotSelectorDialog from "@/components/SlotSelectorDialog";
import TeacherFormDialog from "@/components/TeacherFormDialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ScheduleSlotData } from "@/types/schedule";
import type { Teacher, ScheduleSlot, Subject } from "@shared/schema";
import SubjectBadge from "@/components/SubjectBadge";
import { exportTeacherScheduleExcel } from "@/lib/excelGenerator";
import { Card } from "@/components/ui/card";

export default function TeacherSchedule() {
  const [, params] = useRoute("/teacher/:id");
  const [, setLocation] = useLocation();
  const teacherId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams();

  const [slots, setSlots] = useState<ScheduleSlotData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    period: number;
  } | null>(null);

  // State for editing teacher info
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [scheduleData, setScheduleData] = useState<Record<string, Record<number, string>>>({});
  const [isInitialized, setIsInitialized] = useState(false);


  const { data: teacher, isLoading: teacherLoading } = useQuery<Teacher>({
    queryKey: [`/api/teachers/${teacherId || id}`],
    enabled: !!teacherId || !!id,
  });

  const { data: teacherSlots = [], isLoading: slotsLoading } = useQuery<ScheduleSlot[]>({
    queryKey: [`/api/teachers/${teacherId || id}/schedule-slots`],
    enabled: !!teacherId || !!id,
  });

  // This useEffect is intended to process teacherSlots and initialize scheduleData
  useEffect(() => {
    if (teacherSlots && teacherSlots.length > 0 && !isInitialized) {
      const initialSchedule: Record<string, Record<number, string>> = {};
      const formattedSlots: ScheduleSlotData[] = teacherSlots.map(slot => {
        if (!initialSchedule[slot.day]) {
          initialSchedule[slot.day] = {};
        }
        initialSchedule[slot.day][slot.period] = `${slot.grade}/${slot.section}`;
        return {
          day: slot.day,
          period: slot.period,
          grade: slot.grade,
          section: slot.section,
        };
      });
      setScheduleData(initialSchedule);
      setSlots(formattedSlots);
      setIsInitialized(true);
    } else if (teacherSlots && teacherSlots.length === 0 && !isInitialized) {
      // Handle case where teacher has no slots yet, to ensure isInitialized is set
      setIsInitialized(true);
    }
  }, [teacherSlots, isInitialized]);


  const updateTeacherInfoMutation = useMutation({
    mutationFn: async (data: { name: string; subject: Subject }) => {
      if (!teacherId && !id) throw new Error("Teacher ID not found");

      const response = await apiRequest<Teacher>(`/api/teachers/${teacherId || id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      // تحديث معلومات المعلم الحالي
      queryClient.invalidateQueries({ queryKey: [`/api/teachers/${teacherId || id}`] });
      // تحديث قائمة جميع المعلمين
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setShowEditDialog(false);
      toast({
        title: "تم التحديث",
        description: "تم تحديث معلومات المعلم بنجاح",
      });
    },
    onError: (error) => {
      console.error("Error updating teacher info:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث معلومات المعلم",
        variant: "destructive",
      });
    },
  });

  const saveScheduleMutationNew = useMutation({
    mutationFn: async (scheduleData: Record<string, Record<number, string>>) => {
      if (!teacherId) throw new Error("Teacher ID not found");

      const slotsToSave = Object.entries(scheduleData).flatMap(([day, periods]) =>
        Object.entries(periods).map(([period, classInfo]) => {
          const [grade, section] = classInfo.split("/").map(Number);
          return {
            day,
            period: Number(period),
            grade,
            section,
          };
        })
      );

      const response = await apiRequest<ScheduleSlot[]>(
        `/api/teachers/${teacherId || id}/schedule-slots/batch`,
        {
          method: "POST",
          body: JSON.stringify({ slots: slotsToSave }),
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teachers/${teacherId || id}/schedule-slots`] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-slots"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === '/api/class-schedules'
      });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ جدول المعلم بنجاح",
      });
    },
    onError: (error: any) => {
      if (error?.error === "conflict") {
        toast({
          title: "تعارض في الجدول",
          description: error.message || "يوجد تعارض في الجدول مع معلم آخر",
          variant: "destructive",
        });
      } else {
        const errorMessage = error.conflict
          ? error.conflict.message
          : error.message || "فشل حفظ الجدول";

        toast({
          title: "خطأ في الحفظ",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });


  if (!teacherId && !id) {
    setLocation("/teachers");
    return null;
  }

  if (teacherLoading || slotsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">المعلم غير موجود</p>
          <Link href="/teachers">
            <Button>العودة للمعلمين</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSlotClick = (day: string, period: number) => {
    setSelectedSlot({ day, period });
  };

  const handleSaveSlot = (grade: number, section: number) => {
    if (!selectedSlot) return;

    const currentScheduleData = { ...scheduleData };
    if (!currentScheduleData[selectedSlot.day]) {
      currentScheduleData[selectedSlot.day] = {};
    }
    currentScheduleData[selectedSlot.day][selectedSlot.period] = `${grade}/${section}`;
    setScheduleData(currentScheduleData);
    setSelectedSlot(null);
  };

  const handleDeleteSlot = (day: string, period: number) => {
    if (scheduleData[day]?.[period]) {
      const newScheduleData = { ...scheduleData };
      delete newScheduleData[day][period];

      // If a day becomes empty, remove it
      if (Object.keys(newScheduleData[day]).length === 0) {
        delete newScheduleData[day];
      }

      setScheduleData(newScheduleData);
      toast({
        title: "تم الحذف",
        description: "تم حذف الحصة بنجاح",
      });
    }
  };

  const handleSave = () => {
    saveScheduleMutationNew.mutate(scheduleData);
  };

  const handleUpdateTeacherInfo = (name: string, subject: Subject) => {
    updateTeacherInfoMutation.mutate({ name, subject });
  };


  const handleExportExcel = async () => {
    if (!teacher) return;
    try {
      // Construct ScheduleSlotData from scheduleData for export
      const currentSlotsForExport: ScheduleSlotData[] = Object.entries(scheduleData).flatMap(([day, periods]) =>
        Object.entries(periods).map(([period, classInfo]) => {
          const [grade, section] = classInfo.split("/").map(Number);
          return {
            day,
            period: Number(period),
            grade,
            section,
          };
        })
      );
      await exportTeacherScheduleExcel(teacher, currentSlotsForExport);
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

  const existingSlot = selectedSlot
    ? scheduleData[selectedSlot.day]?.[selectedSlot.period]
    : undefined;

  const allSlots: ScheduleSlotData[] = Object.entries(scheduleData).flatMap(([day, periods]) =>
    Object.entries(periods).map(([period, classInfo]) => {
      const [grade, section] = classInfo.split("/").map(Number);
      return {
        day,
        period: Number(period),
        grade,
        section,
      };
    })
  );


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-3">
              <Link href="/teachers">
                <Button variant="ghost" className="gap-2 -mr-3" data-testid="button-back">
                  <ArrowRight className="h-4 w-4" />
                  العودة للمعلمين
                </Button>
              </Link>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold font-heading">{teacher.name}</h1>
                <div className="mt-2">
                  <SubjectBadge subject={teacher.subject as Subject} />
                </div>
              </div>
              <p className="text-muted-foreground font-body">
                اختر الحصص وحدد الصف والشعبة لكل حصة
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowEditDialog(true)}
                variant="outline"
                className="gap-2"
                data-testid="button-edit-info"
              >
                <Pencil className="h-4 w-4" />
                تعديل المعلومات
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveScheduleMutationNew.isPending}
                className="gap-2"
                data-testid="button-save"
              >
                <Save className="h-4 w-4" />
                {saveScheduleMutationNew.isPending ? "جاري الحفظ..." : "حفظ الجدول"}
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="gap-2"
                data-testid="button-export-excel"
              >
                <FileDown className="h-4 w-4" />
                تصدير Excel
              </Button>
            </div>
          </div>

          <div className="bg-card/50 rounded-lg p-4 border border-card-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-body">
                الحصص المكتملة
              </span>
              <span className="font-semibold font-data">
                {Object.values(scheduleData).reduce((acc, periods) => acc + Object.keys(periods).length, 0)} / 35
              </span>
            </div>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(Object.values(scheduleData).reduce((acc, periods) => acc + Object.keys(periods).length, 0) / 35) * 100}%` }}
              />
            </div>
          </div>

          <ScheduleGrid
            slots={Object.entries(scheduleData).flatMap(([day, periods]) =>
              Object.entries(periods).map(([period, classInfo]) => {
                const [grade, section] = classInfo.split("/").map(Number);
                return {
                  day,
                  period: Number(period),
                  grade,
                  section,
                };
              })
            )}
            onSlotClick={handleSlotClick}
            onSlotDelete={handleDeleteSlot}
          />
        </div>
      </div>

      <SlotSelectorDialog
        open={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        onSave={handleSaveSlot}
        day={selectedSlot?.day || ""}
        period={selectedSlot?.period || 1}
        initialGrade={existingSlot ? parseInt(existingSlot.split("/")[0]) : undefined}
        initialSection={existingSlot ? parseInt(existingSlot.split("/")[1]) : undefined}
        existingSlots={allSlots}
        currentSlot={selectedSlot || undefined}
      />

      <TeacherFormDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSave={handleUpdateTeacherInfo}
        initialName={teacher?.name}
        initialSubject={teacher?.subject as Subject}
        isEdit={true}
      />
    </div>
  );
}
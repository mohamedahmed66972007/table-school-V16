import { useState } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { DAYS, PERIODS } from "@shared/schema";
import type { Teacher, ScheduleSlot, Day, Period } from "@shared/schema";
import { AlertTriangle, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface EditableClassScheduleProps {
  grade: number;
  section: number;
  slots: ScheduleSlot[];
  allSlots: ScheduleSlot[];
  allTeachers: Teacher[];
}

interface Conflict {
  day: Day;
  period: Period;
  teachers: string[];
}

export function EditableClassSchedule({
  grade,
  section,
  slots: initialSlots,
  allSlots,
  allTeachers,
}: EditableClassScheduleProps) {
  const [editedSlots, setEditedSlots] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveSlotsMutation = useMutation({
    mutationFn: async (changedSlots: { day: Day; period: Period; teacherId: string }[]) => {
      // بناء الحصص الكاملة بناءً على التغييرات الحالية
      const fullSlots: any[] = [];
      
      DAYS.forEach((day) => {
        PERIODS.forEach((period) => {
          const teacherId = getTeacherForSlot(day, period);
          if (teacherId) {
            fullSlots.push({
              teacherId,
              day,
              period,
              grade,
              section,
            });
          }
        });
      });

      const response = await fetch(`/api/class-schedules/${grade}/${section}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slots: fullSlots }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save schedule changes");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/class-schedules/${grade}/${section}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-slots"] });
      setEditedSlots(new Map());
      toast({
        title: "تم الحفظ",
        description: "تم حفظ التغييرات بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive",
      });
    },
  });

  const getTeacherForSlot = (day: Day, period: Period): string | undefined => {
    const key = `${day}-${period}`;
    if (editedSlots.has(key)) {
      return editedSlots.get(key);
    }
    const slot = initialSlots.find((s) => s.day === day && s.period === period);
    return slot?.teacherId;
  };

  const handleSlotChange = (day: Day, period: Period, teacherId: string) => {
    const key = `${day}-${period}`;
    const newMap = new Map(editedSlots);
    newMap.set(key, teacherId);
    setEditedSlots(newMap);
  };

  const detectConflicts = (): Conflict[] => {
    const conflicts: Conflict[] = [];

    DAYS.forEach((day) => {
      PERIODS.forEach((period) => {
        const teacherId = getTeacherForSlot(day, period);
        if (!teacherId) return;

        const teacher = allTeachers.find((t) => t.id === teacherId);
        if (!teacher) return;

        const conflictingSlots = allSlots.filter(
          (s) =>
            s.teacherId === teacherId &&
            s.day === day &&
            s.period === period &&
            (s.grade !== grade || s.section !== section)
        );

        if (conflictingSlots.length > 0) {
          const conflictMessages = conflictingSlots.map(
            (slot) => `${teacher.name} (تعارض مع صف ${slot.grade}/${slot.section})`
          );
          conflicts.push({
            day,
            period,
            teachers: conflictMessages,
          });
        }
      });
    });

    return conflicts;
  };

  const handleSave = () => {
    const conflicts = detectConflicts();
    if (conflicts.length > 0) {
      toast({
        title: "تحذير - توجد تعارضات",
        description: `يوجد ${conflicts.length} تعارض في الجدول. يرجى حلها قبل الحفظ.`,
        variant: "destructive",
      });
      return;
    }

    if (editedSlots.size === 0) {
      toast({ title: "لا توجد تغييرات", description: "لم يتم تعديل أي حصة." });
      return;
    }

    saveSlotsMutation.mutate([]);
  };

  const conflicts = detectConflicts();
  const hasChanges = editedSlots.size > 0;

  return (
    <div className="space-y-4">
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تعارضات في الجدول</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {conflicts.map((conflict, idx) => (
                <li key={idx}>
                  {conflict.day} - الحصة {conflict.period}: {conflict.teachers.join(", ")}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          تعديل جدول الصف {grade}/{section}
        </h2>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || conflicts.length > 0 || saveSlotsMutation.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saveSlotsMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>

      <Card className="p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-right font-heading text-sm border border-border bg-muted/50">
                  اليوم / الحصة
                </th>
                {PERIODS.map((period) => (
                  <th
                    key={period}
                    className="p-3 text-center font-heading text-sm border border-border bg-muted/50"
                  >
                    الحصة {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className="p-3 font-semibold border border-border bg-muted/30">
                    {day}
                  </td>
                  {PERIODS.map((period) => {
                    const teacherId = getTeacherForSlot(day, period);
                    const teacher = teacherId
                      ? allTeachers.find((t) => t.id === teacherId)
                      : undefined;

                    return (
                      <td key={`${day}-${period}`} className="border border-border p-2">
                        <Select
                          value={teacherId || "none"}
                          onValueChange={(value) =>
                            handleSlotChange(day, period, value === "none" ? "" : value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر معلم">
                              {teacher ? (
                                <div className="text-sm">
                                  <div className="font-semibold">{teacher.subject}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {teacher.name}
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">لا يوجد</SelectItem>
                            {allTeachers.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.subject} - {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

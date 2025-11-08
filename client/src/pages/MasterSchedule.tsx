import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DAYS, PERIODS } from "@shared/schema";
import type { Teacher, ScheduleSlot, Day, Period } from "@shared/schema";
import { Save, Download, AlertCircle, Upload } from "lucide-react";
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
import { exportMasterScheduleExcel } from "@/lib/excelGenerator";
import { Textarea } from "@/components/ui/textarea";
import { ExcelUploadDialog } from "@/components/ExcelUploadDialog";

type ScheduleData = {
  [teacherId: string]: {
    [day: string]: {
      [period: number]: string; // "grade/section" format
    };
  };
};

type TeacherNotes = {
  [teacherId: string]: string;
};

type Conflict = {
  day: Day;
  period: Period;
  grade: number;
  section: number;
  teachers: { id: string; name: string }[];
};

export default function MasterSchedule() {
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [teacherNotes, setTeacherNotes] = useState<TeacherNotes>({});
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
    staleTime: Infinity,
  });

  const { data: slots = [] } = useQuery<ScheduleSlot[]>({
    queryKey: ["/api/schedule-slots"],
    staleTime: Infinity,
  });

  const { data: gradeSections = {} } = useQuery<Record<string, number[]>>({
    queryKey: ["/api/grade-sections"],
    staleTime: Infinity,
  });

  // Load existing schedule data
  useEffect(() => {
    if (teachers.length > 0) {
      const data: ScheduleData = {};
      teachers.forEach((teacher) => {
        data[teacher.id] = {};
        DAYS.forEach((day) => {
          data[teacher.id][day] = {};
        });
      });

      slots.forEach((slot) => {
        if (data[slot.teacherId] && data[slot.teacherId][slot.day]) {
          data[slot.teacherId][slot.day][slot.period] = `${slot.grade}/${slot.section}`;
        }
      });

      setScheduleData(data);
    }
  }, [teachers, slots]);

  // Normalize input: convert "7/12" to "12/7"
  const normalizeInput = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    const parts = trimmed.split("/");
    if (parts.length !== 2) return trimmed;

    const [first, second] = parts.map((p) => parseInt(p.trim(), 10));
    if (isNaN(first) || isNaN(second)) return trimmed;

    // Ensure grade is between 10-12
    if (first >= 10 && first <= 12) {
      return `${first}/${second}`;
    } else if (second >= 10 && second <= 12) {
      return `${second}/${first}`;
    }

    return trimmed;
  };

  // Handle input change
  const handleCellChange = (
    teacherId: string,
    day: Day,
    period: Period,
    value: string
  ) => {
    const normalized = normalizeInput(value);

    // التحقق من وجود معلم آخر يدرس نفس الصف في نفس المادة (باستثناء البدنية والإسلامية)
    if (normalized && normalized.includes('/')) {
      const parts = normalized.split('/');
      const grade = parseInt(parts[0], 10);
      const section = parseInt(parts[1], 10);

      if (!isNaN(grade) && !isNaN(section)) {
        const currentTeacher = teachers.find(t => t.id === teacherId);

        // استثناء معلمي البدنية والإسلامية من هذا التحقق
        if (currentTeacher && currentTeacher.subject !== "بدنية" && currentTeacher.subject !== "إسلامية") {
          // البحث عن حصص هذا الصف مع معلمين آخرين في نفس المادة
          const otherTeachersInSameSubject = teachers.filter(
            t => t.id !== teacherId && t.subject === currentTeacher.subject
          );

          for (const otherTeacher of otherTeachersInSameSubject) {
            // عدد حصص المعلم الآخر مع هذا الصف من scheduleData (البيانات الحالية)
            let otherTeacherSlots = 0;
            const otherSchedule = scheduleData[otherTeacher.id];

            if (otherSchedule) {
              Object.values(otherSchedule).forEach((periods) => {
                Object.values(periods).forEach((cellValue) => {
                  if (cellValue === `${grade}/${section}`) {
                    otherTeacherSlots++;
                  }
                });
              });
            }

            if (otherTeacherSlots >= 2) {
              toast({
                title: "تنبيه",
                description: `صف ${grade}/${section} لديه ${otherTeacherSlots} حصص في مادة ${currentTeacher.subject} مع الأستاذ ${otherTeacher.name}`,
                variant: "default",
                duration: 5000,
              });
              break; // نوقف عند أول معلم وجدنا له حصص كثيرة
            }
          }
        }
      }
    }

    setScheduleData((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        [day]: {
          ...prev[teacherId]?.[day],
          [period]: normalized,
        },
      },
    }));
  };

  // Check for conflicts
  const checkConflicts = (): Conflict[] => {
    const conflictMap: {
      [key: string]: { teachers: { id: string; name: string }[]; grade: number; section: number };
    } = {};

    Object.entries(scheduleData).forEach(([teacherId, teacherSchedule]) => {
      const teacher = teachers.find((t) => t.id === teacherId);
      if (!teacher) return;

      Object.entries(teacherSchedule).forEach(([day, periods]) => {
        Object.entries(periods).forEach(([period, value]) => {
          if (!value) return;

          const parts = value.split("/");
          if (parts.length !== 2) return;

          const grade = parseInt(parts[0], 10);
          const section = parseInt(parts[1], 10);

          if (isNaN(grade) || isNaN(section)) return;

          const key = `${day}-${period}-${grade}-${section}`;
          if (!conflictMap[key]) {
            conflictMap[key] = {
              teachers: [],
              grade,
              section,
            };
          }

          conflictMap[key].teachers.push({
            id: teacherId,
            name: teacher.name,
          });
        });
      });
    });

    const foundConflicts: Conflict[] = [];
    Object.entries(conflictMap).forEach(([key, data]) => {
      if (data.teachers.length > 1) {
        const [day, period] = key.split("-");
        foundConflicts.push({
          day: day as Day,
          period: parseInt(period, 10) as Period,
          grade: data.grade,
          section: data.section,
          teachers: data.teachers,
        });
      }
    });

    return foundConflicts;
  };

  // Export Excel function
  const handleExcelExport = async () => {
    try {
      if (teachers.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا يوجد معلمون لتصديرهم",
        });
        return;
      }

      await exportMasterScheduleExcel(sortedTeachers, slots, teacherNotes);
      toast({
        title: "تم التصدير",
        description: `تم تصدير الجدول الرئيسي بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير Excel",
        variant: "destructive",
      });
    }
  };

  // Save schedule
  const saveMutation = useMutation({
    mutationFn: async () => {
      const foundConflicts = checkConflicts();
      if (foundConflicts.length > 0) {
        setConflicts(foundConflicts);
        setShowConflictDialog(true);
        throw new Error("Conflicts found");
      }

      // Build and validate all slots first
      const allSlots: any[] = [];
      const validationErrors: string[] = [];
      const missingSections: string[] = [];

      Object.entries(scheduleData).forEach(([teacherId, teacherSchedule]) => {
        const teacher = teachers.find((t) => t.id === teacherId);
        Object.entries(teacherSchedule).forEach(([day, periods]) => {
          Object.entries(periods).forEach(([period, value]) => {
            if (!value) return;

            const parts = value.split("/");
            if (parts.length !== 2) {
              validationErrors.push(
                `خطأ في تنسيق الإدخال لـ ${teacher?.name || "معلم غير معروف"} - ${day} الحصة ${period}: "${value}"`
              );
              return;
            }

            const grade = parseInt(parts[0], 10);
            const section = parseInt(parts[1], 10);

            if (isNaN(grade) || isNaN(section)) {
              validationErrors.push(
                `خطأ في القيم الرقمية لـ ${teacher?.name || "معلم غير معروف"} - ${day} الحصة ${period}: "${value}"`
              );
              return;
            }

            if (grade < 10 || grade > 12) {
              validationErrors.push(
                `الصف يجب أن يكون بين 10-12 لـ ${teacher?.name || "معلم غير معروف"} - ${day} الحصة ${period}: الصف ${grade}`
              );
              return;
            }

            if (section < 1) {
              validationErrors.push(
                `الشعبة يجب أن تكون رقم موجب لـ ${teacher?.name || "معلم غير معروف"} - ${day} الحصة ${period}: الشعبة ${section}`
              );
              return;
            }

            // Check if section exists for this grade
            const availableSections = gradeSections[grade.toString()] || [];
            if (!availableSections.includes(section)) {
              const sectionKey = `${grade}/${section}`;
              if (!missingSections.includes(sectionKey)) {
                missingSections.push(sectionKey);
              }
            }

            allSlots.push({
              teacherId,
              day,
              period: parseInt(period, 10),
              grade,
              section,
            });
          });
        });
      });

      // If there are missing sections, show specific error
      if (missingSections.length > 0) {
        const sectionsText = missingSections.join("، ");
        throw new Error(
          `الشعب التالية غير موجودة:\n${sectionsText}\n\nيرجى إضافة هذه الشعب من صفحة "الصفوف" → "إدارة الشعب" قبل الحفظ.`
        );
      }

      // If there are validation errors, show them and abort
      if (validationErrors.length > 0) {
        throw new Error(`أخطاء في البيانات:\n${validationErrors.join("\n")}`);
      }

      // استخدام batch API لحفظ جميع الحصص دفعة واحدة
      await apiRequest("/api/schedule-slots/batch", {
        method: "POST",
        body: JSON.stringify({ slots: allSlots }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ الجدول الرئيسي بنجاح",
      });
    },
    onError: (error: any) => {
      if (error.message !== "Conflicts found") {
        toast({
          title: "خطأ",
          description: error.message || "حدث خطأ أثناء الحفظ",
          variant: "destructive",
        });
      }
    },
  });

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">الجدول الرئيسي - جميع المعلمين</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowUploadDialog(true)}>
              <Upload className="ml-2 h-4 w-4" />
              استيراد Excel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="ml-2 h-4 w-4" />
              حفظ الجدول
            </Button>
          </div>
        </div>

        <Card className="p-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm" dir="rtl">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="p-2 bg-primary/10 sticky right-0 z-10 min-w-[200px]">
                  اسم المعلم
                </th>
                <th className="p-2 bg-primary/10 min-w-[80px]">المادة</th>
                {DAYS.map((day) => (
                  <th key={day} colSpan={7} className="p-2 bg-primary/10 border-r-2">
                    {day}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-border">
                <th className="p-2 bg-muted sticky right-0 z-10">-</th>
                <th className="p-2 bg-muted">-</th>
                {DAYS.map((day) =>
                  PERIODS.map((period) => (
                    <th key={`${day}-${period}`} className="p-1 bg-muted text-xs">
                      {period}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {sortedTeachers.map((teacher, idx) => (
                <tr
                  key={teacher.id}
                  className={`border-b border-border hover:bg-muted/50 ${
                    idx > 0 &&
                    teacher.subject !==
                      sortedTeachers[idx - 1].subject
                      ? "border-t-2 border-primary/30"
                      : ""
                  }`}
                >
                  <td className="p-2 font-medium sticky right-0 bg-background z-10">
                    {teacher.name}
                  </td>
                  <td className="p-2 text-muted-foreground text-xs">{teacher.subject}</td>
                  {DAYS.map((day) =>
                    PERIODS.map((period) => (
                      <td key={`${day}-${period}`} className="p-0">
                        <Input
                          value={scheduleData[teacher.id]?.[day]?.[period] || ""}
                          onChange={(e) =>
                            handleCellChange(teacher.id, day, period, e.target.value)
                          }
                          className="h-8 text-sm text-center border-0 rounded-none focus:ring-1 focus:ring-primary min-w-[60px]"
                        />
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

      </div>

      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              تعارضات في الجدول
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>تم العثور على {conflicts.length} تعارض(ات). يرجى التحقق من التالي:</p>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conflicts.map((conflict, idx) => (
                    <Card key={idx} className="p-3 bg-destructive/5">
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">
                          التعارض #{idx + 1}: {conflict.day} - الحصة {conflict.period}
                        </p>
                        <p className="text-muted-foreground">
                          الصف: {conflict.grade}/{conflict.section}
                        </p>
                        <p className="font-medium">المعلمون المتعارضون:</p>
                        <ul className="mr-4 list-disc">
                          {conflict.teachers.map((teacher) => (
                            <li key={teacher.id}>{teacher.name}</li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>حسناً، سأقوم بالتصحيح</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExcelUploadDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />

    </div>
  );
}
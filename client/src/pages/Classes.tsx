import { useState, useEffect } from "react";
import { FileDown, Eye, EyeOff, Edit3, Book, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ClassScheduleTable from "@/components/ClassScheduleTable";
import { EditableClassSchedule } from "@/components/EditableClassSchedule";
import { ScheduleAssistant } from "@/components/ScheduleAssistant";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ClassScheduleSlot } from "@/components/ClassScheduleTable";
import type { Teacher, ScheduleSlot } from "@shared/schema";
import { GRADES } from "@shared/schema";
import { exportClassScheduleExcel, exportAllClassesExcel } from "@/lib/excelGenerator";

export default function Classes() {
  const [selectedGrade, setSelectedGrade] = useState<string>("10");
  const [selectedSection, setSelectedSection] = useState<string>("1");
  const [showTeacherNames, setShowTeacherNames] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [sectionsDialogOpen, setSectionsDialogOpen] = useState(false);
  const [editingSections, setEditingSections] = useState<Record<number, number[]>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gradeSections = {} } = useQuery<Record<string, number[]>>({
    queryKey: ["/api/grade-sections"],
  });

  const currentSections = gradeSections[selectedGrade] || [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    if (gradeSections && Object.keys(gradeSections).length > 0) {
      const sections: Record<number, number[]> = {};
      GRADES.forEach(grade => {
        sections[grade] = gradeSections[grade.toString()] || [1, 2, 3, 4, 5, 6, 7];
      });
      setEditingSections(sections);
    }
  }, [gradeSections]);

  const { data: classSchedule = [], isLoading } = useQuery<ClassScheduleSlot[]>({
    queryKey: [`/api/class-schedules/${selectedGrade}/${selectedSection}`],
  });

  const { data: allSlots = [] } = useQuery<ScheduleSlot[]>({
    queryKey: ["/api/schedule-slots"],
  });

  const { data: allTeachers = [] } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const updateSectionsMutation = useMutation({
    mutationFn: async (data: { grade: number; sections: number[] }) => {
      return apiRequest(`/api/grade-sections/${data.grade}`, {
        method: "PUT",
        body: JSON.stringify({ sections: data.sections }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grade-sections"] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الشعب بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ إعدادات الشعب",
        variant: "destructive",
      });
    },
  });

  const handleSaveSections = async () => {
    for (const grade of GRADES) {
      await updateSectionsMutation.mutateAsync({
        grade,
        sections: editingSections[grade] || [],
      });
    }
    setSectionsDialogOpen(false);
  };

  const handleAddSection = (grade: number) => {
    const currentGradeSections = editingSections[grade] || [];
    const maxSection = currentGradeSections.length > 0 ? Math.max(...currentGradeSections) : 0;
    setEditingSections({
      ...editingSections,
      [grade]: [...currentGradeSections, maxSection + 1].sort((a, b) => a - b),
    });
  };

  const handleRemoveSection = (grade: number, section: number) => {
    setEditingSections({
      ...editingSections,
      [grade]: (editingSections[grade] || []).filter(s => s !== section),
    });
  };

  const handleExportExcel = async () => {
    try {
      await exportClassScheduleExcel(
        parseInt(selectedGrade),
        parseInt(selectedSection),
        classSchedule
      );
      toast({
        title: "تم التصدير",
        description: `تم تصدير جدول الصف ${selectedGrade}/${selectedSection} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportAllExcel = async () => {
    try {
      await exportAllClassesExcel(allSlots, allTeachers, gradeSections);
      toast({
        title: "تم التصدير",
        description: "تم تصدير جداول جميع الصفوف بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير Excel",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold font-heading">جداول الصفوف</h1>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSectionsDialogOpen(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                إدارة الشعب
              </Button>
              <Button
                variant="outline"
                onClick={handleExportAllExcel}
                className="gap-2"
                data-testid="button-export-all-classes"
              >
                <FileDown className="h-4 w-4" />
                تصدير جميع الجداول Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={classSchedule.length === 0}
                className="gap-2"
                data-testid="button-export-current"
              >
                <FileDown className="h-4 w-4" />
                تصدير الجدول الحالي
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border border-card-border">
            <div className="flex items-center gap-3">
              <Label htmlFor="grade" className="font-accent whitespace-nowrap">
                الصف:
              </Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger
                  id="grade"
                  className="w-32"
                  data-testid="select-class-grade"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g.toString()}>
                      الصف {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Label htmlFor="section" className="font-accent whitespace-nowrap">
                الشعبة:
              </Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger
                  id="section"
                  className="w-32"
                  data-testid="select-class-section"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentSections.map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      الشعبة {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="edit-mode"
                checked={editMode}
                onCheckedChange={setEditMode}
              />
              <Label htmlFor="edit-mode" className="font-accent cursor-pointer">
                {editMode ? (
                  <span className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    وضع التعديل
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Book className="h-4 w-4" />
                    وضع القراءة
                  </span>
                )}
              </Label>
            </div>

            {!editMode && (
              <div className="flex items-center gap-2">
                <Switch
                  id="show-teachers"
                  checked={showTeacherNames}
                  onCheckedChange={setShowTeacherNames}
                  data-testid="switch-show-teachers"
                />
                <Label htmlFor="show-teachers" className="font-accent cursor-pointer">
                  {showTeacherNames ? (
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      عرض أسماء المعلمين
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      إخفاء أسماء المعلمين
                    </span>
                  )}
                </Label>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : editMode ? (
            <EditableClassSchedule
              grade={parseInt(selectedGrade)}
              section={parseInt(selectedSection)}
              slots={allSlots.filter(
                (s) =>
                  s.grade === parseInt(selectedGrade) &&
                  s.section === parseInt(selectedSection)
              )}
              allSlots={allSlots}
              allTeachers={allTeachers}
            />
          ) : (
            <ClassScheduleTable
              grade={parseInt(selectedGrade)}
              section={parseInt(selectedSection)}
              slots={classSchedule}
              showTeacherNames={showTeacherNames}
            />
          )}
        </div>
      </div>

      <Dialog open={sectionsDialogOpen} onOpenChange={setSectionsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">إدارة الشعب</DialogTitle>
            <DialogDescription className="font-accent">
              إضافة أو حذف شعب لكل صف دراسي
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {GRADES.map((grade) => (
              <div key={grade} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-heading">الصف {grade}</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddSection(grade)}
                    className="gap-2"
                  >
                    إضافة شعبة
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editingSections[grade] || []).map((section) => (
                    <div
                      key={section}
                      className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-md"
                    >
                      <span className="font-accent">الشعبة {section}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSection(grade, section)}
                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSectionsDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleSaveSections}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-4 left-4 z-50">
        <ScheduleAssistant allSlots={allSlots} />
      </div>
    </div>
  );
}
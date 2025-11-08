import { Card } from "./ui/card";
import { DAYS, PERIODS } from "@shared/schema";
import type { Subject } from "@shared/schema";

export interface ClassScheduleSlot {
  day: string;
  period: number;
  subject: Subject;
  teacherName?: string;
}

interface ClassScheduleTableProps {
  grade: number;
  section: number;
  slots: ClassScheduleSlot[];
  showTeacherNames: boolean;
}

export default function ClassScheduleTable({
  grade,
  section,
  slots,
  showTeacherNames,
}: ClassScheduleTableProps) {
  const getSlot = (day: string, period: number) => {
    return slots.find((s) => s.day === day && s.period === period);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-heading mb-2">
          جدول حصص الصف {grade}/{section}
        </h2>
      </div>

      <Card className="p-6 overflow-x-auto">
        <div className="min-w-[800px]" dir="rtl">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-right font-heading text-sm border border-border bg-muted/50 w-32">
                  اليوم / الحصة
                </th>
                {PERIODS.map((period) => (
                  <th
                    key={period}
                    className="p-3 text-center font-heading text-sm border border-border bg-muted/50 font-data w-28"
                  >
                    الحصة {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className="p-3 font-semibold border border-border bg-muted/30 font-heading w-32">
                    {day}
                  </td>
                  {PERIODS.map((period) => {
                    const slot = getSlot(day, period);
                    return (
                      <td
                        key={`${day}-${period}`}
                        className="border border-border p-3 text-center w-28 h-20"
                      >
                        {slot ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-primary font-heading">
                              {slot.subject}
                            </div>
                            {showTeacherNames && slot.teacherName && (
                              <div className="text-xs text-muted-foreground font-accent">
                                {slot.teacherName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground/50 text-sm">-</div>
                        )}
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

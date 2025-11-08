import { Card } from "./ui/card";
import { DAYS, PERIODS } from "@shared/schema";
import ScheduleCell from "./ScheduleCell";
import type { ScheduleSlotData } from "@/types/schedule";

export type { ScheduleSlotData };

interface ScheduleGridProps {
  slots: ScheduleSlotData[];
  onSlotClick: (day: string, period: number) => void;
  onSlotDelete?: (day: string, period: number) => void;
  readOnly?: boolean;
}

export default function ScheduleGrid({ slots, onSlotClick, onSlotDelete, readOnly = false }: ScheduleGridProps) {
  const getSlot = (day: string, period: number) => {
    return slots?.find((s) => s.day === day && s.period === period);
  };

  return (
    <Card className="p-6 overflow-x-auto">
      <div className="min-w-[800px]" dir="rtl">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '4px' }}>
          <thead>
            <tr>
              <th className="p-3 text-right font-heading text-sm bg-muted/50 w-32 rounded-md">
                اليوم / الحصة
              </th>
              {PERIODS.map((period) => (
                <th
                  key={period}
                  className="p-3 text-center font-heading text-sm bg-muted/50 font-data w-28 rounded-md"
                >
                  الحصة {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day}>
                <td className="p-3 font-semibold bg-muted/30 font-heading w-32 rounded-md">
                  {day}
                </td>
                {PERIODS.map((period) => {
                  const slot = getSlot(day, period);
                  return (
                    <td key={`${day}-${period}`} className="p-0 w-28 h-20 rounded-md overflow-hidden">
                      <ScheduleCell
                        slot={slot}
                        onClick={() => !readOnly && onSlotClick(day, period)}
                        onDelete={onSlotDelete ? () => onSlotDelete(day, period) : undefined}
                        readOnly={readOnly}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

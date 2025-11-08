import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, X, AlertTriangle } from "lucide-react";
import { DAYS, PERIODS, GRADES } from "@shared/schema";
import type { ScheduleSlot } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface ScheduleAssistantProps {
  allSlots: ScheduleSlot[];
}

interface MissingSlot {
  grade: number;
  section: number;
  day: string;
  period: number;
}

export function ScheduleAssistant({ allSlots }: ScheduleAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: gradeSections = {} } = useQuery<Record<string, number[]>>({
    queryKey: ["/api/grade-sections"],
  });

  const getMissingSlots = (): MissingSlot[] => {
    const missing: MissingSlot[] = [];

    GRADES.forEach((grade) => {
      const sections = gradeSections[grade.toString()] || [];
      sections.forEach((section) => {
        DAYS.forEach((day) => {
          PERIODS.forEach((period) => {
            const hasSlot = allSlots.some(
              (slot) =>
                slot.grade === grade &&
                slot.section === section &&
                slot.day === day &&
                slot.period === period
            );

            if (!hasSlot) {
              missing.push({ grade, section, day, period });
            }
          });
        });
      });
    });

    return missing;
  };

  const missingSlots = getMissingSlots();
  const groupedByClass = missingSlots.reduce((acc, slot) => {
    const key = `${slot.grade}/${slot.section}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(slot);
    return acc;
  }, {} as Record<string, MissingSlot[]>);

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 left-6 rounded-full h-16 w-16 shadow-2xl z-50 hover:scale-110 transition-transform"
        size="icon"
        onClick={() => setIsOpen(true)}
        title="المساعد - الحصص الناقصة"
      >
        <HelpCircle className="h-7 w-7" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 left-6 w-96 shadow-2xl z-50 max-h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          المساعد - الحصص الناقصة
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {missingSlots.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-5xl mb-3">✓</div>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              رائع! جميع الحصص مكتملة
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              لا توجد حصص ناقصة في أي صف
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                إجمالي الحصص الناقصة: {missingSlots.length}
              </p>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {Object.entries(groupedByClass).map(([className, slots]) => (
                  <div
                    key={className}
                    className="border rounded-lg p-3 bg-muted/30"
                  >
                    <h4 className="font-semibold mb-2 text-primary">
                      الصف {className}
                    </h4>
                    <div className="space-y-1">
                      {slots.map((slot, idx) => (
                        <div
                          key={idx}
                          className="text-sm bg-background/60 p-2 rounded flex items-center gap-2"
                        >
                          <span className="text-red-500">•</span>
                          <span>
                            {slot.day} - الحصة {slot.period}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

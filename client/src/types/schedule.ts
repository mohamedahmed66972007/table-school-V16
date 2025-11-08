import type { Grade, Section, Day, Period, Subject } from "@shared/schema";

export interface ScheduleSlotData {
  grade: Grade;
  section: Section;
  day: Day;
  period: Period;
  subject?: Subject;
  teacherId?: string;
  teacherName?: string;
}

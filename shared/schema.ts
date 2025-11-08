import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const SUBJECTS = [
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
] as const;

export const DEFAULT_TEACHERS = [
  { name: "إبراهيم علي عبد العزيز", subject: "إسلامية" as const },
  { name: "محمد علي علي الشرقاوي", subject: "إسلامية" as const },
  { name: "إبراهيم جابر يونس غانم", subject: "إسلامية" as const },
  { name: "السعيد محمود عبد السلام", subject: "إسلامية" as const },
  { name: "مصطفى عبد العزيز", subject: "إسلامية" as const },
  { name: "رمضان رمضان إبراهيم", subject: "عربي" as const },
  { name: "عنتر عبده عبده المجدي", subject: "عربي" as const },
  { name: "محمد تحفة", subject: "عربي" as const },
  { name: "فتحي كمال", subject: "عربي" as const },
  { name: "خالد ريحان عطاالله", subject: "عربي" as const },
  { name: "محمد علي ضاحي", subject: "عربي" as const },
  { name: "اسلام عادل", subject: "عربي" as const },
  { name: "هاني جاد سالم", subject: "عربي" as const },
  { name: "إشراف مصطفى عبد السلام", subject: "إنجليزي" as const },
  { name: "إيهاب طلعت محمود", subject: "إنجليزي" as const },
  { name: "صيام مصطفى أحمد", subject: "إنجليزي" as const },
  { name: "رمضان سيف حافظ", subject: "إنجليزي" as const },
  { name: "عصام محمد رجب", subject: "إنجليزي" as const },
  { name: "جمال عيسى", subject: "إنجليزي" as const },
  { name: "بسيوني علي", subject: "إنجليزي" as const },
  { name: "عبد السميع محمد صالح", subject: "رياضيات" as const },
  { name: "عبد المنعم فرج إبراهيم", subject: "رياضيات" as const },
  { name: "محمد عبد الله علي إبراهيم", subject: "رياضيات" as const },
  { name: "إبراهيم محمد الخضرجي", subject: "رياضيات" as const },
  { name: "محمود حسانين إسماعيل", subject: "رياضيات" as const },
  { name: "أيمن وحيد", subject: "رياضيات" as const },
  { name: "شريف لطفي", subject: "رياضيات" as const },
  { name: "أحمد مريسي", subject: "رياضيات" as const },
  { name: "خليل حسن عثمان خليل", subject: "كيمياء" as const },
  { name: "احمد عبد العزيز سليم خاطر", subject: "كيمياء" as const },
  { name: "الحسين محمد شاكر", subject: "كيمياء" as const },
  { name: "عاطف محمد عبد الرحيم", subject: "كيمياء" as const },
  { name: "محمود قطب", subject: "كيمياء" as const },
  { name: "محمد حجاب", subject: "فيزياء" as const },
  { name: "عامر محمد العلوة", subject: "فيزياء" as const },
  { name: "عبدالسلام عطية", subject: "فيزياء" as const },
  { name: "حسني محمد جاد الكريم", subject: "فيزياء" as const },
  { name: "محمد حسن", subject: "أحياء" as const },
  { name: "مهند عارضة", subject: "أحياء" as const },
  { name: "عبد الحكيم علي إسماعيل", subject: "أحياء" as const },
  { name: "احمد عطية الضوي", subject: "أحياء" as const },
  { name: "طارق عبد الفتاح سعيد", subject: "اجتماعيات" as const },
  { name: "زكي هاني", subject: "اجتماعيات" as const },
  { name: "طه حمزة جلال", subject: "حاسوب" as const },
  { name: "أسامة أبو الفتوح", subject: "حاسوب" as const },
  { name: "تامر الأشوح", subject: "بدنية" as const },
  { name: "إيهاب مرزوق", subject: "بدنية" as const },
  { name: "حمادة بسطاوي", subject: "بدنية" as const },
  { name: "خالد عرفان", subject: "بدنية" as const },
  { name: "إبراهيم إبراهيم حافظ عبد النبي", subject: "فنية" as const },
] as const;

export const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"] as const;

export const PERIODS = [1, 2, 3, 4, 5, 6, 7] as const;

export const GRADES = [10, 11, 12] as const;

export const SECTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

export type Subject = typeof SUBJECTS[number];
export type Day = typeof DAYS[number];
export type Period = typeof PERIODS[number];
export type Grade = typeof GRADES[number];
export type Section = typeof SECTIONS[number] | number;

export const teachers = pgTable("teachers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull().$type<Subject>(),
});

export const scheduleSlots = pgTable("schedule_slots", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
  day: text("day").notNull().$type<Day>(),
  period: integer("period").notNull().$type<Period>(),
  grade: integer("grade").notNull().$type<Grade>(),
  section: integer("section").notNull().$type<Section>(),
});

export const gradeSections = pgTable("grade_sections", {
  id: text("id").primaryKey(),
  grade: integer("grade").notNull().$type<Grade>(),
  sections: text("sections").notNull(),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true }).extend({
  subject: z.enum(SUBJECTS),
});

export const insertScheduleSlotSchema = createInsertSchema(scheduleSlots).omit({ id: true }).extend({
  day: z.enum(DAYS),
  period: z.number().int().min(1).max(7),
  grade: z.number().int().min(10).max(12),
  section: z.number().int().min(1),
  teacherId: z.string(),
});

export const insertGradeSectionSchema = createInsertSchema(gradeSections).omit({ id: true }).extend({
  grade: z.number().int().min(10).max(12),
  sections: z.string(),
});

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type ScheduleSlot = typeof scheduleSlots.$inferSelect;
export type InsertScheduleSlot = z.infer<typeof insertScheduleSlotSchema>;
export type GradeSection = typeof gradeSections.$inferSelect;
export type InsertGradeSection = z.infer<typeof insertGradeSectionSchema>;
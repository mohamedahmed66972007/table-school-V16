import { type Teacher, type InsertTeacher, type ScheduleSlot, type InsertScheduleSlot, type GradeSection, type InsertGradeSection, DEFAULT_TEACHERS, teachers, scheduleSlots, gradeSections } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getTeacher(id: string): Promise<Teacher | undefined>;
  getAllTeachers(): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: string): Promise<boolean>;

  getScheduleSlot(id: string): Promise<ScheduleSlot | undefined>;
  getTeacherScheduleSlots(teacherId: string): Promise<ScheduleSlot[]>;
  getAllScheduleSlots(): Promise<ScheduleSlot[]>;
  createScheduleSlot(slot: InsertScheduleSlot): Promise<ScheduleSlot>;
  updateScheduleSlot(id: string, slot: Partial<InsertScheduleSlot>): Promise<ScheduleSlot | undefined>;
  deleteScheduleSlot(id: string): Promise<boolean>;
  deleteTeacherScheduleSlots(teacherId: string): Promise<boolean>;
  deleteAllScheduleSlots(): Promise<boolean>;

  getGradeSections(grade: number): Promise<number[]>;
  setGradeSections(grade: number, sections: number[]): Promise<void>;
  getAllGradeSections(): Promise<Map<number, number[]>>;

  clearAllData(): Promise<void>;
  initializeDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher || undefined;
  }

  async getAllTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const id = randomUUID();
    const [teacher] = await db
      .insert(teachers)
      .values({ ...insertTeacher, id })
      .returning();
    return teacher;
  }

  async updateTeacher(id: string, updates: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const [teacher] = await db
      .update(teachers)
      .set(updates)
      .where(eq(teachers.id, id))
      .returning();
    return teacher || undefined;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const result = await db.delete(teachers).where(eq(teachers.id, id));
    return true;
  }

  async getScheduleSlot(id: string): Promise<ScheduleSlot | undefined> {
    const [slot] = await db.select().from(scheduleSlots).where(eq(scheduleSlots.id, id));
    return slot || undefined;
  }

  async getTeacherScheduleSlots(teacherId: string): Promise<ScheduleSlot[]> {
    return await db.select().from(scheduleSlots).where(eq(scheduleSlots.teacherId, teacherId));
  }

  async getAllScheduleSlots(): Promise<ScheduleSlot[]> {
    return await db.select().from(scheduleSlots);
  }

  async createScheduleSlot(insertSlot: InsertScheduleSlot): Promise<ScheduleSlot> {
    const id = randomUUID();
    const [slot] = await db
      .insert(scheduleSlots)
      .values({ ...insertSlot, id })
      .returning();
    return slot;
  }

  async updateScheduleSlot(id: string, updates: Partial<InsertScheduleSlot>): Promise<ScheduleSlot | undefined> {
    const [slot] = await db
      .update(scheduleSlots)
      .set(updates)
      .where(eq(scheduleSlots.id, id))
      .returning();
    return slot || undefined;
  }

  async deleteScheduleSlot(id: string): Promise<boolean> {
    await db.delete(scheduleSlots).where(eq(scheduleSlots.id, id));
    return true;
  }

  async deleteTeacherScheduleSlots(teacherId: string): Promise<boolean> {
    await db.delete(scheduleSlots).where(eq(scheduleSlots.teacherId, teacherId));
    return true;
  }

  async deleteAllScheduleSlots(): Promise<boolean> {
    await db.delete(scheduleSlots);
    return true;
  }

  async getGradeSections(grade: number): Promise<number[]> {
    const [result] = await db.select().from(gradeSections).where(eq(gradeSections.grade, grade));
    if (result) {
      return JSON.parse(result.sections);
    }
    return [1, 2, 3, 4, 5, 6, 7];
  }

  async setGradeSections(grade: number, sections: number[]): Promise<void> {
    const existing = await db.select().from(gradeSections).where(eq(gradeSections.grade, grade));
    
    if (existing.length > 0) {
      await db
        .update(gradeSections)
        .set({ sections: JSON.stringify(sections) })
        .where(eq(gradeSections.grade, grade));
    } else {
      await db.insert(gradeSections).values({
        id: randomUUID(),
        grade,
        sections: JSON.stringify(sections),
      });
    }
  }

  async getAllGradeSections(): Promise<Map<number, number[]>> {
    const allSections = await db.select().from(gradeSections);
    const sectionsMap = new Map<number, number[]>();
    
    allSections.forEach(section => {
      sectionsMap.set(section.grade, JSON.parse(section.sections));
    });
    
    if (sectionsMap.size === 0) {
      sectionsMap.set(10, [1, 2, 3, 4, 5, 6, 7, 8]);
      sectionsMap.set(11, [1, 2, 3, 4, 5, 6, 7, 8]);
      sectionsMap.set(12, [1, 2, 3, 4, 5, 6, 7]);
    }
    
    return sectionsMap;
  }

  async clearAllData(): Promise<void> {
    await db.delete(scheduleSlots);
    await db.delete(teachers);
  }

  async initializeDefaultData(): Promise<void> {
    const existingTeachers = await this.getAllTeachers();
    if (existingTeachers.length === 0) {
      for (const teacherData of DEFAULT_TEACHERS) {
        await this.createTeacher({
          name: teacherData.name,
          subject: teacherData.subject,
        });
      }
    }

    const existingSections = await db.select().from(gradeSections);
    if (existingSections.length === 0) {
      await db.insert(gradeSections).values([
        { id: randomUUID(), grade: 10, sections: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8]) },
        { id: randomUUID(), grade: 11, sections: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8]) },
        { id: randomUUID(), grade: 12, sections: JSON.stringify([1, 2, 3, 4, 5, 6, 7]) },
      ]);
    }
  }
}

export const storage = new DatabaseStorage();

import { type Teacher, type InsertTeacher, type ScheduleSlot, type InsertScheduleSlot, type GradeSection, type InsertGradeSection, DEFAULT_TEACHERS } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Teacher methods
  getTeacher(id: string): Promise<Teacher | undefined>;
  getAllTeachers(): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: string): Promise<boolean>;

  // Schedule slot methods
  getScheduleSlot(id: string): Promise<ScheduleSlot | undefined>;
  getTeacherScheduleSlots(teacherId: string): Promise<ScheduleSlot[]>;
  getAllScheduleSlots(): Promise<ScheduleSlot[]>;
  createScheduleSlot(slot: InsertScheduleSlot): Promise<ScheduleSlot>;
  updateScheduleSlot(id: string, slot: Partial<InsertScheduleSlot>): Promise<ScheduleSlot | undefined>;
  deleteScheduleSlot(id: string): Promise<boolean>;
  deleteTeacherScheduleSlots(teacherId: string): Promise<boolean>;
  deleteAllScheduleSlots(): Promise<boolean>;

  // Grade section methods
  getGradeSections(grade: number): Promise<number[]>;
  setGradeSections(grade: number, sections: number[]): Promise<void>;
  getAllGradeSections(): Promise<Map<number, number[]>>;

  // Utility methods
  clearAllData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private teachers: Map<string, Teacher>;
  private scheduleSlots: Map<string, ScheduleSlot>;
  private gradeSections: Map<number, number[]>;

  constructor() {
    this.teachers = new Map();
    this.scheduleSlots = new Map();
    this.gradeSections = new Map([
      [10, [1, 2, 3, 4, 5, 6, 7, 8]],
      [11, [1, 2, 3, 4, 5, 6, 7, 8]],
      [12, [1, 2, 3, 4, 5, 6, 7]],
    ]);

    // Initialize default teachers
    DEFAULT_TEACHERS.forEach((teacherData) => {
      const id = randomUUID();
      const teacher: Teacher = { 
        id, 
        name: teacherData.name, 
        subject: teacherData.subject 
      };
      this.teachers.set(id, teacher);
    });
  }

  // Teacher methods
  async getTeacher(id: string): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async getAllTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachers.values());
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const id = randomUUID();
    const teacher: Teacher = { ...insertTeacher, id };
    this.teachers.set(id, teacher);
    return teacher;
  }

  async updateTeacher(id: string, updates: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const teacher = this.teachers.get(id);
    if (!teacher) return undefined;

    const updated = { ...teacher, ...updates };
    this.teachers.set(id, updated);
    return updated;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const deleted = this.teachers.delete(id);
    if (deleted) {
      await this.deleteTeacherScheduleSlots(id);
    }
    return deleted;
  }

  // Schedule slot methods
  async getScheduleSlot(id: string): Promise<ScheduleSlot | undefined> {
    return this.scheduleSlots.get(id);
  }

  async getTeacherScheduleSlots(teacherId: string): Promise<ScheduleSlot[]> {
    return Array.from(this.scheduleSlots.values()).filter(
      (slot) => slot.teacherId === teacherId
    );
  }

  async getAllScheduleSlots(): Promise<ScheduleSlot[]> {
    return Array.from(this.scheduleSlots.values());
  }

  async createScheduleSlot(insertSlot: InsertScheduleSlot): Promise<ScheduleSlot> {
    const id = randomUUID();
    const slot: ScheduleSlot = { ...insertSlot, id } as ScheduleSlot;
    this.scheduleSlots.set(id, slot);
    return slot;
  }

  async updateScheduleSlot(id: string, updates: Partial<InsertScheduleSlot>): Promise<ScheduleSlot | undefined> {
    const slot = this.scheduleSlots.get(id);
    if (!slot) return undefined;

    const updated = { ...slot, ...updates } as ScheduleSlot;
    this.scheduleSlots.set(id, updated);
    return updated;
  }

  async deleteScheduleSlot(id: string): Promise<boolean> {
    return this.scheduleSlots.delete(id);
  }

  async deleteTeacherScheduleSlots(teacherId: string): Promise<boolean> {
    const slots = await this.getTeacherScheduleSlots(teacherId);
    slots.forEach(slot => this.scheduleSlots.delete(slot.id));
    return true;
  }

  async deleteAllScheduleSlots(): Promise<boolean> {
    this.scheduleSlots.clear();
    return true;
  }

  // Grade section methods
  async getGradeSections(grade: number): Promise<number[]> {
    return this.gradeSections.get(grade) || [1, 2, 3, 4, 5, 6, 7];
  }

  async setGradeSections(grade: number, sections: number[]): Promise<void> {
    this.gradeSections.set(grade, sections);
  }

  async getAllGradeSections(): Promise<Map<number, number[]>> {
    return new Map(this.gradeSections);
  }

  async clearAllData(): Promise<void> {
    this.teachers.clear();
    this.scheduleSlots.clear();
  }
}

export const storage = new MemStorage();
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTeacherSchema, insertScheduleSlotSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import ExcelJS from "exceljs";
import { nanoid } from "nanoid";
import { DAYS, PERIODS, SUBJECTS, type Day, type Period, type Subject, type Grade } from "@shared/schema";
import { normalizeSubjectName } from "./subjectNormalization";

export async function registerRoutes(app: Express): Promise<Server> {
  // Teacher routes
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });

  app.get("/api/teachers/:id", async (req, res) => {
    try {
      const teacher = await storage.getTeacher(req.params.id);
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      console.error("Error fetching teacher:", error);
      res.status(500).json({ error: "Failed to fetch teacher" });
    }
  });

  app.post("/api/teachers", async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(validatedData);
      res.status(201).json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating teacher:", error);
      res.status(500).json({ error: "Failed to create teacher" });
    }
  });

  // Update teacher
  app.patch("/api/teachers/:id", async (req, res) => {
    try {
      const result = insertTeacherSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      const teacher = await storage.updateTeacher(req.params.id, result.data);
      res.json(teacher);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete teacher
  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTeacher(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      res.status(500).json({ error: "Failed to delete teacher" });
    }
  });

  // Schedule slot routes
  app.get("/api/schedule-slots", async (req, res) => {
    try {
      const slots = await storage.getAllScheduleSlots();
      res.json(slots);
    } catch (error) {
      console.error("Error fetching schedule slots:", error);
      res.status(500).json({ error: "Failed to fetch schedule slots" });
    }
  });

  app.get("/api/teachers/:teacherId/schedule-slots", async (req, res) => {
    try {
      const slots = await storage.getTeacherScheduleSlots(req.params.teacherId);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching teacher schedule slots:", error);
      res.status(500).json({ error: "Failed to fetch teacher schedule slots" });
    }
  });

  app.post("/api/schedule-slots", async (req, res) => {
    try {
      const validatedData = insertScheduleSlotSchema.parse(req.body);
      const slot = await storage.createScheduleSlot(validatedData);
      res.status(201).json(slot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating schedule slot:", error);
      res.status(500).json({ error: "Failed to create schedule slot" });
    }
  });

  app.patch("/api/schedule-slots/:id", async (req, res) => {
    try {
      const updates = insertScheduleSlotSchema.partial().parse(req.body);
      const slot = await storage.updateScheduleSlot(req.params.id, updates);
      if (!slot) {
        return res.status(404).json({ error: "Schedule slot not found" });
      }
      res.json(slot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating schedule slot:", error);
      res.status(500).json({ error: "Failed to update schedule slot" });
    }
  });

  app.delete("/api/schedule-slots/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteScheduleSlot(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Schedule slot not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting schedule slot:", error);
      res.status(500).json({ error: "Failed to delete schedule slot" });
    }
  });

  // Delete all schedule slots
  app.delete("/api/schedule-slots", async (req, res) => {
    try {
      await storage.deleteAllScheduleSlots();
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting all schedule slots:", error);
      res.status(500).json({ error: "Failed to delete all schedule slots" });
    }
  });

  // Batch save all schedule slots (faster than individual saves)
  app.post("/api/schedule-slots/batch", async (req, res) => {
    try {
      const { slots } = req.body;
      if (!Array.isArray(slots)) {
        return res.status(400).json({ error: "Slots must be an array" });
      }

      // Validate all slots first
      for (const slotData of slots) {
        insertScheduleSlotSchema.parse(slotData);
      }

      // Delete all existing slots
      await storage.deleteAllScheduleSlots();

      // Create new slots
      const createdSlots = [];
      for (const slotData of slots) {
        const slot = await storage.createScheduleSlot(slotData);
        createdSlots.push(slot);
      }

      res.status(201).json(createdSlots);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error batch saving schedule slots:", error);
      res.status(500).json({ error: "Failed to batch save schedule slots" });
    }
  });

  // Batch operations for schedule slots
  app.post("/api/teachers/:teacherId/schedule-slots/batch", async (req, res) => {
    try {
      const { slots } = req.body;
      if (!Array.isArray(slots)) {
        return res.status(400).json({ error: "Slots must be an array" });
      }

      // Check for conflicts with other teachers
      const allSlots = await storage.getAllScheduleSlots();
      const allTeachers = await storage.getAllTeachers();
      const teacherMap = new Map(allTeachers.map(t => [t.id, t]));

      for (const slotData of slots) {
        const conflictingSlot = allSlots.find(
          (existingSlot) =>
            existingSlot.teacherId !== req.params.teacherId &&
            existingSlot.day === slotData.day &&
            existingSlot.period === slotData.period &&
            existingSlot.grade === slotData.grade &&
            existingSlot.section === slotData.section
        );

        if (conflictingSlot) {
          const conflictingTeacher = teacherMap.get(conflictingSlot.teacherId);
          return res.status(409).json({
            error: "conflict",
            message: `يوجد تعارض: الأستاذ ${conflictingTeacher?.name || "غير معروف"} (${conflictingTeacher?.subject || "غير معروف"}) لديه حصة في نفس الوقت للصف ${slotData.grade}/${slotData.section} يوم ${slotData.day} الحصة ${slotData.period}`,
            conflictingTeacher: {
              name: conflictingTeacher?.name,
              subject: conflictingTeacher?.subject,
            },
            slot: {
              day: slotData.day,
              period: slotData.period,
              grade: slotData.grade,
              section: slotData.section,
            },
          });
        }
      }

      // Delete existing slots for this teacher
      await storage.deleteTeacherScheduleSlots(req.params.teacherId);

      // Create new slots
      const createdSlots = [];
      for (const slotData of slots) {
        const validatedData = insertScheduleSlotSchema.parse({
          ...slotData,
          teacherId: req.params.teacherId,
        });
        const slot = await storage.createScheduleSlot(validatedData);
        createdSlots.push(slot);
      }

      res.status(201).json(createdSlots);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error batch creating schedule slots:", error);
      res.status(500).json({ error: "Failed to batch create schedule slots" });
    }
  });

  // Get class schedules (aggregate all teachers' schedules by grade/section)
  app.get("/api/class-schedules/:grade/:section", async (req, res) => {
    try {
      const grade = parseInt(req.params.grade);
      const section = parseInt(req.params.section);

      if (isNaN(grade) || isNaN(section)) {
        return res.status(400).json({ error: "Invalid grade or section" });
      }

      const allSlots = await storage.getAllScheduleSlots();
      const allTeachers = await storage.getAllTeachers();

      const classSlots = allSlots.filter(
        slot => slot.grade === grade && slot.section === section
      );

      const teacherMap = new Map(allTeachers.map(t => [t.id, t]));

      const schedule = classSlots.map(slot => {
        const teacher = teacherMap.get(slot.teacherId);
        return {
          day: slot.day,
          period: slot.period,
          subject: teacher?.subject || "Unknown",
          teacherName: teacher?.name || "Unknown",
        };
      });

      res.json(schedule);
    } catch (error) {
      console.error("Error fetching class schedule:", error);
      res.status(500).json({ error: "Failed to fetch class schedule" });
    }
  });

  // Save class schedule
  app.post("/api/class-schedules/:grade/:section", async (req, res) => {
    try {
      const grade = parseInt(req.params.grade);
      const section = parseInt(req.params.section);
      const { slots } = req.body;

      if (isNaN(grade) || isNaN(section)) {
        return res.status(400).json({ error: "Invalid grade or section" });
      }

      if (!Array.isArray(slots)) {
        return res.status(400).json({ error: "Slots must be an array" });
      }

      // Delete existing slots for this class
      const allSlots = await storage.getAllScheduleSlots();
      const existingSlots = allSlots.filter(
        slot => slot.grade === grade && slot.section === section
      );

      for (const slot of existingSlots) {
        await storage.deleteScheduleSlot(slot.id);
      }

      // Create new slots
      const createdSlots = [];
      for (const slotData of slots) {
        const validatedData = insertScheduleSlotSchema.parse({
          ...slotData,
          grade,
          section,
        });
        const slot = await storage.createScheduleSlot(validatedData);
        createdSlots.push(slot);
      }

      res.status(201).json(createdSlots);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error saving class schedule:", error);
      res.status(500).json({ error: "Failed to save class schedule" });
    }
  });

  // Grade sections routes
  app.get("/api/grade-sections", async (req, res) => {
    try {
      const sectionsMap = await storage.getAllGradeSections();
      const sections: Record<string, number[]> = {};
      sectionsMap.forEach((value, key) => {
        sections[key.toString()] = value;
      });
      res.json(sections);
    } catch (error) {
      console.error("Error fetching grade sections:", error);
      res.status(500).json({ error: "Failed to fetch grade sections" });
    }
  });

  app.get("/api/grade-sections/:grade", async (req, res) => {
    try {
      const grade = parseInt(req.params.grade);
      if (isNaN(grade)) {
        return res.status(400).json({ error: "Invalid grade" });
      }
      const sections = await storage.getGradeSections(grade);
      res.json({ grade, sections });
    } catch (error) {
      console.error("Error fetching grade sections:", error);
      res.status(500).json({ error: "Failed to fetch grade sections" });
    }
  });

  app.put("/api/grade-sections/:grade", async (req, res) => {
    try {
      const grade = parseInt(req.params.grade);
      const { sections } = req.body;

      if (isNaN(grade)) {
        return res.status(400).json({ error: "Invalid grade" });
      }

      if (!Array.isArray(sections) || !sections.every(s => typeof s === 'number')) {
        return res.status(400).json({ error: "Sections must be an array of numbers" });
      }

      await storage.setGradeSections(grade, sections);
      res.json({ grade, sections });
    } catch (error) {
      console.error("Error updating grade sections:", error);
      res.status(500).json({ error: "Failed to update grade sections" });
    }
  });

  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/import-excel", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const ignoreConflicts = req.body.ignoreConflicts === 'true';

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return res.status(400).json({ error: "الملف لا يحتوي على أي ورقة عمل" });
      }

      const teachersMap = new Map<string, any>();
      const slotsArray: any[] = [];
      const conflicts: any[] = [];

      const startRow = 5;
      const endRow = worksheet.rowCount;

      for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
        const row = worksheet.getRow(rowNum);

        const teacherNameCell = row.getCell(39);
        const subjectCell = row.getCell(38);

        const teacherName = teacherNameCell.value?.toString().trim();
        const subjectName = subjectCell.value?.toString().trim();

        if (!teacherName || !subjectName) {
          continue;
        }

        const subject = normalizeSubjectName(subjectName);

        if (!teachersMap.has(teacherName)) {
          const teacherId = nanoid();
          teachersMap.set(teacherName, {
            id: teacherId,
            name: teacherName,
            subject: subject,
          });
        }

        const teacher = teachersMap.get(teacherName);

        const reversedDays = [...DAYS].reverse();
        const reversedPeriods = [...PERIODS].reverse();

        let colOffset = 3;
        reversedDays.forEach((day) => {
          reversedPeriods.forEach((period) => {
            const cell = row.getCell(colOffset);
            const cellValue = cell.value?.toString().trim();

            if (cellValue && cellValue.includes('/')) {
              const parts = cellValue.split('/');
              if (parts.length === 2) {
                let grade: number;
                let section: number;

                // Check if the first part is a number and the second part is a number
                const part1 = parseInt(parts[0], 10);
                const part2 = parseInt(parts[1], 10);

                if (!isNaN(part1) && !isNaN(part2)) {
                  // If the first part is a number between 10 and 12, assume it's grade
                  if (part1 >= 10 && part1 <= 12) {
                    grade = part1;
                    section = part2;
                  } else {
                    // Otherwise, assume the second part is grade and the first is section
                    grade = part2;
                    section = part1;
                  }

                  if (!isNaN(grade) && !isNaN(section) && grade >= 10 && grade <= 12) {
                    const slot = {
                      id: nanoid(),
                      teacherId: teacher.id,
                      day,
                      period,
                      grade: grade as Grade,
                      section,
                    };
                    slotsArray.push(slot);
                  }
                }
              }
            }
            colOffset++;
          });
        });
      }

      const slotKeys = new Map<string, any[]>();
      slotsArray.forEach((slot) => {
        const key = `${slot.day}-${slot.period}-${slot.grade}-${slot.section}`;
        if (!slotKeys.has(key)) {
          slotKeys.set(key, []);
        }
        slotKeys.get(key)!.push(slot);
      });

      slotKeys.forEach((slots, key) => {
        if (slots.length > 1) {
          const teacherNames = slots.map(s => {
            const t = Array.from(teachersMap.values()).find((t: any) => t.id === s.teacherId);
            return t ? t.name : 'Unknown';
          });
          conflicts.push({
            type: "overlap",
            message: `تعارض في الحصة: ${slots[0].day} - الحصة ${slots[0].period} - الصف ${slots[0].grade}/${slots[0].section}`,
            details: {
              day: slots[0].day,
              period: slots[0].period,
              grade: slots[0].grade,
              section: slots[0].section,
              teachers: teacherNames,
            },
          });
        }
      });

      if (conflicts.length > 0 && !ignoreConflicts) {
        return res.status(409).json({
          conflicts,
          teachers: Array.from(teachersMap.values()),
          slots: slotsArray,
        });
      }

      await storage.clearAllData();

      for (const teacher of Array.from(teachersMap.values())) {
        await storage.createTeacher({ name: teacher.name, subject: teacher.subject });
      }

      const newTeachers = await storage.getAllTeachers();
      const teacherNameToId = new Map(newTeachers.map(t => [t.name, t.id]));

      for (const slot of slotsArray) {
        const teacherName = Array.from(teachersMap.values()).find((t: any) => t.id === slot.teacherId)?.name;
        if (teacherName) {
          const realTeacherId = teacherNameToId.get(teacherName);
          if (realTeacherId) {
            await storage.createScheduleSlot({
              teacherId: realTeacherId,
              day: slot.day,
              period: slot.period,
              grade: slot.grade,
              section: slot.section,
            });
          }
        }
      }

      res.json({
        success: true,
        teachersImported: newTeachers.length,
        slotsImported: slotsArray.length,
        conflicts: conflicts.length,
      });
    } catch (error: any) {
      console.error("Error importing Excel:", error);
      res.status(500).json({ error: "Failed to import Excel file", message: error.message });
    }
  });

  const templateUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.originalname.endsWith('.xlsx')) {
        cb(null, true);
      } else {
        cb(new Error('Only .xlsx files are allowed'));
      }
    }
  });

  app.post("/api/upload-template", templateUpload.single('template'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fs = await import('fs/promises');
      const path = await import('path');
      
      const templatePath = path.join(process.cwd(), 'client', 'public', 'جداول_template_new.xlsx');
      
      await fs.writeFile(templatePath, req.file.buffer);

      res.json({ 
        success: true, 
        message: "Template uploaded successfully",
        filename: 'جداول_template_new.xlsx'
      });
    } catch (error: any) {
      console.error("Error uploading template:", error);
      res.status(500).json({ error: "Failed to upload template", message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
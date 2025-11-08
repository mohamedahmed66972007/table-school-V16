// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  teachers;
  scheduleSlots;
  gradeSections;
  constructor() {
    this.teachers = /* @__PURE__ */ new Map();
    this.scheduleSlots = /* @__PURE__ */ new Map();
    this.gradeSections = /* @__PURE__ */ new Map([
      [10, [1, 2, 3, 4, 5, 6, 7]],
      [11, [1, 2, 3, 4, 5, 6, 7]],
      [12, [1, 2, 3, 4, 5, 6, 7]]
    ]);
  }
  // Teacher methods
  async getTeacher(id) {
    return this.teachers.get(id);
  }
  async getAllTeachers() {
    return Array.from(this.teachers.values());
  }
  async createTeacher(insertTeacher) {
    const id = randomUUID();
    const teacher = { ...insertTeacher, id };
    this.teachers.set(id, teacher);
    return teacher;
  }
  async updateTeacher(id, updates) {
    const teacher = this.teachers.get(id);
    if (!teacher) return void 0;
    const updated = { ...teacher, ...updates };
    this.teachers.set(id, updated);
    return updated;
  }
  async deleteTeacher(id) {
    const deleted = this.teachers.delete(id);
    if (deleted) {
      await this.deleteTeacherScheduleSlots(id);
    }
    return deleted;
  }
  // Schedule slot methods
  async getScheduleSlot(id) {
    return this.scheduleSlots.get(id);
  }
  async getTeacherScheduleSlots(teacherId) {
    return Array.from(this.scheduleSlots.values()).filter(
      (slot) => slot.teacherId === teacherId
    );
  }
  async getAllScheduleSlots() {
    return Array.from(this.scheduleSlots.values());
  }
  async createScheduleSlot(insertSlot) {
    const id = randomUUID();
    const slot = { ...insertSlot, id };
    this.scheduleSlots.set(id, slot);
    return slot;
  }
  async updateScheduleSlot(id, updates) {
    const slot = this.scheduleSlots.get(id);
    if (!slot) return void 0;
    const updated = { ...slot, ...updates };
    this.scheduleSlots.set(id, updated);
    return updated;
  }
  async deleteScheduleSlot(id) {
    return this.scheduleSlots.delete(id);
  }
  async deleteTeacherScheduleSlots(teacherId) {
    const slots = await this.getTeacherScheduleSlots(teacherId);
    slots.forEach((slot) => this.scheduleSlots.delete(slot.id));
    return true;
  }
  // Grade section methods
  async getGradeSections(grade) {
    return this.gradeSections.get(grade) || [1, 2, 3, 4, 5, 6, 7];
  }
  async setGradeSections(grade, sections) {
    this.gradeSections.set(grade, sections);
  }
  async getAllGradeSections() {
    return new Map(this.gradeSections);
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var SUBJECTS = [
  "\u0639\u0631\u0628\u064A",
  "\u0625\u0646\u062C\u0644\u064A\u0632\u064A",
  "\u0631\u064A\u0627\u0636\u064A\u0627\u062A",
  "\u0643\u064A\u0645\u064A\u0627\u0621",
  "\u0641\u064A\u0632\u064A\u0627\u0621",
  "\u0623\u062D\u064A\u0627\u0621",
  "\u0625\u0633\u0644\u0627\u0645\u064A\u0629 \u0648\u0642\u0631\u0622\u0646",
  "\u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0627\u062A",
  "\u062C\u064A\u0648\u0644\u0648\u062C\u064A\u0627",
  "\u062F\u0633\u062A\u0648\u0631",
  "\u062D\u0627\u0633\u0648\u0628",
  "\u0628\u062F\u0646\u064A\u0629",
  "\u0641\u0646\u064A\u0629",
  "\u0627\u062E\u062A\u064A\u0627\u0631 \u062D\u0631"
];
var DAYS = ["\u0627\u0644\u0623\u062D\u062F", "\u0627\u0644\u0627\u062B\u0646\u064A\u0646", "\u0627\u0644\u062B\u0644\u0627\u062B\u0627\u0621", "\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621", "\u0627\u0644\u062E\u0645\u064A\u0633"];
var teachers = pgTable("teachers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull().$type()
});
var scheduleSlots = pgTable("schedule_slots", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
  day: text("day").notNull().$type(),
  period: integer("period").notNull().$type(),
  grade: integer("grade").notNull().$type(),
  section: integer("section").notNull().$type()
});
var gradeSections = pgTable("grade_sections", {
  id: text("id").primaryKey(),
  grade: integer("grade").notNull().$type(),
  sections: text("sections").notNull()
});
var insertTeacherSchema = createInsertSchema(teachers).omit({ id: true }).extend({
  subject: z.enum(SUBJECTS)
});
var insertScheduleSlotSchema = createInsertSchema(scheduleSlots).omit({ id: true }).extend({
  day: z.enum(DAYS),
  period: z.number().int().min(1).max(7),
  grade: z.number().int().min(10).max(12),
  section: z.number().int().min(1),
  teacherId: z.string()
});
var insertGradeSectionSchema = createInsertSchema(gradeSections).omit({ id: true }).extend({
  grade: z.number().int().min(10).max(12),
  sections: z.string()
});

// server/routes.ts
import { z as z2 } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/teachers", async (req, res) => {
    try {
      const teachers2 = await storage.getAllTeachers();
      res.json(teachers2);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });
  app2.get("/api/teachers/:id", async (req, res) => {
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
  app2.post("/api/teachers", async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(validatedData);
      res.status(201).json(teacher);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating teacher:", error);
      res.status(500).json({ error: "Failed to create teacher" });
    }
  });
  app2.patch("/api/teachers/:id", async (req, res) => {
    try {
      const updates = insertTeacherSchema.partial().parse(req.body);
      const teacher = await storage.updateTeacher(req.params.id, updates);
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating teacher:", error);
      res.status(500).json({ error: "Failed to update teacher" });
    }
  });
  app2.delete("/api/teachers/:id", async (req, res) => {
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
  app2.get("/api/schedule-slots", async (req, res) => {
    try {
      const slots = await storage.getAllScheduleSlots();
      res.json(slots);
    } catch (error) {
      console.error("Error fetching schedule slots:", error);
      res.status(500).json({ error: "Failed to fetch schedule slots" });
    }
  });
  app2.get("/api/teachers/:teacherId/schedule-slots", async (req, res) => {
    try {
      const slots = await storage.getTeacherScheduleSlots(req.params.teacherId);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching teacher schedule slots:", error);
      res.status(500).json({ error: "Failed to fetch teacher schedule slots" });
    }
  });
  app2.post("/api/schedule-slots", async (req, res) => {
    try {
      const validatedData = insertScheduleSlotSchema.parse(req.body);
      const slot = await storage.createScheduleSlot(validatedData);
      res.status(201).json(slot);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating schedule slot:", error);
      res.status(500).json({ error: "Failed to create schedule slot" });
    }
  });
  app2.patch("/api/schedule-slots/:id", async (req, res) => {
    try {
      const updates = insertScheduleSlotSchema.partial().parse(req.body);
      const slot = await storage.updateScheduleSlot(req.params.id, updates);
      if (!slot) {
        return res.status(404).json({ error: "Schedule slot not found" });
      }
      res.json(slot);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating schedule slot:", error);
      res.status(500).json({ error: "Failed to update schedule slot" });
    }
  });
  app2.delete("/api/schedule-slots/:id", async (req, res) => {
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
  app2.post("/api/teachers/:teacherId/schedule-slots/batch", async (req, res) => {
    try {
      const { slots } = req.body;
      if (!Array.isArray(slots)) {
        return res.status(400).json({ error: "Slots must be an array" });
      }
      const allSlots = await storage.getAllScheduleSlots();
      const allTeachers = await storage.getAllTeachers();
      const teacherMap = new Map(allTeachers.map((t) => [t.id, t]));
      for (const slotData of slots) {
        const conflictingSlot = allSlots.find(
          (existingSlot) => existingSlot.teacherId !== req.params.teacherId && existingSlot.day === slotData.day && existingSlot.period === slotData.period && existingSlot.grade === slotData.grade && existingSlot.section === slotData.section
        );
        if (conflictingSlot) {
          const conflictingTeacher = teacherMap.get(conflictingSlot.teacherId);
          return res.status(409).json({
            error: "conflict",
            message: `\u064A\u0648\u062C\u062F \u062A\u0639\u0627\u0631\u0636: \u0627\u0644\u0623\u0633\u062A\u0627\u0630 ${conflictingTeacher?.name || "\u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641"} (${conflictingTeacher?.subject || "\u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641"}) \u0644\u062F\u064A\u0647 \u062D\u0635\u0629 \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u0648\u0642\u062A \u0644\u0644\u0635\u0641 ${slotData.grade}/${slotData.section} \u064A\u0648\u0645 ${slotData.day} \u0627\u0644\u062D\u0635\u0629 ${slotData.period}`,
            conflictingTeacher: {
              name: conflictingTeacher?.name,
              subject: conflictingTeacher?.subject
            },
            slot: {
              day: slotData.day,
              period: slotData.period,
              grade: slotData.grade,
              section: slotData.section
            }
          });
        }
      }
      await storage.deleteTeacherScheduleSlots(req.params.teacherId);
      const createdSlots = [];
      for (const slotData of slots) {
        const validatedData = insertScheduleSlotSchema.parse({
          ...slotData,
          teacherId: req.params.teacherId
        });
        const slot = await storage.createScheduleSlot(validatedData);
        createdSlots.push(slot);
      }
      res.status(201).json(createdSlots);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error batch creating schedule slots:", error);
      res.status(500).json({ error: "Failed to batch create schedule slots" });
    }
  });
  app2.get("/api/class-schedules/:grade/:section", async (req, res) => {
    try {
      const grade = parseInt(req.params.grade);
      const section = parseInt(req.params.section);
      if (isNaN(grade) || isNaN(section)) {
        return res.status(400).json({ error: "Invalid grade or section" });
      }
      const allSlots = await storage.getAllScheduleSlots();
      const allTeachers = await storage.getAllTeachers();
      const classSlots = allSlots.filter(
        (slot) => slot.grade === grade && slot.section === section
      );
      const teacherMap = new Map(allTeachers.map((t) => [t.id, t]));
      const schedule = classSlots.map((slot) => {
        const teacher = teacherMap.get(slot.teacherId);
        return {
          day: slot.day,
          period: slot.period,
          subject: teacher?.subject || "Unknown",
          teacherName: teacher?.name || "Unknown"
        };
      });
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching class schedule:", error);
      res.status(500).json({ error: "Failed to fetch class schedule" });
    }
  });
  app2.post("/api/class-schedules/:grade/:section", async (req, res) => {
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
      const allSlots = await storage.getAllScheduleSlots();
      const existingSlots = allSlots.filter(
        (slot) => slot.grade === grade && slot.section === section
      );
      for (const slot of existingSlots) {
        await storage.deleteScheduleSlot(slot.id);
      }
      const createdSlots = [];
      for (const slotData of slots) {
        const validatedData = insertScheduleSlotSchema.parse({
          ...slotData,
          grade,
          section
        });
        const slot = await storage.createScheduleSlot(validatedData);
        createdSlots.push(slot);
      }
      res.status(201).json(createdSlots);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error saving class schedule:", error);
      res.status(500).json({ error: "Failed to save class schedule" });
    }
  });
  app2.get("/api/grade-sections", async (req, res) => {
    try {
      const sectionsMap = await storage.getAllGradeSections();
      const sections = {};
      sectionsMap.forEach((value, key) => {
        sections[key.toString()] = value;
      });
      res.json(sections);
    } catch (error) {
      console.error("Error fetching grade sections:", error);
      res.status(500).json({ error: "Failed to fetch grade sections" });
    }
  });
  app2.get("/api/grade-sections/:grade", async (req, res) => {
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
  app2.put("/api/grade-sections/:grade", async (req, res) => {
    try {
      const grade = parseInt(req.params.grade);
      const { sections } = req.body;
      if (isNaN(grade)) {
        return res.status(400).json({ error: "Invalid grade" });
      }
      if (!Array.isArray(sections) || !sections.every((s) => typeof s === "number")) {
        return res.status(400).json({ error: "Sections must be an array of numbers" });
      }
      await storage.setGradeSections(grade, sections);
      res.json({ grade, sections });
    } catch (error) {
      console.error("Error updating grade sections:", error);
      res.status(500).json({ error: "Failed to update grade sections" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    hmr: {
      clientPort: 443
    },
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`\u2713 Server is running on http://0.0.0.0:${port}`);
    log(`\u2713 Press Ctrl+C to stop`);
  });
})();

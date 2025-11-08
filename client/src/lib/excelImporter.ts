import ExcelJS from "exceljs";
import type { Teacher, ScheduleSlot, Day, Period, Subject, Grade } from "@shared/schema";
import { DAYS, PERIODS, SUBJECTS } from "@shared/schema";
import { nanoid } from "nanoid";

export interface ImportedData {
  teachers: Teacher[];
  slots: ScheduleSlot[];
  conflicts: ConflictInfo[];
}

export interface ConflictInfo {
  type: "duplicate" | "overlap";
  message: string;
  details: {
    day?: Day;
    period?: Period;
    grade?: number;
    section?: number;
    teachers?: string[];
  };
}

export async function importMasterScheduleExcel(
  file: File
): Promise<ImportedData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("الملف لا يحتوي على أي ورقة عمل");
  }

  const teachersMap = new Map<string, Teacher>();
  const slotsArray: ScheduleSlot[] = [];
  const conflicts: ConflictInfo[] = [];

  const startRow = 5;
  const endRow = worksheet.rowCount;

  for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
    const row = worksheet.getRow(rowNum);
    
    const teacherNameCell = row.getCell(40);
    const subjectCell = row.getCell(39);
    
    const teacherName = teacherNameCell.value?.toString().trim();
    const subjectName = subjectCell.value?.toString().trim();
    
    if (!teacherName || !subjectName) {
      continue;
    }

    const subject = SUBJECTS.find(s => s === subjectName) || "عربي" as Subject;
    
    const teacherId = nanoid();
    const teacher: Teacher = {
      id: teacherId,
      name: teacherName,
      subject: subject,
    };
    
    teachersMap.set(teacherName, teacher);

    let colOffset = 3;
    [...DAYS].reverse().forEach((day) => {
      [...PERIODS].reverse().forEach((period) => {
        const cell = row.getCell(colOffset);
        const cellValue = cell.value?.toString().trim();
        
        if (cellValue && cellValue.includes('/')) {
          const parts = cellValue.split('/');
          if (parts.length === 2) {
            const grade = parseInt(parts[0], 10);
            const section = parseInt(parts[1], 10);
            
            if (!isNaN(grade) && !isNaN(section) && grade >= 10 && grade <= 12) {
              const slot: ScheduleSlot = {
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
        colOffset++;
      });
    });
  }

  const slotKeys = new Set<string>();
  slotsArray.forEach((slot) => {
    const key = `${slot.day}-${slot.period}-${slot.grade}-${slot.section}`;
    if (slotKeys.has(key)) {
      conflicts.push({
        type: "overlap",
        message: `تعارض في الحصة: ${slot.day} - الحصة ${slot.period} - الصف ${slot.grade}/${slot.section}`,
        details: {
          day: slot.day,
          period: slot.period,
          grade: slot.grade,
          section: slot.section,
        },
      });
    }
    slotKeys.add(key);
  });

  return {
    teachers: Array.from(teachersMap.values()),
    slots: slotsArray,
    conflicts,
  };
}

export async function exportToExcelWithMergedCells(
  teachers: Teacher[],
  allSlots: ScheduleSlot[],
  type: "teachers" | "classes"
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();

  if (type === "teachers") {
    for (const teacher of teachers) {
      const worksheet = workbook.addWorksheet(teacher.name.substring(0, 30));
      
      worksheet.getCell('D1').value = `جدول المعلم: ${teacher.name}`;
      worksheet.getCell('D1').font = { bold: true, size: 14 };
      
      worksheet.getCell('B3').value = 'الأيام/الحصص';
      const periodsHeader = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة'];
      periodsHeader.forEach((period, idx) => {
        worksheet.getCell(3, 3 + idx).value = period;
      });

      DAYS.forEach((day, dayIdx) => {
        worksheet.getCell(4 + dayIdx, 2).value = day;
        
        const teacherSlots = allSlots.filter(
          s => s.teacherId === teacher.id && s.day === day
        ).sort((a, b) => a.period - b.period);

        let lastPeriod = 0;
        let mergeStart: number | null = null;
        let mergeValue = '';

        for (let period = 1; period <= 7; period++) {
          const slot = teacherSlots.find(s => s.period === period);
          const colIdx = 2 + period;
          
          if (slot) {
            const value = `${slot.grade}/${slot.section}`;
            
            if (mergeStart !== null && mergeValue === value && period === lastPeriod + 1) {
              lastPeriod = period;
            } else {
              if (mergeStart !== null && lastPeriod > mergeStart) {
                worksheet.mergeCells(4 + dayIdx, 2 + mergeStart, 4 + dayIdx, 2 + lastPeriod);
                worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
                worksheet.getCell(4 + dayIdx, 2 + mergeStart).alignment = { horizontal: 'center', vertical: 'middle' };
              } else if (mergeStart !== null) {
                worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
              }
              
              mergeStart = period;
              mergeValue = value;
              lastPeriod = period;
            }
          } else {
            if (mergeStart !== null && lastPeriod > mergeStart) {
              worksheet.mergeCells(4 + dayIdx, 2 + mergeStart, 4 + dayIdx, 2 + lastPeriod);
              worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
              worksheet.getCell(4 + dayIdx, 2 + mergeStart).alignment = { horizontal: 'center', vertical: 'middle' };
            } else if (mergeStart !== null) {
              worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
            }
            
            mergeStart = null;
            mergeValue = '';
            lastPeriod = 0;
          }
        }

        if (mergeStart !== null && lastPeriod > mergeStart) {
          worksheet.mergeCells(4 + dayIdx, 2 + mergeStart, 4 + dayIdx, 2 + lastPeriod);
          worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
          worksheet.getCell(4 + dayIdx, 2 + mergeStart).alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (mergeStart !== null) {
          worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
        }
      });

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
    }
  } else {
    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    
    for (let grade = 10; grade <= 12; grade++) {
      const sectionsSet = new Set(
        allSlots.filter(s => s.grade === grade).map(s => s.section)
      );
      const sections = Array.from(sectionsSet).sort((a, b) => a - b);

      for (const section of sections) {
        const worksheet = workbook.addWorksheet(`${grade}/${section}`);
        
        worksheet.getCell('D1').value = `جدول الصف: ${grade}/${section}`;
        worksheet.getCell('D1').font = { bold: true, size: 14 };
        
        worksheet.getCell('B3').value = 'الأيام/الحصص';
        const periodsHeader = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة'];
        periodsHeader.forEach((period, idx) => {
          worksheet.getCell(3, 3 + idx).value = period;
        });

        DAYS.forEach((day, dayIdx) => {
          worksheet.getCell(4 + dayIdx, 2).value = day;
          
          const classSlots = allSlots.filter(
            s => s.grade === grade && s.section === section && s.day === day
          ).sort((a, b) => a.period - b.period);

          let lastPeriod = 0;
          let mergeStart: number | null = null;
          let mergeValue = '';

          for (let period = 1; period <= 7; period++) {
            const slot = classSlots.find(s => s.period === period);
            
            if (slot) {
              const teacher = teacherMap.get(slot.teacherId);
              const value = teacher?.subject || 'عربي';
              
              if (mergeStart !== null && mergeValue === value && period === lastPeriod + 1) {
                lastPeriod = period;
              } else {
                if (mergeStart !== null && lastPeriod > mergeStart) {
                  worksheet.mergeCells(4 + dayIdx, 2 + mergeStart, 4 + dayIdx, 2 + lastPeriod);
                  worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
                  worksheet.getCell(4 + dayIdx, 2 + mergeStart).alignment = { horizontal: 'center', vertical: 'middle' };
                } else if (mergeStart !== null) {
                  worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
                }
                
                mergeStart = period;
                mergeValue = value;
                lastPeriod = period;
              }
            } else {
              if (mergeStart !== null && lastPeriod > mergeStart) {
                worksheet.mergeCells(4 + dayIdx, 2 + mergeStart, 4 + dayIdx, 2 + lastPeriod);
                worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
                worksheet.getCell(4 + dayIdx, 2 + mergeStart).alignment = { horizontal: 'center', vertical: 'middle' };
              } else if (mergeStart !== null) {
                worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
              }
              
              mergeStart = null;
              mergeValue = '';
              lastPeriod = 0;
            }
          }

          if (mergeStart !== null && lastPeriod > mergeStart) {
            worksheet.mergeCells(4 + dayIdx, 2 + mergeStart, 4 + dayIdx, 2 + lastPeriod);
            worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
            worksheet.getCell(4 + dayIdx, 2 + mergeStart).alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (mergeStart !== null) {
            worksheet.getCell(4 + dayIdx, 2 + mergeStart).value = mergeValue;
          }
        });

        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

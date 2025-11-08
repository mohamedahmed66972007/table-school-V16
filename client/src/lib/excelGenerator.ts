import ExcelJS from "exceljs";
import type { Teacher, ScheduleSlot } from "@shared/schema";
import type { ScheduleSlotData } from "@/types/schedule";
import type { ClassScheduleSlot } from "@/components/ClassScheduleTable";
import { DAYS, PERIODS } from "@shared/schema";

// =====================================================
// ================ الجدول الرئيسي ======================
// =====================================================
export async function exportMasterScheduleExcel(
  teachers: Teacher[],
  slots: ScheduleSlot[]
) {
  try {
    const response = await fetch('/جدول_رئيسي_template.xlsx');
    if (!response.ok) {
      throw new Error('Failed to load template');
    }
    const arrayBuffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error('Template worksheet not found');
    }

    const headerRow = worksheet.getRow(4);
    const dayHeaders: string[] = [];
    [...DAYS].reverse().forEach((day) => {
      PERIODS.forEach((period) => {
        dayHeaders.push(`${day} ${period}`);
      });
    });
    headerRow.push(...dayHeaders);
    headerRow.push("مجموع الحصص");
    headerRow.push("10", "11", "12");

    worksheet.addRow(headerRow);

    teachers.forEach((teacher, index) => {
      const rowNum = index + 5;

      let colOffset = 3;
      [...DAYS].reverse().forEach((day) => {
        [...PERIODS].reverse().forEach((period) => {
          const slot = slots.find(
            (s) => s.teacherId === teacher.id && s.day === day && s.period === period
          );

          if (slot) {
            const cell = worksheet.getRow(rowNum).getCell(colOffset);
            cell.value = `${slot.grade}/${slot.section}`;
          }
          colOffset++;
        });
      });

      const row: any[] = [teacher.name, teacher.subject];

      [...DAYS].reverse().forEach((day) => {
        PERIODS.forEach((period) => {
          const slot = slots.find(
            (s) =>
              s.teacherId === teacher.id &&
              s.day === day &&
              s.period === period
          );
          row.push(slot ? `${slot.grade}/${slot.section}` : "");
        });
      });

      // Add teacher weekly hours
      const teacherSlots = slots.filter((s) => s.teacherId === teacher.id);
      row.push(teacherSlots.length);

      // Add subject count per grade
      const gradesCount = { 10: 0, 11: 0, 12: 0 };
      teacherSlots.forEach((slot) => {
        if (slot.grade in gradesCount) {
          gradesCount[slot.grade as 10 | 11 | 12]++;
        }
      });
      row.push(gradesCount[10], gradesCount[11], gradesCount[12]);

      worksheet.addRow(row);
    });


    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'الجدول_الرئيسي.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting master schedule:', error);
    throw error;
  }
}

// =====================================================
// ================ جدول معلم واحد ======================
// =====================================================
export async function exportTeacherScheduleExcel(
  teacher: Teacher,
  slots: ScheduleSlotData[]
) {
  try {
    const response = await fetch('/جداول_template_new.xlsx');
    if (!response.ok) {
      throw new Error('Failed to load template');
    }
    const arrayBuffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error('Template worksheet not found');
    }

    // Set page setup to landscape orientation
    worksheet.pageSetup = {
      ...worksheet.pageSetup,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    // Set all column widths to 11.11
    if (worksheet.columns) {
      worksheet.columns.forEach((col: any) => {
        col.width = 11.11;
      });
    }

    const titleCell = worksheet.getRow(1).getCell(4);
    titleCell.value = `جدول المعلم: ${teacher.name}`;

    DAYS.forEach((day, dayIdx) => {
      const rowNum = dayIdx + 4;
      const periodValues: string[] = [];

      [...PERIODS].forEach((period) => {
        const slot = slots.find((s) => s.day === day && s.period === period);
        periodValues.push(slot ? `${slot.grade}/${slot.section}` : '');
      });

      [...PERIODS].forEach((period, periodIdx) => {
        const colIdx = periodIdx + 3;
        const currentValue = periodValues[periodIdx];

        if (currentValue) {
          const cell = worksheet.getRow(rowNum).getCell(colIdx);
          cell.value = currentValue;
        }
      });

      const mergesToAdd: { start: number; end: number; value: string }[] = [];
      let mergeStart = -1;
      let currentMergeValue = '';

      for (let i = 0; i < periodValues.length; i++) {
        const value = periodValues[i];
        if (value && value === currentMergeValue && mergeStart !== -1) continue;
        if (mergeStart !== -1 && i - mergeStart > 1) {
          mergesToAdd.push({ start: mergeStart, end: i - 1, value: currentMergeValue });
        }
        if (value) {
          mergeStart = i;
          currentMergeValue = value;
        } else {
          mergeStart = -1;
          currentMergeValue = '';
        }
      }

      if (mergeStart !== -1 && periodValues.length - mergeStart > 1) {
        mergesToAdd.push({ start: mergeStart, end: periodValues.length - 1, value: currentMergeValue });
      }

      mergesToAdd.forEach(merge => {
        const startCol = merge.start + 3;
        const endCol = merge.end + 3;
        worksheet.mergeCells(rowNum, startCol, rowNum, endCol);
        const mergedCell = worksheet.getRow(rowNum).getCell(startCol);
        mergedCell.value = merge.value;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `جدول_${teacher.name}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting teacher schedule:', error);
    throw error;
  }
}

// =====================================================
// ================ تصدير جميع المعلمين =================
// =====================================================
export async function exportAllTeachersExcel(
  teachers: Teacher[],
  allSlots: ScheduleSlot[]
) {
  try {
    const response = await fetch('/جداول_template_new.xlsx');
    if (!response.ok) {
      console.error('Template fetch failed:', response.status, response.statusText);
      throw new Error('Failed to load template');
    }
    const arrayBuffer = await response.arrayBuffer();

    const finalWorkbook = new ExcelJS.Workbook();

    for (const teacher of teachers) {
      // Load fresh template for each teacher
      const templateWorkbook = new ExcelJS.Workbook();
      await templateWorkbook.xlsx.load(arrayBuffer);
      const baseTemplate = templateWorkbook.getWorksheet(1);
      if (!baseTemplate) throw new Error('Template worksheet not found');

      const sheet = finalWorkbook.addWorksheet(teacher.name.substring(0, 30), {
        views: [{ rightToLeft: true }]
      });

      sheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      };


      // Copy complete model including columns, rows, merges
      if (baseTemplate.model) {
        // Copy column definitions with widths (force all to 16)
        if (baseTemplate.model.cols) {
          sheet.columns = baseTemplate.model.cols.map(() => ({
            width: 16
          }));
        }

        // Copy all rows with complete styling (exact copy from template)
        baseTemplate.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          const newRow = sheet.getRow(rowNumber);
          if (row.height) {
            newRow.height = row.height;
          }

          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const newCell = newRow.getCell(colNumber);

            // Copy value (but skip if it's the title row and column 4, we'll update it later)
            if (rowNumber !== 1 || colNumber !== 4) {
              newCell.value = cell.value;
            }

            // Copy complete style
            if (cell.style) {
              newCell.style = {
                ...cell.style,
                font: cell.font ? { ...cell.font } : undefined,
                alignment: cell.alignment ? { ...cell.alignment } : undefined,
                border: cell.border ? { ...cell.border } : undefined,
                fill: cell.fill ? { ...cell.fill } : undefined,
                numFmt: cell.numFmt
              };
            }
          });
        });

        baseTemplate.columns.forEach((col, idx) => {
          if (col && col.width) {
            sheet.getColumn(idx + 1).width = col.width;
          }
        });


        // Copy merged cells from template
        if (baseTemplate.model.merges) {
          baseTemplate.model.merges.forEach((merge: string) => {
            try {
              sheet.mergeCells(merge);
            } catch (e) {
              // Ignore merge errors for cells we'll merge later
            }
          });
        }
      }

      // Now update the title
      const titleCell = sheet.getRow(1).getCell(4);
      titleCell.value = `جدول المعلم: ${teacher.name}`;

      const teacherSlots = allSlots.filter(s => s.teacherId === teacher.id);

      // Fill in the schedule data
      DAYS.forEach((day, dayIdx) => {
        const rowNum = dayIdx + 4;
        const periodValues: string[] = [];

        [...PERIODS].forEach((period) => {
          const slot = teacherSlots.find((s) => s.day === day && s.period === period);
          periodValues.push(slot ? `${slot.grade}/${slot.section}` : '');
        });

        // Fill in period values
        periodValues.forEach((value, idx) => {
          const cell = sheet.getRow(rowNum).getCell(idx + 3);
          cell.value = value;
        });

        // Handle merging consecutive same values
        let mergeStart = -1;
        let currentValue = '';

        for (let i = 0; i < periodValues.length; i++) {
          const value = periodValues[i];

          if (value && value === currentValue && mergeStart !== -1) {
            continue;
          }

          if (mergeStart !== -1 && i - mergeStart > 1) {
            const startCol = mergeStart + 3;
            const endCol = i - 1 + 3;
            try {
              sheet.mergeCells(rowNum, startCol, rowNum, endCol);
              const mergedCell = sheet.getRow(rowNum).getCell(startCol);
              mergedCell.value = currentValue;
            } catch (e) {
              // Already merged or error
            }
          }

          if (value) {
            mergeStart = i;
            currentValue = value;
          } else {
            mergeStart = -1;
            currentValue = '';
          }
        }

        if (mergeStart !== -1 && periodValues.length - mergeStart > 1) {
          const startCol = mergeStart + 3;
          const endCol = periodValues.length - 1 + 3;
          try {
            sheet.mergeCells(rowNum, startCol, rowNum, endCol);
            const mergedCell = sheet.getRow(rowNum).getCell(startCol);
            mergedCell.value = currentValue;
          } catch (e) {
            // Already merged or error
          }
        }
      });
    }

    const buffer = await finalWorkbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'جداول_جميع_المعلمين.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting all teachers schedules:', error);
    throw error;
  }
}

// =====================================================
// ================ جدول صف واحد =======================
// =====================================================
export async function exportClassScheduleExcel(
  grade: number,
  section: number,
  slots: ClassScheduleSlot[]
) {
  try {
    const response = await fetch('/جداول_template_new.xlsx');
    if (!response.ok) {
      throw new Error('Failed to load template');
    }
    const arrayBuffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error('Template worksheet not found');
    }

    // Set page setup to landscape orientation
    worksheet.pageSetup = {
      ...worksheet.pageSetup,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    // Set all column widths to 11.11
    if (worksheet.columns) {
      worksheet.columns.forEach((col: any) => {
        col.width = 11.11;
      });
    }

    const titleCell = worksheet.getRow(1).getCell(4);
    titleCell.value = `جدول الصف: ${grade}/${section}`;

    DAYS.forEach((day, dayIdx) => {
      const rowNum = dayIdx + 4;
      const periodValues: string[] = [];

      [...PERIODS].forEach((period) => {
        const slot = slots.find((s) => s.day === day && s.period === period);
        periodValues.push(slot ? slot.subject : '');
      });

      periodValues.forEach((value, idx) => {
        if (value) {
          const cell = worksheet.getRow(rowNum).getCell(idx + 3);
          cell.value = value;
        }
      });

      const mergesToAdd: { start: number; end: number; value: string }[] = [];
      let mergeStart = -1;
      let currentMergeValue = '';

      for (let i = 0; i < periodValues.length; i++) {
        const value = periodValues[i];
        if (value && value === currentMergeValue && mergeStart !== -1) continue;
        if (mergeStart !== -1 && i - mergeStart > 1) {
          mergesToAdd.push({ start: mergeStart, end: i - 1, value: currentMergeValue });
        }
        if (value) {
          mergeStart = i;
          currentMergeValue = value;
        } else {
          mergeStart = -1;
          currentMergeValue = '';
        }
      }

      if (mergeStart !== -1 && periodValues.length - mergeStart > 1) {
        mergesToAdd.push({ start: mergeStart, end: periodValues.length - 1, value: currentMergeValue });
      }

      mergesToAdd.forEach(merge => {
        const startCol = merge.start + 3;
        const endCol = merge.end + 3;
        worksheet.mergeCells(rowNum, startCol, rowNum, endCol);
        const mergedCell = worksheet.getRow(rowNum).getCell(startCol);
        mergedCell.value = merge.value;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `جدول_الصف_${grade}_${section}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting class schedule:', error);
    throw error;
  }
}

// =====================================================
// ================ تصدير جميع الصفوف ==================
// =====================================================
export async function exportAllClassesExcel(
  allSlots: ScheduleSlot[],
  allTeachers: Teacher[],
  gradeSections?: Record<string, number[]>
) {
  try {
    const response = await fetch('/جداول_template_new.xlsx');
    if (!response.ok) {
      console.error('Template fetch failed:', response.status, response.statusText);
      throw new Error('Failed to load template');
    }
    const arrayBuffer = await response.arrayBuffer();

    const finalWorkbook = new ExcelJS.Workbook();
    const teacherMap = new Map(allTeachers.map(t => [t.id, t]));

    for (let grade = 10; grade <= 12; grade++) {
      const sections = gradeSections?.[grade.toString()] || [1, 2, 3, 4, 5, 6, 7];

      for (const section of sections) {
        // Load fresh template for each class
        const templateWorkbook = new ExcelJS.Workbook();
        await templateWorkbook.xlsx.load(arrayBuffer);
        const baseTemplate = templateWorkbook.getWorksheet(1);
        if (!baseTemplate) throw new Error('Template worksheet not found');

        const sheet = finalWorkbook.addWorksheet(`${grade}-${section}`, {
          views: [{ rightToLeft: true }]
        });

        sheet.pageSetup = {
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0
        };


        // Copy complete model including columns, rows, merges
        if (baseTemplate.model) {
          // Copy column definitions with widths (force all to 16)
          if (baseTemplate.model.cols) {
            sheet.columns = baseTemplate.model.cols.map(() => ({
              width: 16
            }));
          }

          // Copy all rows with complete styling (exact copy from template)
          baseTemplate.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            const newRow = sheet.getRow(rowNumber);
            if (row.height) {
              newRow.height = row.height;
            }

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const newCell = newRow.getCell(colNumber);

              // Copy value (but skip if it's the title row and column 4, we'll update it later)
              if (rowNumber !== 1 || colNumber !== 4) {
                newCell.value = cell.value;
              }

              // Copy complete style
              if (cell.style) {
                newCell.style = {
                  ...cell.style,
                  font: cell.font ? { ...cell.font } : undefined,
                  alignment: cell.alignment ? { ...cell.alignment } : undefined,
                  border: cell.border ? { ...cell.border } : undefined,
                  fill: cell.fill ? { ...cell.fill } : undefined,
                  numFmt: cell.numFmt
                };
              }
            });
          });

          // بعد نسخ كل الخلايا من القالب
          baseTemplate.columns.forEach((col, idx) => {
            if (col && col.width) {
              sheet.getColumn(idx + 1).width = col.width;
            }
          });


          // Copy merged cells from template
          if (baseTemplate.model.merges) {
            baseTemplate.model.merges.forEach((merge: string) => {
              try {
                sheet.mergeCells(merge);
              } catch (e) {
                // Ignore merge errors for cells we'll merge later
              }
            });
          }
        }

        // Now update the title
        const titleCell = sheet.getRow(1).getCell(4);
        titleCell.value = `جدول الصف: ${grade}/${section}`;

        const classSlots = allSlots.filter(
          s => s.grade === grade && s.section === section
        );

        // Fill in the schedule data
        DAYS.forEach((day, dayIdx) => {
          const rowNum = dayIdx + 4;
          const periodValues: string[] = [];

          [...PERIODS].forEach(period => {
            const slot = classSlots.find((s) => s.day === day && s.period === period);
            if (slot) {
              const teacher = teacherMap.get(slot.teacherId);
              periodValues.push(teacher?.subject || '');
            } else {
              periodValues.push('');
            }
          });

          // Fill in period values
          periodValues.forEach((value, idx) => {
            const cell = sheet.getRow(rowNum).getCell(idx + 3);
            cell.value = value;
          });

          // Handle merging consecutive same values
          let mergeStart = -1;
          let currentValue = '';

          for (let i = 0; i < periodValues.length; i++) {
            const value = periodValues[i];

            if (value && value === currentValue && mergeStart !== -1) {
              continue;
            }

            if (mergeStart !== -1 && i - mergeStart > 1) {
              const startCol = mergeStart + 3;
              const endCol = i - 1 + 3;
              try {
                sheet.mergeCells(rowNum, startCol, rowNum, endCol);
                const mergedCell = sheet.getRow(rowNum).getCell(startCol);
                mergedCell.value = currentValue;
              } catch (e) {
                // Already merged or error
              }
            }

            if (value) {
              mergeStart = i;
              currentValue = value;
            } else {
              mergeStart = -1;
              currentValue = '';
            }
          }

          if (mergeStart !== -1 && periodValues.length - mergeStart > 1) {
            const startCol = mergeStart + 3;
            const endCol = periodValues.length - 1 + 3;
            try {
              sheet.mergeCells(rowNum, startCol, rowNum, endCol);
              const mergedCell = sheet.getRow(rowNum).getCell(startCol);
              mergedCell.value = currentValue;
            } catch (e) {
              // Already merged or error
            }
          }
        });
      }
    }

    const buffer = await finalWorkbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'جداول_جميع_الصفوف.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting all class schedules:', error);
    throw error;
  }
}
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Teacher, ScheduleSlot } from "@shared/schema";
import type { ScheduleSlotData } from "@/types/schedule";
import type { ClassScheduleSlot } from "@/components/ClassScheduleTable";
import { DAYS, PERIODS } from "@shared/schema";
import { loadArabicFont, loadMultipleFonts } from "./arabicFont";
import type { PDFCustomizationOptions } from "@/types/pdfCustomization";
import { DEFAULT_PDF_OPTIONS } from "@/types/pdfCustomization";

export async function exportTeacherSchedulePDF(
  teacher: Teacher,
  slots: ScheduleSlotData[],
  customOptions?: PDFCustomizationOptions
) {
  const options = { ...DEFAULT_PDF_OPTIONS, ...customOptions };
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const lalezar = await loadArabicFont(doc, "Lalezar");
  const cairoFont = await loadArabicFont(doc, "Cairo");

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont(lalezar);
  doc.setFontSize(22);
  doc.text(`جدول حصص المعلم: ${teacher.name}`, pageWidth / 2, 15, {
    align: "center",
  });

  doc.setFontSize(16);
  doc.text(`المادة: ${teacher.subject}`, pageWidth / 2, 25, {
    align: "center",
  });

  const headers = [...PERIODS.map((p) => `الحصة ${p}`).reverse(), "اليوم"];
  const body = DAYS.map((day) => {
    const row: string[] = [];
    [...PERIODS].reverse().forEach((period) => {
      const slot = slots.find((s) => s.day === day && s.period === period);
      row.push(slot ? `${slot.grade}/${slot.section}` : "-");
    });
    row.push(day);
    return row;
  });

  autoTable(doc, {
    head: [headers],
    body: body,
    startY: 35,
    styles: {
      font: cairoFont,
      fontSize: 14,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 5, right: 6, bottom: 5, left: 6 },
      textColor: [0, 0, 0],
      minCellHeight: 10,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "normal",
      fontSize: 16,
      font: lalezar,
      cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
      minCellHeight: 12,
      lineWidth: 0.2,
    },
    columnStyles: {
      7: { halign: "right", fontStyle: "normal", fontSize: 16, font: lalezar, textColor: [0, 0, 0], cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
    tableWidth: 'auto',
    theme: 'grid',
  });

  doc.setFont(cairoFont);
  doc.setFontSize(9);
  doc.text(
    `عدد الحصص: ${slots.length}`,
    pageWidth - 15,
    doc.internal.pageSize.getHeight() - 10,
    { align: "right" }
  );

  doc.save(`جدول_${teacher.name}.pdf`);
}

export async function exportClassSchedulePDF(
  grade: number,
  section: number,
  slots: ClassScheduleSlot[],
  showTeacherNames: boolean,
  customOptions?: PDFCustomizationOptions
) {
  const options = { ...DEFAULT_PDF_OPTIONS, ...customOptions };
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const marhey = await loadArabicFont(doc, "Marhey");
  const lalezar = await loadArabicFont(doc, "Lalezar");
  const cairoFont = await loadArabicFont(doc, "Cairo");

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont(marhey);
  doc.setFontSize(50);
  doc.text(`${grade}/${section}`, pageWidth / 2, 25, { align: "center" });

  const headers = [...PERIODS.map((p) => `الحصة ${p}`).reverse(), "اليوم"];
  const body = DAYS.map((day) => {
    const row: string[] = [];
    [...PERIODS].reverse().forEach((period) => {
      const slot = slots.find((s) => s.day === day && s.period === period);
      if (slot) {
        const cellContent = showTeacherNames
          ? `${slot.subject}\n(${slot.teacherName})`
          : slot.subject;
        row.push(cellContent);
      } else {
        row.push("-");
      }
    });
    row.push(day);
    return row;
  });

  autoTable(doc, {
    head: [headers],
    body: body,
    startY: 32,
    styles: {
      font: cairoFont,
      fontSize: 11,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      textColor: [0, 0, 0],
      minCellHeight: 7,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "normal",
      fontSize: 13,
      font: lalezar,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      minCellHeight: 8,
      lineWidth: 0.2,
    },
    columnStyles: {
      7: { font: lalezar, fontSize: 13, textColor: [0, 0, 0], halign: "center", cellWidth: 25 },
    },
    margin: { left: 10, right: 10, top: 5, bottom: 5 },
    tableWidth: 'auto',
    theme: 'grid',
  });

  doc.save(`جدول_صف_${grade}_${section}.pdf`);
}

export async function exportAllTeachersPDF(
  teachers: Teacher[],
  allSlots: ScheduleSlot[],
  customOptions?: PDFCustomizationOptions
) {
  const options = { ...DEFAULT_PDF_OPTIONS, ...customOptions };
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const lalezar = await loadArabicFont(doc, "Lalezar");
  const cairoFont = await loadArabicFont(doc, "Cairo");

  const pageWidth = doc.internal.pageSize.getWidth();
  let isFirstPage = true;

  teachers.forEach((teacher) => {
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    const teacherSlots: ScheduleSlotData[] = allSlots
      .filter((slot) => slot.teacherId === teacher.id)
      .map((slot) => ({
        day: slot.day,
        period: slot.period,
        grade: slot.grade,
        section: slot.section,
      }));

    doc.setFont(lalezar);
    doc.setFontSize(16);
    doc.text(
      `جدول حصص: ${teacher.name}`,
      pageWidth - 15,
      15,
      { align: "right" }
    );

    doc.setFontSize(11);
    doc.text(
      `المادة: ${teacher.subject}`,
      pageWidth - 15,
      23,
      { align: "right" }
    );

    const headers = [...PERIODS.map((p) => `الحصة ${p}`).reverse(), "اليوم"];
    const body = DAYS.map((day) => {
      const row: string[] = [];
      [...PERIODS].reverse().forEach((period) => {
        const slot = teacherSlots.find(
          (s) => s.day === day && s.period === period
        );
        row.push(slot ? `${slot.grade}/${slot.section}` : "-");
      });
      row.push(day);
      return row;
    });

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 30,
      styles: {
        font: cairoFont,
        fontSize: 14,
        halign: "center",
        valign: "middle",
        cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
        textColor: [0, 0, 0],
        minCellHeight: 9,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "normal",
        fontSize: 16,
        font: lalezar,
        cellPadding: { top: 5, right: 5, bottom: 5, left: 5 },
        minCellHeight: 11,
        lineWidth: 0.2,
      },
      columnStyles: {
        7: { halign: "right", fontStyle: "normal", fontSize: 16, font: lalezar, textColor: [0, 0, 0], cellWidth: 'auto' },
      },
      margin: { left: 12, right: 12 },
      tableWidth: 'auto',
      theme: 'grid',
    });

    doc.setFont(cairoFont);
    doc.setFontSize(8);
    doc.text(
      `عدد الحصص: ${teacherSlots.length}`,
      pageWidth - 15,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  });

  doc.save("جداول_جميع_المعلمين.pdf");
}

export async function exportAllClassesPDF(
  allSlots: ScheduleSlot[],
  allTeachers: Teacher[],
  showTeacherNames: boolean,
  customOptions?: PDFCustomizationOptions,
  gradeSections?: Record<string, number[]>
) {
  const options = { ...DEFAULT_PDF_OPTIONS, ...customOptions };
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const marhey = await loadArabicFont(doc, "Marhey");
  const lalezar = await loadArabicFont(doc, "Lalezar");
  const cairoFont = await loadArabicFont(doc, "Cairo");

  const pageWidth = doc.internal.pageSize.getWidth();
  const teacherMap = new Map(allTeachers.map((t) => [t.id, t]));
  let isFirstPage = true;

  for (let grade = 10; grade <= 12; grade++) {
    const sections = gradeSections?.[grade.toString()] || [1, 2, 3, 4, 5, 6, 7];
    for (const section of sections) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      const classSlots = allSlots.filter(
        (slot) => slot.grade === grade && slot.section === section
      );

      const schedule: ClassScheduleSlot[] = classSlots.map((slot) => {
        const teacher = teacherMap.get(slot.teacherId);
        return {
          day: slot.day,
          period: slot.period,
          subject: (teacher?.subject || "عربي") as any,
          teacherName: teacher?.name || "Unknown",
        };
      });

      doc.setFont(marhey);
      doc.setFontSize(50);
      doc.text(`${grade}/${section}`, pageWidth / 2, 25, { align: "center" });

      const headers = [...PERIODS.map((p) => `الحصة ${p}`).reverse(), "اليوم"];
      const body = DAYS.map((day) => {
        const row: string[] = [];
        [...PERIODS].reverse().forEach((period) => {
          const slot = schedule.find(
            (s) => s.day === day && s.period === period
          );
          if (slot) {
            const cellContent = showTeacherNames
              ? `${slot.subject}\n(${slot.teacherName})`
              : slot.subject;
            row.push(cellContent);
          } else {
            row.push("-");
          }
        });
        row.push(day);
        return row;
      });

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 32,
        styles: {
          font: cairoFont,
          fontSize: 11,
          halign: "center",
          valign: "middle",
          cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
          textColor: [0, 0, 0],
          minCellHeight: 7,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "normal",
          fontSize: 13,
          font: lalezar,
          cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
          minCellHeight: 8,
          lineWidth: 0.2,
        },
        columnStyles: {
          7: { font: lalezar, fontSize: 13, textColor: [0, 0, 0], halign: "center", cellWidth: 25 },
        },
        margin: { left: 12, right: 12, top: 5, bottom: 5 },
        tableWidth: 'auto',
        theme: 'grid',
      });
    }
  }

  doc.save("جداول_جميع_الصفوف.pdf");
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
}

function getTextColorForBackground(bgColor: [number, number, number]): [number, number, number] {
  const brightness = (bgColor[0] * 299 + bgColor[1] * 587 + bgColor[2] * 114) / 1000;
  return brightness > 128 ? [0, 0, 0] : [255, 255, 255];
}

function getCurrentAcademicYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (currentMonth >= 7) {
    return `${currentYear}/${currentYear + 1}`;
  } else {
    return `${currentYear - 1}/${currentYear}`;
  }
}

function formatDate(): string {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

function getDayNameWithElongation(day: string): string {
  const dayMap: Record<string, string> = {
    "الأحد": "الأحــــــــــــد",
    "الاثنين": "الأثنيــــــــــــن",
    "الثلاثاء": "الثلاثــــــــــــاء",
    "الأربعاء": "الأربعــــــــــــاء",
    "الخميس": "الخميــــــــــــس"
  };
  return dayMap[day] || day;
}

export async function exportMasterSchedulePDF(
  teachers: Teacher[],
  allSlots: ScheduleSlot[],
  teacherNotes: Record<string, string>,
  customOptions?: PDFCustomizationOptions
) {
  const options = { ...DEFAULT_PDF_OPTIONS, ...customOptions };
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3",
  });

  const cairoFont = await loadArabicFont(doc, "Cairo");
  const cairoExtraBold = await loadArabicFont(doc, "Cairo-ExtraBold");
  const elMessiri = await loadArabicFont(doc, "Cairo");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont(cairoFont);
  doc.setFontSize(12);
  doc.text("الأدارة العامة لمدارس النجاة", pageWidth - 10, 10, { align: "right" });
  doc.text("مدرسة السالمية بنين الثانوية", pageWidth - 10, 16, { align: "right" });

  doc.setFont(cairoFont);
  doc.setFontSize(11);
  const academicYear = getCurrentAcademicYear();
  doc.text(`العام الدراسي ${academicYear}`, 10, 10, { align: "left" });
  doc.setFontSize(9);
  const currentDate = formatDate();
  doc.text(`تاريخ الجدول: ${currentDate}`, 10, 16, { align: "left" });

  const headers: string[] = [];
  
  headers.push("ملاحظات");
  
  [...DAYS].reverse().forEach((day) => {
    [...PERIODS].reverse().forEach((period) => {
      headers.push(`${period}`);
    });
  });
  
  headers.push("عدد\nالحصص");
  headers.push("المادة");
  headers.push("اسم المعلم");
  headers.push("م");

  const body: string[][] = [];
  
  teachers.forEach((teacher, index) => {
    const row: string[] = [];
    
    row.push(teacherNotes[teacher.id] || "");
    
    [...DAYS].reverse().forEach((day) => {
      [...PERIODS].reverse().forEach((period) => {
        const slot = allSlots.find(
          (s) => s.teacherId === teacher.id && s.day === day && s.period === period
        );
        row.push(slot ? `${slot.grade}/${slot.section}` : "");
      });
    });
    
    const teacherSlotsCount = allSlots.filter(s => s.teacherId === teacher.id).length;
    row.push(teacherSlotsCount.toString());
    
    row.push(teacher.subject);
    row.push(teacher.name);
    row.push((index + 1).toString());
    
    body.push(row);
  });

  const dayHeaders: string[] = [];
  dayHeaders.push("");
  [...DAYS].reverse().forEach((day) => {
    dayHeaders.push(getDayNameWithElongation(day));
    for (let i = 0; i < PERIODS.length - 1; i++) {
      dayHeaders.push("");
    }
  });
  dayHeaders.push("");
  dayHeaders.push("");
  dayHeaders.push("");
  dayHeaders.push("");

  const cellHighlightMap = new Map<string, string>();
  const teacherNameHighlightMap = new Map<string, string>();
  const notesHighlightMap = new Map<string, string>();
  
  if (options.cellHighlights) {
    options.cellHighlights.forEach(highlight => {
      if (highlight.cellType === 'teacherName') {
        teacherNameHighlightMap.set(highlight.teacherId, highlight.color);
      } else if (highlight.cellType === 'notes') {
        notesHighlightMap.set(highlight.teacherId, highlight.color);
      } else if (highlight.day && highlight.period !== undefined) {
        const key = `${highlight.teacherId}-${highlight.day}-${highlight.period}`;
        cellHighlightMap.set(key, highlight.color);
      }
    });
  }

  const totalTableWidth = 20 + (35 * 7) + 8 + 14 + 28 + 6;
  const pageWidthMM = doc.internal.pageSize.getWidth();
  const leftMargin = (pageWidthMM - totalTableWidth) / 2;

  autoTable(doc, {
    head: [dayHeaders, headers],
    body: body,
    startY: 22,
    styles: {
      font: cairoFont,
      fontSize: 6,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 1.2, right: 0.3, bottom: 1.2, left: 0.3 },
      textColor: [0, 0, 0],
      minCellHeight: 6.5,
      lineWidth: 0.5,
      overflow: 'linebreak',
      fillColor: [255, 255, 255],
      fontStyle: "normal",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "normal",
      fontSize: 6,
      font: cairoFont,
      cellPadding: { top: 1, right: 0.3, bottom: 1, left: 0.3 },
      minCellHeight: 5,
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "right", font: cairoFont, fontSize: 5, fontStyle: "normal" },
      ...Object.fromEntries(
        Array.from({ length: 35 }, (_, i) => [
          i + 1,
          { cellWidth: 7, halign: "center", fontSize: 6, font: cairoFont, fontStyle: "normal" },
        ])
      ),
      36: { cellWidth: 8, halign: "center", font: cairoFont, fontSize: 7, fontStyle: "normal" },
      37: { cellWidth: 14, halign: "center", font: cairoFont, fontStyle: "normal" },
      38: { cellWidth: 28, halign: "right", font: cairoFont, fontSize: 7, fontStyle: "normal" },
      39: { cellWidth: 6, halign: "center", font: cairoFont, fontSize: 7, fontStyle: "normal" },
    },
    margin: { top: 8, right: leftMargin, bottom: 8, left: leftMargin },
    tableWidth: totalTableWidth,
    theme: 'grid',
    didDrawCell: function(data) {
      const doc = data.doc;
      const cell = data.cell;
      const col = data.column.index;
      const rowIndex = data.row.index;

      if (data.section === 'head' && data.row.index === 0) {
        if (col >= 1 && col <= 35) {
          const dayIndex = Math.floor((col - 1) / 7);
          const periodIndex = (col - 1) % 7;
          
          if (periodIndex === 0) {
            doc.setFillColor(255, 255, 255);
            doc.rect(cell.x, cell.y, 7 * 7, cell.height, 'F');
            doc.setFont(cairoFont);
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            doc.text(cell.text[0], cell.x + (7 * 7) / 2, cell.y + cell.height / 2, {
              align: 'center',
              baseline: 'middle'
            });
          }
        }
      }
      
      if (data.section === 'head' && data.row.index === 1) {
        if (col >= 1 && col <= 35) {
          doc.setFillColor(245, 245, 220);
          doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
          doc.setFont(cairoExtraBold);
          doc.setFontSize(7);
          doc.setTextColor(255, 0, 0);
          doc.text(cell.text[0], cell.x + cell.width / 2, cell.y + cell.height / 2, {
            align: 'center',
            baseline: 'middle'
          });
        }
      }
      
      if (data.section === 'body') {
        const teacher = teachers[rowIndex];
        if (teacher) {
          // Handle schedule cell highlights (columns 1-35)
          if (col >= 1 && col <= 35) {
            const dayIndex = Math.floor((col - 1) / 7);
            const periodIndex = (col - 1) % 7;
            const period = 7 - periodIndex;
            const daysReversed = [...DAYS].reverse();
            const day = daysReversed[dayIndex];
            
            const highlightKey = `${teacher.id}-${day}-${period}`;
            const highlightColor = cellHighlightMap.get(highlightKey);
            
            if (highlightColor) {
              const rgb = hexToRgb(highlightColor);
              doc.setFillColor(rgb[0], rgb[1], rgb[2]);
              doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
              
              const textColor = getTextColorForBackground(rgb);
              doc.setTextColor(textColor[0], textColor[1], textColor[2]);
              doc.setFont(cairoFont);
              doc.setFontSize(6);
              if (cell.text[0]) {
                doc.text(cell.text[0], cell.x + cell.width / 2, cell.y + cell.height / 2, {
                  align: 'center',
                  baseline: 'middle'
                });
              }
            }
          }
          
          // Handle notes cell highlight (column 0)
          if (col === 0) {
            const highlightColor = notesHighlightMap.get(teacher.id);
            if (highlightColor) {
              const rgb = hexToRgb(highlightColor);
              doc.setFillColor(rgb[0], rgb[1], rgb[2]);
              doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
              
              const textColor = getTextColorForBackground(rgb);
              doc.setTextColor(textColor[0], textColor[1], textColor[2]);
              doc.setFont(cairoFont);
              doc.setFontSize(5);
              if (cell.text[0]) {
                doc.text(cell.text[0], cell.x + cell.width - 1, cell.y + cell.height / 2, {
                  align: 'right',
                  baseline: 'middle'
                });
              }
            }
          }
          
          // Handle teacher name cell highlight (column 38)
          if (col === 38) {
            const highlightColor = teacherNameHighlightMap.get(teacher.id);
            if (highlightColor) {
              const rgb = hexToRgb(highlightColor);
              doc.setFillColor(rgb[0], rgb[1], rgb[2]);
              doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
              
              const textColor = getTextColorForBackground(rgb);
              doc.setTextColor(textColor[0], textColor[1], textColor[2]);
              doc.setFont(cairoFont);
              doc.setFontSize(7);
              if (cell.text[0]) {
                doc.text(cell.text[0], cell.x + cell.width - 1, cell.y + cell.height / 2, {
                  align: 'right',
                  baseline: 'middle'
                });
              }
            }
          }
        }
      }
    },
  });

  doc.save("الجدول_الرئيسي.pdf");
}

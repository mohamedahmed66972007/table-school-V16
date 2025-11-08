
export interface CustomFontUpload {
  name: string;
  base64Data: string;
}

export interface CellHighlight {
  teacherId: string;
  day?: string;
  period?: number;
  cellType?: 'schedule' | 'teacherName' | 'notes';
  color: string;
}

export interface PDFCustomizationOptions {
  themeColor: [number, number, number];
  headerFont: string;
  headerFontSize: number;
  headerTextColor: [number, number, number];
  contentFont: string;
  contentFontSize: number;
  contentTextColor: [number, number, number];
  dayFont: string;
  dayFontSize: number;
  dayTextColor: [number, number, number];
  useCustomHeaderFont: boolean;
  useCustomContentFont: boolean;
  useCustomDayFont: boolean;
  customHeaderFont?: CustomFontUpload;
  customContentFont?: CustomFontUpload;
  customDayFont?: CustomFontUpload;
  cellHighlights?: CellHighlight[];
}

export const DEFAULT_PDF_OPTIONS: PDFCustomizationOptions = {
  themeColor: [66, 139, 202],
  headerFont: "Taro",
  headerFontSize: 16,
  headerTextColor: [0, 0, 0],
  contentFont: "Qarandash",
  contentFontSize: 14,
  contentTextColor: [0, 0, 0],
  dayFont: "moo",
  dayFontSize: 16,
  dayTextColor: [0, 0, 0],
  useCustomHeaderFont: false,
  useCustomContentFont: false,
  useCustomDayFont: false,
};


export const AVAILABLE_ARABIC_FONTS = [
  { value: "Taro", label: "Taro", url: "https://arbfonts.com//wp-content/fonts/arabic-fonts-wierd//taro.ttf" },
  { value: "moo", label: "moo", url: "https://arbfonts.com//wp-content/fonts/misc//Shorooq_N1.ttf" },
  { value: "Uthmanic", label: "Uthmanic Hafs", url: "https://arbfonts.com//wp-content/fonts/naskh-arabic-fonts//uthmanic_hafs_v22.ttf" },
  { value: "Qarandash", label: "Qarandash", url: "https://arbfonts.com//wp-content/fonts/new-arabic-fonts//qarandashpc-Regular.ttf" },
  { value: "moo2", label: "moo2", url: "https://arbfonts.com//wp-content/fonts/new-arabic-fonts//DG-Baysan-Bold.ttf" },
  { value: "Cairo", label: "Cairo", url: "/fonts/Cairo-ExtraBold.ttf" },
  { value: "Cairo-ExtraBold", label: "Cairo Extra Bold", url: "/fonts/Cairo-ExtraBold.ttf" },
  { value: "ElMessiri", label: "El Messiri", url: "/fonts/ElMessiri-Regular.ttf" },
  { value: "Lalezar", label: "Lalezar", url: "/fonts/Lalezar-Regular.ttf" },
  { value: "Marhey", label: "Marhey", url: "/fonts/Marhey-Regular.ttf" },
] as const;

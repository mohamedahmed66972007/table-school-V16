import type { Subject } from '@shared/schema';

export function normalizeArabicText(text: string): string {
  let normalized = text.trim();
  
  normalized = normalized.replace(/[\u064B-\u065F]/g, '');
  
  normalized = normalized.replace(/ـ/g, '');
  
  normalized = normalized.replace(/^(ال|اللغة|اللغه|مادة|ماده|التربية|التربيه)\s*/g, '');
  
  normalized = normalized
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
  
  normalized = normalized.replace(/\s+/g, '');
  
  return normalized.toLowerCase();
}

const SUBJECT_NORMALIZATION_MAP: Record<string, Subject> = {
  'اسلاميه': 'إسلامية',
  'اسلامية': 'إسلامية',
  'إسلاميه': 'إسلامية',
  'إسلامية': 'إسلامية',
  'اسلامي': 'إسلامية',
  'دينيه': 'إسلامية',
  'دينية': 'إسلامية',
  'دين': 'إسلامية',
  
  'عربيه': 'عربي',
  'عربية': 'عربي',
  'عربي': 'عربي',
  'لغهعربيه': 'عربي',
  
  'انجليزيه': 'إنجليزي',
  'انجليزية': 'إنجليزي',
  'انجليزي': 'إنجليزي',
  'إنجليزيه': 'إنجليزي',
  'إنجليزية': 'إنجليزي',
  'إنجليزي': 'إنجليزي',
  'انكليزيه': 'إنجليزي',
  'انكليزية': 'إنجليزي',
  'انكليزي': 'إنجليزي',
  'انجليتيه': 'إنجليزي',
  'انجليتية': 'إنجليزي',
  'لغهانجليزيه': 'إنجليزي',
  
  'رياضيات': 'رياضيات',
  'رياضه': 'رياضيات',
  'رياضة': 'رياضيات',
  
  'كيمياء': 'كيمياء',
  'كيميا': 'كيمياء',
  'كيمياو': 'كيمياء',
  
  'فيزياء': 'فيزياء',
  'فيزيا': 'فيزياء',
  'فيزياو': 'فيزياء',
  
  'احياء': 'أحياء',
  'أحياء': 'أحياء',
  'احيا': 'أحياء',
  'أحيا': 'أحياء',
  
  'اجتماعيات': 'اجتماعيات',
  'اجتماعيه': 'اجتماعيات',
  'اجتماعية': 'اجتماعيات',
  
  'حاسوب': 'حاسوب',
  'حاسب': 'حاسوب',
  'حاسبالي': 'حاسوب',
  'حاسوبالي': 'حاسوب',
  'كمبيوتر': 'حاسوب',
  
  'بدنيه': 'بدنية',
  'بدنية': 'بدنية',
  'بدني': 'بدنية',
  'رياضهبدنيه': 'بدنية',
  
  'فنيه': 'فنية',
  'فنية': 'فنية',
  'فني': 'فنية',
  'رسم': 'فنية',
};

export function normalizeSubjectName(rawSubject: string): Subject {
  const normalized = normalizeArabicText(rawSubject);
  
  const canonical = SUBJECT_NORMALIZATION_MAP[normalized];
  
  if (canonical) {
    return canonical;
  }
  
  console.warn(`Unknown subject variation: "${rawSubject}" (normalized: "${normalized}"). Using original text.`);
  return rawSubject as Subject;
}

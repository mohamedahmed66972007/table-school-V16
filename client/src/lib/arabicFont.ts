import { jsPDF } from "jspdf";
import { AVAILABLE_ARABIC_FONTS } from "../types/pdfCustomization";

// الدالة المساعدة لجلب الخط وتحويله إلى Base64
async function fetchAndConvertFont(url: string): Promise<string> {
    try {
        // نستخدم Fetch API لجلب بيانات الخط
        const response = await fetch(url, {
            mode: 'cors',
            cache: 'force-cache'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch font from ${url}: ${response.status} ${response.statusText}`);
        }

        // تحويل الاستجابة إلى ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();

        // تحويل ArrayBuffer إلى سلسلة Base64
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 0x8000;
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        
        const base64String = btoa(binary);
        return base64String;

    } catch (error) {
        console.error("Error fetching or converting font:", error);
        throw error;
    }
}

/**
 * دالة استيراد خط عربي وإضافته إلى مستند jsPDF
 * @param doc كائن jsPDF
 * @param fontName اسم الخط المراد إضافته (مثل "Cairo" أو "Cairo-ExtraBold")
 * @returns اسم الخط الذي تم استخدامه في jsPDF
 */
export async function loadArabicFont(doc: jsPDF, fontName: string): Promise<string> {
    const fontInfo = AVAILABLE_ARABIC_FONTS.find(f => f.value === fontName);

    if (!fontInfo) {
        console.error(`Font ${fontName} is not defined in AVAILABLE_ARABIC_FONTS.`);
        return "helvetica";
    }

    try {
        console.log(`Loading Arabic font: ${fontName} from ${fontInfo.url}`);
        const base64Data = await fetchAndConvertFont(fontInfo.url);

        const internalFontName = fontName; 
        const fontFile = `${internalFontName}.ttf`;

        doc.addFileToVFS(fontFile, base64Data);
        doc.addFont(fontFile, internalFontName, 'normal');

        console.log(`Successfully loaded Arabic font: ${fontName}`);
        return internalFontName;

    } catch (error) {
        console.error(`Failed to load Arabic font ${fontName}:`, error);
        return "helvetica";
    }
}

/**
 * دالة مساعدة لتحميل أكثر من خط (إذا احتجت إليها)
 */
export async function loadMultipleFonts(doc: jsPDF, fontNames: string[]): Promise<string[]> {
    const loadedFonts: string[] = [];
    for (const name of fontNames) {
        const loadedName = await loadArabicFont(doc, name);
        if (loadedName !== "helvetica") {
            loadedFonts.push(loadedName);
        }
    }
    return loadedFonts;
}
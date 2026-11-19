/**
 * ח. סבן חומרי בניין (1994) בע״מ — שרת Google Apps Script מלא (Code.js)
 *
 * תכונות:
 * 1. יצירה ועיצוב UI/UX אוטומטי של טאב "הרשמה ללקוח חדש" בעברית מלאה (RTL).
 * 2. כותרות עמודות מעוצבות, שורה קפואה, סינון, אימות נתונים (Dropdown) וצביעה מותנית.
 * 3. סנכרון אונליין דו-כיווני (Web App: doPost / doGet) מול ממשק פתיחת כרטיס הלקוח.
 * 4. נעילת כתיבה (LockService) למניעת התנגשויות בפניות מקבילות + לוגיקת סטטוס לקוח.
 */

const CONFIG = {
  SHEET_NAME: "הרשמה ללקוח חדש",
  TIMEZONE: "Asia/Jerusalem",
  HEADER_ROW: 3,
  DATA_START_ROW: 4,
  FONT_FAMILY: "Heebo",
  COLORS: {
    BRAND_BLUE: "#284B9E",
    BRAND_DARK: "#1B2A4E",
    PRIMARY_YELLOW: "#F5D033",
    ASIDE_BG: "#F4F6FA",
    ROW_ALT_BG: "#F9FAFC",
    WHITE: "#FFFFFF",
    TEXT_DARK: "#1F2937",
    TEXT_MUTED: "#64748B",
    BORDER: "#CBD5E1",
    STATUS_PENDING_BG: "#FEF3C7",
    STATUS_PENDING_FG: "#92400E",
    STATUS_REVIEW_BG: "#DBEAFE",
    STATUS_REVIEW_FG: "#1E40AF",
    STATUS_APPROVED_BG: "#DCFCE7",
    STATUS_APPROVED_FG: "#166534",
    STATUS_REJECTED_BG: "#FEE2E2",
    STATUS_REJECTED_FG: "#991B1B",
  },
  STATUS_OPTIONS: [
    "ממתין לטיפול",
    "בבדיקה",
    "אושר ונפתח בקומקס",
    "נדחה / חסרים פרטים",
  ],
};

/**
 * הגדרת עמודות הטאב בעברית תואמת לסכמת הטופס (src/lib/registration.ts)
 */
const COLUMNS = [
  { key: "reference", header: "מספר פנייה", width: 120, align: "center" },
  { key: "createdAt", header: "תאריך ושעה", width: 145, align: "center" },
  { key: "status", header: "סטטוס טיפול", width: 165, align: "center" },
  { key: "kindLabel", header: "סוג בקשה", width: 145, align: "center" },
  { key: "customerTypeLabel", header: "סוג לקוח", width: 125, align: "center" },
  { key: "name", header: "שם לקוח / עסק", width: 200, align: "right" },
  { key: "identity", header: "ת.ז / ח.פ / ע.מ", width: 130, align: "center" },
  { key: "mobile", header: "טלפון נייד", width: 125, align: "center" },
  { key: "email", header: "דוא״ל", width: 190, align: "left" },
  { key: "phone", header: "טלפון נוסף", width: 120, align: "center" },
  { key: "fax", header: "פקס", width: 120, align: "center" },
  { key: "city", header: "יישוב", width: 130, align: "right" },
  { key: "street", header: "רחוב", width: 150, align: "right" },
  { key: "house", header: "מספר בית", width: 90, align: "center" },
  { key: "postal", header: "מיקוד", width: 100, align: "center" },
  { key: "pobox", header: "תיבת דואר", width: 95, align: "center" },
  { key: "floor", header: "קומה", width: 80, align: "center" },
  { key: "apartment", header: "דירה", width: 80, align: "center" },
  { key: "unloadingLabel", header: "אופן הפריקה", width: 150, align: "right" },
  { key: "notes", header: "הערות למשלוח / חומרים להצעת מחיר", width: 280, align: "right" },
  { key: "contactName", header: "שם איש קשר", width: 150, align: "right" },
  { key: "contactMobile", header: "נייד איש קשר", width: 125, align: "center" },
  { key: "contactRole", header: "תפקיד איש קשר", width: 135, align: "right" },
  { key: "contactEmail", header: "דוא״ל איש קשר", width: 185, align: "left" },
  { key: "contactCode", header: "קוד מזהה", width: 110, align: "center" },
  { key: "contactExtension", header: "שלוחה", width: 85, align: "center" },
  { key: "contactPhone", header: "טלפון איש קשר", width: 120, align: "center" },
  { key: "contactFax", header: "פקס איש קשר", width: 120, align: "center" },
  { key: "contactSkype", header: "סקייפ", width: 120, align: "left" },
  { key: "contactBirthdate", header: "תאריך לידה", width: 115, align: "center" },
  { key: "contactGender", header: "מין", width: 85, align: "center" },
  { key: "contactBranch", header: "סניף לקוח", width: 125, align: "right" },
  { key: "contactMessages", header: "הודעות איש קשר", width: 165, align: "right" },
  { key: "contactRules", header: "כללי הרשאות", width: 165, align: "right" },
  { key: "requestedPermissions", header: "הרשאות מבוקשות (לאישור חברה)", width: 260, align: "right" },
  { key: "consentLabel", header: "אישור שימוש בפרטים", width: 135, align: "center" },
  { key: "source", header: "מקור הגעה", width: 140, align: "center" },
  { key: "comaxCardNumber", header: "מס׳ כרטיס קומקס / הערות משרד", width: 210, align: "right" },
];

const KIND_LABELS = {
  new: "פתיחת כרטיס חדש",
  update: "עדכון פרטים",
  quote: "בקשת הצעת מחיר",
};

const CUSTOMER_TYPE_LABELS = {
  private: "לקוח פרטי",
  business: "קבלן / עסק",
};

const UNLOADING_LABELS = {
  coordinate: "בתיאום עם הצוות",
  ground: "פריקה בקרקע",
  crane: "משאית מנוף",
  porter: "סבלות",
};

/**
 * תפריט מותאם אישית בגיליון Google Sheets
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("ח. סבן — ניהול לקוחות")
    .addItem("יצירה / עיצוב טאב הרשמה ללקוח חדש", "createCustomerRegistrationTab")
    .addItem("רענון עיצוב ותנאים", "refreshRegistrationSheetDesign")
    .addSeparator()
    .addItem("הוספת פניית בדיקה לדוגמה", "testAppendSampleRow")
    .addToUi();
}

/**
 * פונקציה ראשית ליצירת טאב "הרשמה ללקוח חדש" עם כותרות בעברית ועיצוב UI/UX מלא
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function createCustomerRegistrationTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }

  // העברת הטאב למיקום הראשון וכיוון RTL
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);
  sheet.setRightToLeft(true);
  sheet.setTabColor(CONFIG.COLORS.PRIMARY_YELLOW);

  const totalCols = COLUMNS.length;

  // שורה 1: כותרת ראשית ממותגת (Banner)
  const bannerRange = sheet.getRange(1, 1, 1, totalCols);
  bannerRange.breakApart();
  bannerRange.merge();
  bannerRange
    .setValue("ח. סבן חומרי בניין (1994) בע״מ  |  הרשמה ללקוח חדש — סנכרון אונליין מהממשק")
    .setBackground(CONFIG.COLORS.BRAND_BLUE)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontFamily(CONFIG.FONT_FAMILY)
    .setFontSize(14)
    .setFontWeight("bold")
    .setHorizontalAlignment("right")
    .setVerticalAlignment("middle")
    .setBorder(
      false,
      false,
      true,
      false,
      false,
      false,
      CONFIG.COLORS.PRIMARY_YELLOW,
      SpreadsheetApp.BorderStyle.SOLID_THICK
    );
  sheet.setRowHeight(1, 46);

  // שורה 2: סרגל מדדים (KPI) וסטטוס סנכרון אונליין
  const kpiRange = sheet.getRange(2, 1, 1, totalCols);
  kpiRange.breakApart();
  kpiRange
    .setBackground(CONFIG.COLORS.ASIDE_BG)
    .setFontFamily(CONFIG.FONT_FAMILY)
    .setFontSize(10)
    .setFontColor(CONFIG.COLORS.TEXT_DARK)
    .setVerticalAlignment("middle")
    .setBorder(
      false,
      false,
      true,
      false,
      false,
      false,
      CONFIG.COLORS.BORDER,
      SpreadsheetApp.BorderStyle.SOLID
    );
  sheet.setRowHeight(2, 30);

  sheet.getRange(2, 1, 1, 2).merge().setValue("סה״כ פניות:").setFontWeight("bold").setHorizontalAlignment("right");
  sheet.getRange(2, 3).setFormula('=COUNTA(A4:A)').setFontWeight("bold").setFontColor(CONFIG.COLORS.BRAND_BLUE).setHorizontalAlignment("center");
  sheet.getRange(2, 4, 1, 2).merge().setValue("ממתינים לטיפול:").setFontWeight("bold").setHorizontalAlignment("right");
  sheet.getRange(2, 6).setFormula('=COUNTIF(C4:C,"ממתין לטיפול")').setFontWeight("bold").setFontColor(CONFIG.COLORS.STATUS_PENDING_FG).setHorizontalAlignment("center");
  sheet.getRange(2, 7, 1, 2).merge().setValue("אושרו בקומקס:").setFontWeight("bold").setHorizontalAlignment("right");
  sheet.getRange(2, 9).setFormula('=COUNTIF(C4:C,"אושר ונפתח בקומקס")').setFontWeight("bold").setFontColor(CONFIG.COLORS.STATUS_APPROVED_FG).setHorizontalAlignment("center");
  sheet
    .getRange(2, 10, 1, totalCols - 9)
    .merge()
    .setValue("מצב חיבור: פעיל ומסונכרן אונליין")
    .setFontColor(CONFIG.COLORS.TEXT_MUTED)
    .setHorizontalAlignment("left");

  // שורה 3: כותרות עמודות בעברית
  const headers = [COLUMNS.map((c) => c.header)];
  const headerRange = sheet.getRange(CONFIG.HEADER_ROW, 1, 1, totalCols);
  headerRange
    .setValues(headers)
    .setBackground(CONFIG.COLORS.BRAND_DARK)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontFamily(CONFIG.FONT_FAMILY)
    .setFontSize(10)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true,
      CONFIG.COLORS.BRAND_BLUE,
      SpreadsheetApp.BorderStyle.SOLID
    );
  sheet.setRowHeight(CONFIG.HEADER_ROW, 38);

  // הקפאת כותרת ויישום רוחבי עמודות
  sheet.setFrozenRows(CONFIG.HEADER_ROW);
  sheet.setFrozenColumns(6);
  COLUMNS.forEach((col, index) => {
    sheet.setColumnWidth(index + 1, col.width);
  });

  // הפעלת פילטר מובנה על כותרות הטבלה
  const existingFilter = sheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }
  sheet.getRange(CONFIG.HEADER_ROW, 1, Math.max(sheet.getLastRow(), CONFIG.DATA_START_ROW) - CONFIG.HEADER_ROW + 1, totalCols).createFilter();

  applySheetValidationsAndFormatting_(sheet);
  return sheet;
}

/**
 * רענון עיצוב, אימותי נתונים ועיצוב מותנה
 */
function refreshRegistrationSheetDesign() {
  const sheet = ensureRegistrationSheet_();
  applySheetValidationsAndFormatting_(sheet);
}

/**
 * מוודא שהטאב קיים ומוכן לכתיבה
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function ensureRegistrationSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existing = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (existing) {
    return existing;
  }
  return createCustomerRegistrationTab();
}

/**
 * החלת Dropdown של סטטוס טיפול וכללי צביעה UI/UX (Conditional Formatting)
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function applySheetValidationsAndFormatting_(sheet) {
  const maxRows = Math.max(sheet.getMaxRows(), 500);
  const dataRowCount = maxRows - CONFIG.DATA_START_ROW + 1;

  // אימות נתונים לעמודת סטטוס טיפול (עמודה C = 3)
  const statusColRange = sheet.getRange(CONFIG.DATA_START_ROW, 3, dataRowCount, 1);
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  statusColRange.setDataValidation(statusRule);

  // כללי עיצוב מותנה לסטטוסים וסוגי בקשה
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("ממתין לטיפול")
      .setBackground(CONFIG.COLORS.STATUS_PENDING_BG)
      .setFontColor(CONFIG.COLORS.STATUS_PENDING_FG)
      .setBold(true)
      .setRanges([statusColRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("בבדיקה")
      .setBackground(CONFIG.COLORS.STATUS_REVIEW_BG)
      .setFontColor(CONFIG.COLORS.STATUS_REVIEW_FG)
      .setBold(true)
      .setRanges([statusColRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("אושר ונפתח בקומקס")
      .setBackground(CONFIG.COLORS.STATUS_APPROVED_BG)
      .setFontColor(CONFIG.COLORS.STATUS_APPROVED_FG)
      .setBold(true)
      .setRanges([statusColRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("נדחה / חסרים פרטים")
      .setBackground(CONFIG.COLORS.STATUS_REJECTED_BG)
      .setFontColor(CONFIG.COLORS.STATUS_REJECTED_FG)
      .setBold(true)
      .setRanges([statusColRange])
      .build(),
  ];

  sheet.setConditionalFormatRules(rules);
}

/**
 * עיצוב שורת נתונים חדשה בגיליון לשמירה על נראות UI/UX אחידה
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} rowIndex
 */
function styleDataRow_(sheet, rowIndex) {
  const totalCols = COLUMNS.length;
  const rowRange = sheet.getRange(rowIndex, 1, 1, totalCols);
  const isEven = (rowIndex - CONFIG.DATA_START_ROW) % 2 === 1;

  rowRange
    .setBackground(isEven ? CONFIG.COLORS.ROW_ALT_BG : CONFIG.COLORS.WHITE)
    .setFontFamily(CONFIG.FONT_FAMILY)
    .setFontSize(10)
    .setFontColor(CONFIG.COLORS.TEXT_DARK)
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true,
      CONFIG.COLORS.BORDER,
      SpreadsheetApp.BorderStyle.SOLID
    );

  COLUMNS.forEach((col, i) => {
    sheet.getRange(rowIndex, i + 1).setHorizontalAlignment(col.align);
  });

  // הדגשת מספר הפנייה
  sheet.getRange(rowIndex, 1).setFontWeight("bold").setFontColor(CONFIG.COLORS.BRAND_BLUE);
  sheet.setRowHeight(rowIndex, 34);
}

/**
 * ממפה אובייקט בקשה מהממשק לשורה שלמה לפי סדר העמודות
 * @param {Object} payload
 * @param {string} reference
 */
function mapPayloadToRow_(payload, reference) {
  const d = payload && payload.data ? payload.data : payload || {};
  const contact = d.contact && typeof d.contact === "object" ? d.contact : {};
  const permissions = Array.isArray(d.requestedPermissions)
    ? d.requestedPermissions.join(", ")
    : "";
  const nowFormatted = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm:ss");

  return [
    reference,
    nowFormatted,
    "ממתין לטיפול",
    KIND_LABELS[d.kind] || d.kind || "פתיחת כרטיס חדש",
    CUSTOMER_TYPE_LABELS[d.customerType] || d.customerType || "לקוח פרטי",
    safeStr_(d.name),
    safeStr_(d.identity),
    safeStr_(d.mobile),
    safeStr_(d.email),
    safeStr_(d.phone),
    safeStr_(d.fax),
    safeStr_(d.city),
    safeStr_(d.street),
    safeStr_(d.house),
    safeStr_(d.postal),
    safeStr_(d.pobox),
    safeStr_(d.floor),
    safeStr_(d.apartment),
    UNLOADING_LABELS[d.unloading] || safeStr_(d.unloading),
    safeStr_(d.notes),
    safeStr_(contact.name),
    safeStr_(contact.mobile),
    safeStr_(contact.role),
    safeStr_(contact.email),
    safeStr_(contact.code),
    safeStr_(contact.extension),
    safeStr_(contact.phone),
    safeStr_(contact.fax),
    safeStr_(contact.skype),
    safeStr_(contact.birthdate),
    safeStr_(contact.gender),
    safeStr_(contact.branch),
    safeStr_(contact.messages),
    safeStr_(contact.rules),
    permissions,
    d.consent === true ? "כן" : "לא",
    safeStr_(payload.source || "ממשק אינטרנט אונליין"),
    "",
  ];
}

function safeStr_(val) {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/**
 * נקודת קצה GET לסנכרון אונליין, בדיקת תקינות וקריאת נתונים חיים מהגיליון
 * תומכת בפרמטר ?action=health | list | setup
 * @param {GoogleAppsScript.Events.DoGet} e
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = params.action || "health";

    if (action === "setup") {
      const sheet = createCustomerRegistrationTab();
      return jsonResponse_({
        ok: true,
        action: "setup",
        sheetName: sheet.getName(),
        columnsCount: COLUMNS.length,
      });
    }

    const sheet = ensureRegistrationSheet_();
    const lastRow = sheet.getLastRow();
    const rowsCount = Math.max(0, lastRow - CONFIG.HEADER_ROW);

    if (action === "list") {
      const limit = Math.min(Math.max(Number(params.limit) || 50, 1), 200);
      const records = [];
      if (rowsCount > 0) {
        const startRow = Math.max(CONFIG.DATA_START_ROW, lastRow - limit + 1);
        const count = lastRow - startRow + 1;
        const values = sheet.getRange(startRow, 1, count, COLUMNS.length).getValues();
        for (let i = values.length - 1; i >= 0; i--) {
          const row = values[i];
          const item = {};
          COLUMNS.forEach((col, idx) => {
            item[col.key] = row[idx];
          });
          records.push(item);
        }
      }
      return jsonResponse_({
        ok: true,
        sheetName: CONFIG.SHEET_NAME,
        totalRows: rowsCount,
        records: records,
      });
    }

    return jsonResponse_({
      ok: true,
      service: "ח. סבן — שרת גיליון הרשמה ללקוח חדש",
      sheetName: CONFIG.SHEET_NAME,
      totalRows: rowsCount,
      updatedAt: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm:ss"),
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
}

const RECEIPTS_CONFIG = {
  SHEET_NAME: "אסמכתאות העברה בנקאית",
  FOLDER_NAME: "אסמכתאות העברה בנקאית — ח. סבן",
};

/**
 * מוודא קיום תיקיית Google Drive לאסמכתאות העברה בנקאית
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function ensureReceiptsDriveFolder_() {
  const folders = DriveApp.getFoldersByName(RECEIPTS_CONFIG.FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(RECEIPTS_CONFIG.FOLDER_NAME);
}

/**
 * יוצר ומעצב טאב "אסמכתאות העברה בנקאית" בעברית מלאה
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function ensureReceiptsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(RECEIPTS_CONFIG.SHEET_NAME);
  if (sheet) return sheet;

  sheet = ss.insertSheet(RECEIPTS_CONFIG.SHEET_NAME);
  sheet.setRightToLeft(true);
  sheet.setTabColor(CONFIG.COLORS.BRAND_BLUE);

  const headers = [
    "מספר אסמכתא",
    "תאריך ושעה",
    "סטטוס שיוך",
    "שם לקוח / עסק",
    "מספר הזמנה / טלפון",
    "סכום העברה",
    "שם קובץ",
    "קישור לקובץ בדרייב",
    "הערות",
  ];
  const widths = [130, 150, 155, 200, 170, 120, 210, 260, 240];

  sheet
    .getRange(1, 1, 1, headers.length)
    .merge()
    .setValue("ח. סבן חומרי בניין (1994) בע״מ  |  אסמכתאות העברה בנקאית (Drive + גיליון)")
    .setBackground(CONFIG.COLORS.BRAND_BLUE)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontFamily(CONFIG.FONT_FAMILY)
    .setFontSize(13)
    .setFontWeight("bold")
    .setHorizontalAlignment("right")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 42);

  sheet
    .getRange(2, 1, 1, headers.length)
    .setValues([headers])
    .setBackground(CONFIG.COLORS.BRAND_DARK)
    .setFontColor(CONFIG.COLORS.WHITE)
    .setFontFamily(CONFIG.FONT_FAMILY)
    .setFontSize(10)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(2, 34);
  sheet.setFrozenRows(2);

  widths.forEach((w, idx) => sheet.setColumnWidth(idx + 1, w));
  return sheet;
}

/**
 * שומר קובץ אסמכתא בנקאית ב-Google Drive ומתעד בגיליון
 * @param {Object} body
 */
function handleUploadReceipt_(body) {
  const d = body && body.data ? body.data : body || {};
  const base64 = safeStr_(d.base64Data);
  const fileName = safeStr_(d.fileName) || "bank-receipt.jpg";
  const mimeType = safeStr_(d.mimeType) || "image/jpeg";
  if (!base64) {
    return jsonResponse_({ ok: false, error: "לא התקבל קובץ אסמכתא" });
  }

  const reference = safeStr_(body.reference || Utilities.getUuid().slice(0, 8)).toUpperCase();
  const folder = ensureReceiptsDriveFolder_();
  const bytes = Utilities.base64Decode(base64);
  const safeFileName = reference + "_" + fileName;
  const blob = Utilities.newBlob(bytes, mimeType, safeFileName);
  const file = folder.createFile(blob);

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    // ארגונים מסוימים חוסמים שיתוף חיצוני — הקובץ עדיין נשמר בדרייב
  }

  const driveUrl = file.getUrl();
  const sheet = ensureReceiptsSheet_();
  const nowFormatted = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm:ss");
  const nextRow = Math.max(sheet.getLastRow() + 1, 3);

  sheet
    .getRange(nextRow, 1, 1, 9)
    .setValues([
      [
        reference,
        nowFormatted,
        "ממתין לשיוך להזמנה",
        safeStr_(d.customerName),
        safeStr_(d.orderOrPhone),
        safeStr_(d.amount),
        safeFileName,
        driveUrl,
        safeStr_(d.notes),
      ],
    ])
    .setFontFamily(CONFIG.FONT_FAMILY)
    .setFontSize(10)
    .setVerticalAlignment("middle");

  SpreadsheetApp.flush();

  return jsonResponse_({
    ok: true,
    uploadedToDrive: true,
    reference: reference,
    fileId: file.getId(),
    driveUrl: driveUrl,
    sheetName: RECEIPTS_CONFIG.SHEET_NAME,
  });
}

/**
 * נקודת קצה POST לקליטת פניות אונליין מהממשק ועדכון סטטוס בזמן אמת
 * @param {GoogleAppsScript.Events.DoPost} e
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const body = JSON.parse(raw);
    const action = body.action || "submit";

    if (action === "setup") {
      const sheet = createCustomerRegistrationTab();
      return jsonResponse_({ ok: true, sheetName: sheet.getName() });
    }

    if (action === "uploadReceipt") {
      return handleUploadReceipt_(body);
    }

    const sheet = ensureRegistrationSheet_();

    if (action === "updateStatus") {
      const ref = safeStr_(body.reference).toUpperCase();
      const status = safeStr_(body.status);
      if (!ref || CONFIG.STATUS_OPTIONS.indexOf(status) === -1) {
        return jsonResponse_({ ok: false, error: "מספר פנייה או סטטוס לא תקינים" });
      }
      const lastRow = sheet.getLastRow();
      if (lastRow < CONFIG.DATA_START_ROW) {
        return jsonResponse_({ ok: false, error: "לא נמצאו רשומות בגיליון" });
      }
      const refs = sheet.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, 1).getValues();
      for (let i = 0; i < refs.length; i++) {
        if (String(refs[i][0]).trim().toUpperCase() === ref) {
          const targetRow = CONFIG.DATA_START_ROW + i;
          sheet.getRange(targetRow, 3).setValue(status);
          if (body.comaxCardNumber !== undefined) {
            sheet.getRange(targetRow, COLUMNS.length).setValue(safeStr_(body.comaxCardNumber));
          }
          updateLastSyncNote_(sheet);
          return jsonResponse_({ ok: true, reference: ref, status: status, rowNumber: targetRow });
        }
      }
      return jsonResponse_({ ok: false, error: "מספר פנייה לא נמצא בגיליון" });
    }

    // קליטת הרשמה חדשה (submit)
    const data = body.data ? body.data : body;

    // הגנת honeypot
    if (safeStr_(data.website) !== "") {
      return jsonResponse_({ ok: false, error: "בקשה נדחתה" });
    }

    // אימות שדות חובה בצד השרת
    if (!safeStr_(data.name) || !/^\d{9}$/.test(safeStr_(data.identity)) || !/^0\d{8,9}$/.test(safeStr_(data.mobile))) {
      return jsonResponse_({ ok: false, error: "שדות זיהוי או טלפון אינם תקינים" });
    }
    if (data.consent !== true) {
      return jsonResponse_({ ok: false, error: "נדרש אישור לשימוש בפרטים" });
    }

    const reference = safeStr_(body.reference || data.reference || Utilities.getUuid().slice(0, 8)).toUpperCase();
    const rowValues = mapPayloadToRow_(body, reference);
    const nextRow = Math.max(sheet.getLastRow() + 1, CONFIG.DATA_START_ROW);

    sheet.getRange(nextRow, 1, 1, COLUMNS.length).setValues([rowValues]);
    styleDataRow_(sheet, nextRow);
    updateLastSyncNote_(sheet);
    SpreadsheetApp.flush();

    return jsonResponse_({
      ok: true,
      reference: reference,
      rowNumber: nextRow,
      sheetName: CONFIG.SHEET_NAME,
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * מעדכן בשורה 2 את חותמת הזמן של הסנכרון האחרון
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function updateLastSyncNote_(sheet) {
  const stamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm:ss");
  sheet
    .getRange(2, 10)
    .setValue("מצב חיבור: פעיל ומסונכרן אונליין  |  עדכון אחרון: " + stamp);
}

/**
 * בדיקה מהירה מתוך עורך Apps Script או תפריט הגיליון
 */
function testAppendSampleRow() {
  const sheet = ensureRegistrationSheet_();
  const sample = {
    reference: Utilities.getUuid().slice(0, 8).toUpperCase(),
    source: "בדיקה ידנית מהגיליון",
    data: {
      kind: "new",
      customerType: "business",
      name: "בדיקה — אלון בנייה בע״מ",
      identity: "514123456",
      mobile: "0501234567",
      email: "office@alon-build.co.il",
      city: "הוד השרון",
      street: "החרש",
      house: "5",
      postal: "4520000",
      pobox: "",
      floor: "0",
      apartment: "0",
      phone: "097400000",
      fax: "",
      unloading: "crane",
      notes: "בקשת בדיקה — נא לתאם משאית מנוף בשעות הבוקר",
      contact: {
        name: "אלון כהן",
        mobile: "0527654321",
        role: "מנהל רכש",
        email: "alon@alon-build.co.il",
      },
      requestedPermissions: ["איש קשר ראשי", "מאשר הזמנות"],
      consent: true,
      website: "",
    },
  };

  const rowValues = mapPayloadToRow_(sample, sample.reference);
  const nextRow = Math.max(sheet.getLastRow() + 1, CONFIG.DATA_START_ROW);
  sheet.getRange(nextRow, 1, 1, COLUMNS.length).setValues([rowValues]);
  styleDataRow_(sheet, nextRow);
  updateLastSyncNote_(sheet);
}

/**
 * מחזיר תשובת JSON תקנית משרת Apps Script
 * @param {Object} data
 */
function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

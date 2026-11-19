import { z } from 'zod';

const text = z.string().trim().max(200);
const required = text.min(1, 'שדה חובה');
export const registrationSchema = z.object({
  kind: z.enum(['new', 'update', 'quote']),
  customerType: z.enum(['private', 'business']),
  name: required,
  identity: z.string().regex(/^\d{9}$/, 'יש להזין מספר מזהה בן 9 ספרות'),
  mobile: z.string().regex(/^0\d{8,9}$/, 'יש להזין מספר טלפון תקין'),
  email: z.union([z.literal(''), z.string().trim().email('כתובת דוא״ל לא תקינה').max(255)]),
  city: required, street: required, house: required, postal: z.string().regex(/^\d{5}(\d{2})?$/, 'יש להזין מיקוד בן 5 או 7 ספרות'),
  pobox: text, floor: required, apartment: required,
  phone: text, fax: text, unloading: z.enum(['ground', 'crane', 'porter', 'coordinate']),
  notes: z.string().trim().max(2000),
  contact: z.record(z.string().max(50), z.string().trim().max(255)),
  requestedPermissions: z.array(z.string().max(80)).max(25),
  consent: z.literal(true, { errorMap: () => ({ message: 'נדרש אישור לשימוש בפרטים לצורך הטיפול בבקשה' }) }),
  website: z.string().max(0),
});
export type Registration = z.infer<typeof registrationSchema>;
export const permissionLabels = ['איש קשר ראשי', 'מאשר הזמנות', 'מקבל הזמנות רכש', 'מקבל פירוט מס״ב', 'מקבל חשבון לקוח', 'משלם חשבון לקוח', 'מסרב לקבל חשבונית במייל', 'צפייה בסטטוס קריאות שירות', 'פתיחת / סגירת קריאת שירות', 'מנהל מערכת', 'סיום משימה', 'לא לדיוור'];
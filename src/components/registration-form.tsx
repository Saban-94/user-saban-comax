import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { registrationSchema, permissionLabels, type Registration } from "@/lib/registration";
import { submitRegistration } from "@/lib/registration.functions";

const steps = ["פרטי לקוח", "כתובת ואספקה", "אנשי קשר ואישור"] as const;

const initial = {
  kind: "new",
  customerType: "private",
  name: "",
  identity: "",
  mobile: "",
  email: "",
  city: "",
  street: "",
  house: "",
  postal: "",
  pobox: "",
  floor: "",
  apartment: "",
  phone: "",
  fax: "",
  unloading: "coordinate",
  notes: "",
  contact: {},
  requestedPermissions: [],
  consent: false,
  website: "",
};

type Draft = Omit<Registration, "consent"> & { consent: boolean };

const REQUIRED_KEYS: (keyof Draft)[] = [
  "name",
  "identity",
  "mobile",
  "city",
  "street",
  "house",
  "postal",
  "floor",
  "apartment",
  "consent",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getFieldStatus(
  key: keyof Draft,
  data: Draft,
): { valid: boolean; error?: string; okLabel?: string } {
  const val = typeof data[key] === "string" ? data[key].trim() : "";

  switch (key) {
    case "name":
      return val.length > 0
        ? { valid: true, okLabel: data.customerType === "business" ? "שם העסק אושר" : "השם אושר" }
        : { valid: false, error: "שדה חובה" };
    case "identity":
      if (/^\d{9}$/.test(val)) return { valid: true, okLabel: "מספר מזהה תקין (9 ספרות)" };
      return { valid: false, error: "יש להזין מספר מזהה בן 9 ספרות" };
    case "mobile":
      if (/^0\d{8,9}$/.test(val)) return { valid: true, okLabel: "מספר נייד אומת" };
      return { valid: false, error: "יש להזין מספר טלפון תקין" };
    case "email":
      if (val === "") return { valid: false };
      if (EMAIL_RE.test(val) && val.length <= 255) {
        return { valid: true, okLabel: "כתובת דוא״ל תקינה ואושרה" };
      }
      return { valid: false, error: "כתובת דוא״ל לא תקינה" };
    case "city":
      return val.length > 0
        ? { valid: true, okLabel: "יישוב אומת" }
        : { valid: false, error: "שדה חובה" };
    case "street":
      return val.length > 0
        ? { valid: true, okLabel: "רחוב אומת" }
        : { valid: false, error: "שדה חובה" };
    case "house":
      return val.length > 0
        ? { valid: true, okLabel: "מספר בית אושר" }
        : { valid: false, error: "שדה חובה" };
    case "postal":
      if (/^\d{5}(\d{2})?$/.test(val)) return { valid: true, okLabel: "מיקוד תקין ואומת" };
      return { valid: false, error: "יש להזין מיקוד בן 5 או 7 ספרות" };
    case "floor":
      return val.length > 0
        ? { valid: true, okLabel: "קומה אושרה" }
        : { valid: false, error: "שדה חובה" };
    case "apartment":
      return val.length > 0
        ? { valid: true, okLabel: "פרטי דירה אושרו" }
        : { valid: false, error: "שדה חובה" };
    case "phone":
    case "fax":
    case "pobox":
      return val.length > 0 ? { valid: true, okLabel: "נרשם (אופציונלי)" } : { valid: false };
    case "consent":
      return data.consent
        ? { valid: true, okLabel: "אישור השימוש בפרטים אושר" }
        : { valid: false, error: "נדרש אישור לשימוש בפרטים לצורך הטיפול בבקשה" };
    default:
      return { valid: false };
  }
}

export function RegistrationForm() {
  const [data, setData] = useState<Draft>(initial as Draft);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [tickerIdx, setTickerIdx] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const send = useServerFn(submitRegistration);

  const stepGuidance = useMemo(() => {
    const isBusiness = data.customerType === "business";
    if (step === 0) {
      return {
        prompt: isBusiness
          ? "הנחיות לשלב 1 (קבלן / עסק): הזינו שם עסק מלא כפי שמופיע בחשבונית, מספר ח.פ או עוסק מורשה בן 9 ספרות, ומספר נייד זמין לתיאום הזמנות."
          : "הנחיות לשלב 1 (לקוח פרטי): הזינו שם מלא, תעודת זהות בת 9 ספרות ומספר טלפון נייד תקין. כתובת הדוא״ל ופרטי ההתקשרות הנוספים הם אופציונליים.",
        requiredList: isBusiness
          ? "שם עסק / שם מלא, עוסק מורשה / ח.פ (9 ספרות), מספר נייד"
          : "שם מלא, תעודת זהות (9 ספרות), מספר נייד",
        optionalList: "דוא״ל לחשבוניות, טלפון נוסף, פקס",
        messages: [
          "בדף זה ממלאים פרטי זיהוי בסיסיים לפתיחת כרטיס לקוח — שדות עם * הם חובה.",
          "דוא״ל, טלפון נוסף ופקס הם שדות אופציונליים וניתן לפתוח אותם מתחת לשדות הראשיים.",
          "ככל שהשדות יאומתו בירוק, אחוז ההתקדמות יעלה אוטומטית לקראת השלב הבא.",
        ],
      };
    }
    if (step === 1) {
      return {
        prompt:
          "הנחיות לשלב 2 (כתובת ואספקה): מלאו את כתובת היעד המדויקת — יישוב, רחוב, מספר בית, מיקוד (5 או 7 ספרות), קומה ודירה. לאתר בנייה או פריקה בקרקע הזינו 0.",
        requiredList: "יישוב, רחוב, מספר בית, מיקוד (5/7 ספרות), קומה, דירה",
        optionalList: "תיבת דואר, אופן הפריקה (מנוף/סבלות/קרקע), הערות וחומרים להצעת מחיר",
        messages: [
          "בדף זה מוגדרת כתובת האספקה והנגישות לפריקה — יישוב, רחוב, בית, מיקוד, קומה ודירה הם חובה.",
          "אופן הפריקה, תיבת דואר והערות החומרים להצעת מחיר הם אופציונליים ויעזרו לצוות לתכנן הובלה.",
          "טיפ לאימות מהיר: מיקוד תקין בישראל הוא בן 5 או 7 ספרות (לדוגמה: 4520000).",
        ],
      };
    }
    return {
      prompt:
        "הנחיות לשלב 3 (אנשי קשר ואישור): כל פרטי אנשי הקשר והרשאות המערכת הם אופציונליים. בדקו את שורת אימות הכתובת והפרטים, אשרו את תיבת ההסכמה ולחצו לשליחה.",
      requiredList: "תיבת אישור שימוש בפרטים לצורך פתיחת הכרטיס",
      optionalList: "שם, נייד, תפקיד ודוא״ל איש קשר, פרטים מורחבים והרשאות מערכת",
      messages: [
        "בדף זה כל פרטי אנשי הקשר וההרשאות הם אופציונליים — רק סימון תיבת האישור הוא חובה לסיום.",
        "ודאו בשורת הסיכום שהשם והכתובת שאומתו בשלבים הקודמים נכונים לפני השליחה.",
        "מיד לאחר הלחיצה הבקשה תישמר ותסתנכרן אונליין מול צוות ח. סבן.",
      ],
    };
  }, [step, data.customerType]);

  // אפקט הקלדה חי להנחיות המילוי בכל שלב
  useEffect(() => {
    const fullText = stepGuidance.prompt;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setTypedText(fullText);
      setIsTyping(false);
      return;
    }

    setTypedText("");
    setIsTyping(true);
    let idx = 0;
    const timer = window.setInterval(() => {
      idx += 1;
      setTypedText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        window.clearInterval(timer);
        setIsTyping(false);
      }
    }, 18);

    return () => window.clearInterval(timer);
  }, [stepGuidance.prompt]);

  // הודעות מתחלפות בפס ההתקדמות
  useEffect(() => {
    setTickerIdx(0);
    const interval = window.setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % 3);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [step]);

  const completedRequiredCount = useMemo(
    () => REQUIRED_KEYS.filter((key) => getFieldStatus(key, data).valid).length,
    [data],
  );
  const progressPercent = Math.round((completedRequiredCount / REQUIRED_KEYS.length) * 100);

  const addressVerified =
    getFieldStatus("city", data).valid &&
    getFieldStatus("street", data).valid &&
    getFieldStatus("house", data).valid &&
    getFieldStatus("postal", data).valid;

  function markTouched(key: string) {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }

  function field(
    key: keyof Draft,
    label: string,
    options: { required?: boolean; type?: string; placeholder?: string } = {},
  ) {
    const status = getFieldStatus(key, data);
    const val = String(data[key]);
    const isTouched = !!touched[key];
    const explicitError = errors[key];
    const showError =
      explicitError || (isTouched && !status.valid && (options.required || val.trim() !== ""));
    const errorMessage = explicitError || (!status.valid ? status.error : undefined);
    const showValid = status.valid && !explicitError;

    return (
      <label className="field" key={key} htmlFor={key}>
        <span className="field-label-row">
          <span>
            {label}{" "}
            {options.required ? <em>*</em> : <small className="optional-tag">(אופציונלי)</small>}
          </span>
          {showValid && (
            <span className="field-badge-ok">
              <CheckCircle2 size={13} /> אושר
            </span>
          )}
        </span>
        <div className="input-wrap">
          <input
            id={key}
            name={key}
            type={options.type || "text"}
            inputMode={["identity", "mobile", "postal"].includes(key) ? "numeric" : undefined}
            maxLength={key === "notes" ? 2000 : 255}
            value={val}
            placeholder={options.placeholder}
            aria-invalid={showError ? true : undefined}
            data-valid={showValid ? "true" : undefined}
            onBlur={() => markTouched(key)}
            onChange={(e) => {
              const nextVal = e.target.value;
              setData((d) => ({ ...d, [key]: nextVal }));
              markTouched(key);
              if (errors[key]) {
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy[key];
                  return copy;
                });
              }
            }}
          />
          {showValid && <CheckCircle2 className="input-status-icon valid" size={16} />}
          {showError && <AlertCircle className="input-status-icon invalid" size={16} />}
        </div>
        {showError && errorMessage ? (
          <small className="field-error">{errorMessage}</small>
        ) : showValid && status.okLabel ? (
          <small className="field-ok">{status.okLabel}</small>
        ) : null}
      </label>
    );
  }

  function validate(keys?: string[]) {
    const result = registrationSchema.safeParse(data);
    const next: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((i) => {
        const key = String(i.path[0]);
        if (!keys || keys.includes(key)) next[key] = i.message;
      });
    }
    if (keys) {
      const touchedPatch: Record<string, boolean> = {};
      keys.forEach((k) => {
        touchedPatch[k] = true;
      });
      setTouched((prev) => ({ ...prev, ...touchedPatch }));
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function next() {
    if (
      validate(
        step === 0
          ? ["name", "identity", "mobile", "email"]
          : ["city", "street", "house", "postal", "floor", "apartment"],
      )
    ) {
      setStep((s) => s + 1);
    }
  }

  async function submit() {
    if (!validate()) return;
    const parsed = registrationSchema.safeParse(data);
    if (!parsed.success) return;
    setBusy(true);
    try {
      const result = await send({ data: parsed.data });
      setReference(result.reference);
    } catch {
      setErrors({ submit: "השליחה לא הושלמה. הפרטים נשארו בטופס, נסו שוב." });
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return (
      <div className="success-state" role="status">
        <img src="/ok.JPG" alt="ח. סבן — הרשמה בוצעה בהצלחה" width={360} height={360} />
        <h2>הבקשה התקבלה בהצלחה!</h2>
        <p>הפרטים הועברו לח. סבן לטיפול ובדיקת כרטיס הלקוח.</p>
        <p>
          מספר פנייה: <b dir="ltr">{reference}</b>
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setData(initial as Draft);
            setStep(0);
            setTouched({});
            setErrors({});
            setReference("");
          }}
        >
          שליחת בקשה נוספת
        </Button>
      </div>
    );
  }

  const activeMessage = stepGuidance.messages[tickerIdx] ?? stepGuidance.messages[0];

  return (
    <div className="registration-layout">
      <aside className="registration-aside">
        <span className="eyebrow">מתחילים לבנות יחד</span>
        <h2>
          הפרויקט שלכם.
          <br />
          החומרים שלנו.
        </h2>
        <p>כל הפרטים במקום אחד, כדי שנוכל לדאוג לאספקה שמתאימה בדיוק לכם.</p>
        <div className="aside-checks">
          {[
            "כרטיס לקוח אישי ומסודר",
            "תיאום אספקה עד הבית או האתר",
            "שירות לקבלנים וללקוחות פרטיים",
          ].map((t) => (
            <div key={t}>
              <Check size={18} />
              {t}
            </div>
          ))}
        </div>
        <div className="aside-note">
          <ShieldCheck size={24} />
          <div>
            <strong>הפרטים שלכם בידיים טובות</strong>
            <p>המידע משמש לטיפול בבקשה ולתיאום השירות.</p>
          </div>
        </div>
        <span className="aside-year">בונים אמון מאז 1994</span>
      </aside>

      <div className="form-area">
        {/* פס התקדמות ויזואלי עם אחוזים והודעות מתחלפות */}
        <div className="progress-panel" aria-live="polite">
          <div className="progress-header">
            <div className="progress-meta">
              <strong>התקדמות מילוי הטופס</strong>
              <span>
                אומתו {completedRequiredCount} מתוך {REQUIRED_KEYS.length} שדות חובה
              </span>
            </div>
            <span
              className={progressPercent === 100 ? "progress-percent complete" : "progress-percent"}
            >
              {progressPercent}%
            </span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="אחוז השלמת הטופס"
          >
            <div
              className={progressPercent === 100 ? "progress-fill complete" : "progress-fill"}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="progress-ticker">
            <span className="ticker-badge">עדכון בדף</span>
            <p key={`${step}-${tickerIdx}`} className="ticker-text">
              {activeMessage}
            </p>
            <div className="ticker-dots" aria-hidden="true">
              {stepGuidance.messages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  tabIndex={-1}
                  className={idx === tickerIdx ? "ticker-dot active" : "ticker-dot"}
                  onClick={() => setTickerIdx(idx)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="stepper">
          {steps.map((s, i) => (
            <button
              type="button"
              disabled={i > step}
              onClick={() => {
                if (i < step) setStep(i);
              }}
              className={i <= step ? "step active" : "step"}
              key={s}
            >
              <span>{i < step ? <Check size={16} /> : i + 1}</span>
              <b>{s}</b>
            </button>
          ))}
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 2) next();
            else void submit();
          }}
        >
          <div className="form-title">
            <span className="form-title-icon">
              {step === 0 ? <UserRound /> : step === 1 ? <MapPin /> : <UsersRound />}
            </span>
            <div>
              <h3>{steps[step]}</h3>
              <p>
                {step === 0
                  ? "נעים להכיר! נשמח לדעת למי אנחנו בונים."
                  : step === 1
                    ? "לאן מגיעים? פרטים מדויקים עוזרים לתכנן את הפריקה."
                    : "אנשי הקשר שלכם והפרטים האחרונים לפני השליחה."}
              </p>
            </div>
            <span className="step-count">שלב {step + 1} מתוך 3</span>
          </div>

          {/* תיבת הנחיות מילוי עם אפקט הקלדה לכל שלב */}
          <div className="guidance-box" aria-live="polite">
            <div className="guidance-typed">
              <Sparkles size={16} className="guidance-icon" />
              <p>
                {typedText}
                {isTyping && <span className="typing-cursor" aria-hidden="true" />}
              </p>
            </div>
            <div className="guidance-legend">
              <div className="legend-item required">
                <strong>חובה למלא (*):</strong>
                <span>{stepGuidance.requiredList}</span>
              </div>
              <div className="legend-item optional">
                <strong>אופציונלי:</strong>
                <span>{stepGuidance.optionalList}</span>
              </div>
            </div>
          </div>

          {step === 0 && (
            <>
              <div className="customer-types" role="group" aria-label="סוג לקוח">
                {(
                  [
                    { id: "private", label: "לקוח פרטי", icon: UserRound },
                    { id: "business", label: "קבלן / עסק", icon: Building2 },
                  ] as const
                ).map((t) => (
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={data.customerType === t.id}
                    className={data.customerType === t.id ? "type-option selected" : "type-option"}
                    key={t.id}
                    onClick={() => setData((d) => ({ ...d, customerType: t.id }))}
                  >
                    <t.icon size={20} />
                    {t.label}
                    {data.customerType === t.id && <Check size={16} />}
                  </Button>
                ))}
              </div>
              <div className="fields-grid">
                {field("name", data.customerType === "business" ? "שם עסק / שם מלא" : "שם מלא", {
                  required: true,
                  placeholder: "השם שמופיע בחשבונית",
                })}
                {field(
                  "identity",
                  data.customerType === "business" ? "עוסק מורשה / ח.פ" : "תעודת זהות",
                  { required: true, placeholder: "9 ספרות" },
                )}
                {field("mobile", "מספר נייד", {
                  required: true,
                  type: "tel",
                  placeholder: "0501234567",
                })}
                {field("email", "דוא״ל", { type: "email", placeholder: "name@example.com" })}
              </div>
              <details className="extra-fields">
                <summary>
                  פרטי התקשרות נוספים (אופציונלי) <ChevronDown size={16} />
                </summary>
                <div className="fields-grid">
                  {field("phone", "טלפון נוסף", { type: "tel" })}
                  {field("fax", "פקס", { type: "tel" })}
                </div>
              </details>
            </>
          )}

          {step === 1 && (
            <>
              <div className="fields-grid">
                {field("city", "יישוב", { required: true })}
                {field("street", "רחוב", { required: true })}
                <div className="fields-grid">
                  {field("house", "מספר בית", { required: true })}
                  {field("postal", "מיקוד", { required: true, placeholder: "5 או 7 ספרות" })}
                </div>
                <div className="fields-grid">
                  {field("floor", "קומה", { required: true, placeholder: "0 לפריקה בקרקע" })}
                  {field("apartment", "דירה", { required: true, placeholder: "0 לאתר בנייה" })}
                </div>
                {field("pobox", "תיבת דואר")}
                <label className="field">
                  <span className="field-label-row">
                    <span>
                      אופן הפריקה <small className="optional-tag">(אופציונלי)</small>
                    </span>
                    <span className="field-badge-ok">
                      <CheckCircle2 size={13} /> נבחר
                    </span>
                  </span>
                  <select
                    data-valid="true"
                    value={data.unloading}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        unloading: e.target.value as Registration["unloading"],
                      }))
                    }
                  >
                    <option value="coordinate">בתיאום עם הצוות</option>
                    <option value="ground">פריקה בקרקע</option>
                    <option value="crane">משאית מנוף</option>
                    <option value="porter">סבלות</option>
                  </select>
                </label>
              </div>
              <label className="field notes-field">
                <span className="field-label-row">
                  <span>
                    הערות למשלוח / חומרים להצעת מחיר{" "}
                    <small className="optional-tag">(אופציונלי)</small>
                  </span>
                  {data.notes.trim().length > 0 && (
                    <span className="field-badge-ok">
                      <CheckCircle2 size={13} /> נרשם
                    </span>
                  )}
                </span>
                <textarea
                  maxLength={2000}
                  data-valid={data.notes.trim().length > 0 ? "true" : undefined}
                  value={data.notes}
                  onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="גישה למשאית, מיקום הפריקה, סוג וכמות החומרים..."
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <div className="fields-grid">
                {(
                  [
                    ["name", "שם איש קשר"],
                    ["mobile", "נייד איש קשר"],
                    ["role", "תפקיד"],
                    ["email", "דוא״ל איש קשר"],
                  ] as const
                ).map(([key, label]) => {
                  const val = data.contact[key] || "";
                  const isEmail = key === "email";
                  const validEmail = !isEmail || val.trim() === "" || EMAIL_RE.test(val.trim());
                  const hasValue = val.trim().length > 0;
                  return (
                    <label className="field" key={key}>
                      <span className="field-label-row">
                        <span>
                          {label} <small className="optional-tag">(אופציונלי)</small>
                        </span>
                        {hasValue && validEmail && (
                          <span className="field-badge-ok">
                            <CheckCircle2 size={13} /> אושר
                          </span>
                        )}
                      </span>
                      <div className="input-wrap">
                        <input
                          maxLength={255}
                          type={isEmail ? "email" : "text"}
                          data-valid={hasValue && validEmail ? "true" : undefined}
                          aria-invalid={hasValue && !validEmail ? true : undefined}
                          value={val}
                          onChange={(e) =>
                            setData((d) => ({
                              ...d,
                              contact: { ...d.contact, [key]: e.target.value },
                            }))
                          }
                        />
                        {hasValue && validEmail && (
                          <CheckCircle2 className="input-status-icon valid" size={16} />
                        )}
                        {hasValue && !validEmail && (
                          <AlertCircle className="input-status-icon invalid" size={16} />
                        )}
                      </div>
                      {hasValue && !validEmail && (
                        <small className="field-error">כתובת דוא״ל לא תקינה</small>
                      )}
                    </label>
                  );
                })}
              </div>

              <details className="extra-fields">
                <summary>
                  פרטים והרשאות איש קשר (אופציונלי) <ChevronDown size={16} />
                </summary>
                <div className="fields-grid">
                  {(
                    [
                      ["code", "קוד מזהה"],
                      ["extension", "שלוחה"],
                      ["phone", "טלפון"],
                      ["fax", "פקס"],
                      ["skype", "סקייפ"],
                      ["birthdate", "תאריך לידה"],
                      ["gender", "מין"],
                      ["branch", "סניף לקוח"],
                      ["messages", "הודעות"],
                      ["rules", "כללי הרשאות"],
                    ] as const
                  ).map(([key, label]) => {
                    const val = data.contact[key] || "";
                    const hasValue = val.trim().length > 0;
                    return (
                      <label className="field" key={key}>
                        <span>{label}</span>
                        <input
                          type={key === "birthdate" ? "date" : "text"}
                          maxLength={255}
                          data-valid={hasValue ? "true" : undefined}
                          value={val}
                          onChange={(e) =>
                            setData((d) => ({
                              ...d,
                              contact: { ...d.contact, [key]: e.target.value },
                            }))
                          }
                        />
                      </label>
                    );
                  })}
                </div>
                <p className="permission-note">
                  ההרשאות המבוקשות כפופות לאישור החברה ואינן מופעלות עם שליחת הטופס.
                </p>
                <div className="permission-grid">
                  {permissionLabels.map((p) => (
                    <label key={p}>
                      <input
                        type="checkbox"
                        checked={data.requestedPermissions.includes(p)}
                        onChange={(e) =>
                          setData((d) => ({
                            ...d,
                            requestedPermissions: e.target.checked
                              ? [...d.requestedPermissions, p]
                              : d.requestedPermissions.filter((x) => x !== p),
                          }))
                        }
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </details>

              <div className={addressVerified ? "review-line verified" : "review-line"}>
                <span className="review-chip">
                  <UserRound size={16} />
                  <span>{data.name}</span>
                  {getFieldStatus("name", data).valid && (
                    <CheckCircle2 size={14} className="review-ok-icon" />
                  )}
                </span>
                <span className="review-chip">
                  <MapPin size={16} />
                  <span>
                    {data.street} {data.house}, {data.city}
                  </span>
                  {addressVerified && (
                    <span className="address-verified-pill">
                      <CheckCircle2 size={13} /> כתובת אומתה
                    </span>
                  )}
                </span>
              </div>

              <label className={data.consent ? "consent approved" : "consent"}>
                <input
                  type="checkbox"
                  checked={data.consent}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setData((d) => ({ ...d, consent: checked }));
                    if (checked && errors["consent"]) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy["consent"];
                        return copy;
                      });
                    }
                  }}
                />
                <span>
                  אני מאשר/ת שימוש בפרטים לצורך פתיחת כרטיס, טיפול בבקשה ויצירת קשר. <em>*</em>
                  {data.consent && (
                    <small className="consent-ok-inline">
                      <CheckCircle2 size={13} /> אושר
                    </small>
                  )}
                </span>
              </label>
              {errors["consent"] && <p className="field-error">{errors["consent"]}</p>}
            </>
          )}

          <input
            className="honeypot"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            value={data.website}
            onChange={(e) => setData((d) => ({ ...d, website: e.target.value }))}
          />
          {errors["submit"] && (
            <p role="alert" className="field-error">
              {errors["submit"]}
            </p>
          )}

          <div className="form-bottom">
            <span className="required-note">* שדות חובה | יתר השדות אופציונליים</span>
            <div className="form-actions">
              {step > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep((s) => s - 1);
                    setErrors({});
                  }}
                >
                  <ArrowRight />
                  חזרה
                </Button>
              )}
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? <LoaderCircle className="animate-spin" /> : null}
                {step < 2
                  ? "המשך לשלב הבא"
                  : data.kind === "quote"
                    ? "שלח לקבלת הצעת מחיר"
                    : "אישור ופתיחת כרטיס לקוח"}
                {!busy && <ArrowLeft />}
              </Button>
            </div>
          </div>
        </form>

        <div className="request-kind">
          <span>כבר לקוחות שלנו?</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => setData((d) => ({ ...d, kind: d.kind === "update" ? "new" : "update" }))}
          >
            {data.kind === "update" ? "בקשה חדשה" : "עדכון פרטים"}
          </Button>
          <span>או</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => setData((d) => ({ ...d, kind: d.kind === "quote" ? "new" : "quote" }))}
          >
            {data.kind === "quote" ? "חזרה לפתיחת כרטיס" : "בקשת הצעת מחיר"}
          </Button>
        </div>
        {data.kind !== "new" && (
          <p className="mode-note">
            {data.kind === "update"
              ? "בקשת עדכון פרטים — השינוי יבוצע לאחר בדיקה על ידי החברה."
              : "בקשת הצעת מחיר — הוסיפו את החומרים והכמויות בשלב האספקה."}
          </p>
        )}
      </div>
    </div>
  );
}

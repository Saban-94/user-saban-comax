import { useState, type ChangeEvent, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCheck2,
  FileText,
  Landmark,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_RECEIPT_MIME_TYPES,
  BANK_TRANSFER_DETAILS,
  MAX_RECEIPT_BYTES,
  bankReceiptSchema,
} from "@/lib/bank-transfer";
import { uploadBankReceipt } from "@/lib/bank-transfer.functions";
import presenterPhoto from "@/assets/images/saban_presenter_1795065827034.jpg";

export const Route = createFileRoute("/bank-transfer")({
  head: () => ({
    meta: [
      { title: "ח. סבן חומרי בניין | העברה בנקאית והעלאת אסמכתא" },
      {
        name: "description",
        content:
          "פרטי בנק מזרחי-טפחות להעברה בנקאית עבור ח. סבן חומרי בניין (1994) בע״מ והעלאת אסמכתא בנקאית לשיוך להזמנה.",
      },
      { property: "og:title", content: "ח. סבן חומרי בניין — העברה בנקאית" },
      {
        property: "og:description",
        content: "צפייה בפרטי החשבון להעברה בנקאית ושליחת אסמכתא ישירות למחלקת ההזמנות.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BankTransferPage,
});

function MizrahiLogo() {
  return (
    <div className="mizrahi-lockup" aria-label="בנק מזרחי-טפחות (20)">
      <svg
        width="36"
        height="36"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="8" fill="#FFF4EC" />
        <path
          d="M9 28V12H14.5L20 21.5L25.5 12H31V28H26.5V19L21.5 27.5H18.5L13.5 19V28H9Z"
          fill="#FF6200"
        />
        <rect x="9" y="30.5" width="22" height="3" rx="1.5" fill="#002F6C" />
      </svg>
      <div className="mizrahi-text">
        <strong>בנק מזרחי-טפחות</strong>
        <span>קוד בנק 20 · סניף 512</span>
      </div>
    </div>
  );
}

interface UploadedReceiptState {
  reference: string;
  uploadedAt: string;
  customerName: string;
  orderOrPhone: string;
  amount: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  previewDataUrl: string;
  driveUrl: string | null;
  driveSynced: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function BankTransferPage() {
  const sendReceipt = useServerFn(uploadBankReceipt);

  const [copiedField, setCopiedField] = useState<"" | "account" | "all">("");
  const [customerName, setCustomerName] = useState("");
  const [orderOrPhone, setOrderOrPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<{
    fileName: string;
    mimeType: string;
    fileSize: number;
    base64Data: string;
    previewDataUrl: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedReceiptState | null>(null);

  const scrollToUpload = () =>
    document.getElementById("upload-receipt")?.scrollIntoView({ behavior: "smooth" });

  async function copyText(kind: "account" | "all") {
    const text =
      kind === "account"
        ? BANK_TRANSFER_DETAILS.accountNumber
        : `פרטי בנק להעברה: ${BANK_TRANSFER_DETAILS.beneficiary}\nבנק מזרחי (${BANK_TRANSFER_DETAILS.bankCode}) סניף (${BANK_TRANSFER_DETAILS.branchCode}) חשבון ${BANK_TRANSFER_DETAILS.accountNumber}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(kind);
      window.setTimeout(() => setCopiedField(""), 2500);
    } catch {
      setCopiedField("");
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isAllowed = (ALLOWED_RECEIPT_MIME_TYPES as readonly string[]).includes(file.type);
    if (!isAllowed) {
      setSelectedFile(null);
      setError("יש להעלות קובץ תמונה (JPG, PNG, WEBP) או PDF בלבד.");
      return;
    }

    if (file.size > MAX_RECEIPT_BYTES) {
      setSelectedFile(null);
      setError("גודל הקובץ המרבי המותר הוא 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const commaIdx = dataUrl.indexOf(",");
      const base64Data = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : "";
      if (!base64Data) {
        setError("לא ניתן לקרוא את הקובץ שנבחר. נסו קובץ אחר.");
        return;
      }
      setSelectedFile({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        base64Data,
        previewDataUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedFile) {
      setError("יש לבחור קובץ אסמכתא בנקאית לפני ההעלאה.");
      return;
    }

    const parsed = bankReceiptSchema.safeParse({
      customerName,
      orderOrPhone,
      amount,
      notes,
      fileName: selectedFile.fileName,
      mimeType: selectedFile.mimeType,
      fileSize: selectedFile.fileSize,
      base64Data: selectedFile.base64Data,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "יש לבדוק את הפרטים שהוזנו.");
      return;
    }

    setBusy(true);
    try {
      const res = await sendReceipt({ data: parsed.data });
      setUploaded({
        reference: res.reference,
        uploadedAt: res.uploadedAt,
        customerName: parsed.data.customerName,
        orderOrPhone: parsed.data.orderOrPhone,
        amount: parsed.data.amount,
        fileName: selectedFile.fileName,
        mimeType: selectedFile.mimeType,
        fileSize: selectedFile.fileSize,
        previewDataUrl: selectedFile.previewDataUrl,
        driveUrl: res.driveUrl,
        driveSynced: res.driveSynced,
      });
    } catch {
      setError("העלאת האסמכתא לא הושלמה. נסו שוב.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="rtl" className="bank-page">
      <header className="site-header">
        <div className="container bank-header-inner">
          <Link to="/" className="brand-wordmark">
            <img
              className="brand-logo"
              src="/logo94.jpeg"
              width={92}
              height={66}
              alt="ח. סבן חומרי בניין (1994) בע״מ"
            />
            <span>ח. סבן חומרי בניין</span>
          </Link>

          <nav className="bank-nav" aria-label="ניווט ראשי">
            <Link to="/" className="bank-nav-link">
              פתיחת כרטיס לקוח
            </Link>
            <a href="#bank-details" className="bank-nav-link">
              פרטי בנק להעברה
            </a>
            <a href="#upload-receipt" className="bank-nav-link">
              שליחת אסמכתא
            </a>
          </nav>

          <Button onClick={scrollToUpload} className="whitespace-nowrap shrink-0">
            העלאת אסמכתא לדרייב <ArrowLeft />
          </Button>
        </div>
      </header>

      <main>
        <section className="bank-hero-section" id="bank-details">
          <div className="container bank-presenter-grid">
            <div className="presenter-frame">
              <img
                src={presenterPhoto}
                alt="נציגת מחלקת ההזמנות של ח. סבן מציגה את פרטי החשבון להעברה בנקאית"
                className="presenter-photo"
                referrerPolicy="no-referrer"
              />
              <div className="presenter-caption">
                <strong>מחלקת הזמנות — ח. סבן חומרי בניין (1994) בע״מ</strong>
                <span>שירות אישי ושיוך מהיר של העברות להזמנות</span>
              </div>
            </div>

            <div className="bank-details-panel">
              <div className="cobrand-row">
                <img
                  src="/logo94.jpeg"
                  alt="לוגו ח. סבן חומרי בניין"
                  className="cobrand-saban-logo"
                  width={96}
                  height={68}
                />
                <span className="cobrand-divider" aria-hidden="true" />
                <MizrahiLogo />
              </div>

              <h1>העברה בנקאית</h1>
              <p className="bank-subtitle">
                לביצוע העברה בנקאית מהירה עבור הזמנתכם, השתמשו בפרטי החשבון הבאים ולאחר מכן העלו את
                האסמכתא ישירות למחלקת ההזמנות.
              </p>

              <div className="bank-card" aria-label="פרטי חשבון בנק להעברה">
                <div className="bank-card-header">
                  <Landmark size={20} />
                  <span>פרטי בנק להעברה</span>
                </div>

                <div className="bank-beneficiary">
                  <span>מוטב החשבון</span>
                  <strong>{BANK_TRANSFER_DETAILS.beneficiary}</strong>
                </div>

                <div className="bank-numbers-grid">
                  <div className="bank-stat">
                    <span>בנק</span>
                    <strong className="tabular-nums">
                      {BANK_TRANSFER_DETAILS.bankName} ({BANK_TRANSFER_DETAILS.bankCode})
                    </strong>
                  </div>
                  <div className="bank-stat">
                    <span>סניף</span>
                    <strong className="tabular-nums">{BANK_TRANSFER_DETAILS.branchCode}</strong>
                  </div>
                  <div className="bank-stat">
                    <span>חשבון</span>
                    <strong className="tabular-nums">{BANK_TRANSFER_DETAILS.accountNumber}</strong>
                  </div>
                </div>

                <div className="bank-copy-actions">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void copyText("account")}
                    className="whitespace-nowrap shrink-0"
                  >
                    {copiedField === "account" ? <Check size={16} /> : <Copy size={16} />}
                    {copiedField === "account" ? "מספר החשבון הועתק" : "העתקת מספר חשבון"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void copyText("all")}
                    className="whitespace-nowrap shrink-0"
                  >
                    {copiedField === "all" ? <Check size={16} /> : <Copy size={16} />}
                    {copiedField === "all" ? "כל הפרטים הועתקו" : "העתקת כל פרטי הבנק"}
                  </Button>
                </div>
              </div>

              <div className="bank-instruction-bar">
                <FileText size={18} />
                <div>
                  <strong>נא לשלוח אסמכתא בנקאית לשיוך להזמנה</strong>
                  <span>תודה, מחלקת הזמנות</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bank-upload-section" id="upload-receipt">
          <div className="container bank-upload-container">
            <div className="bank-upload-intro">
              <span className="eyebrow">שיוך מהיר להזמנה</span>
              <h2>העלאת אסמכתא בנקאית לדרייב</h2>
              <p>
                לאחר ביצוע ההעברה, צרפו את צילום המסך או קובץ ה-PDF של האסמכתא. המערכת תעלה את המסמך
                לדרייב ותציג מיד אישור העלאה ואת האסמכתא המצורפת מתחתיו.
              </p>
            </div>

            <form className="bank-upload-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
              <div className="fields-grid">
                <label className="field" htmlFor="receipt-customer">
                  <span>
                    שם לקוח / שם עסק <em>*</em>
                  </span>
                  <input
                    id="receipt-customer"
                    type="text"
                    placeholder="השם שמופיע בהזמנה"
                    value={customerName}
                    data-valid={customerName.trim().length > 0 ? "true" : undefined}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </label>

                <label className="field" htmlFor="receipt-order">
                  <span>
                    מספר הזמנה / טלפון לשיוך <em>*</em>
                  </span>
                  <input
                    id="receipt-order"
                    type="text"
                    placeholder="לדוגמה: 0501234567 או הזמנה 4512"
                    value={orderOrPhone}
                    data-valid={orderOrPhone.trim().length >= 2 ? "true" : undefined}
                    onChange={(e) => setOrderOrPhone(e.target.value)}
                  />
                </label>

                <label className="field" htmlFor="receipt-amount">
                  <span>
                    סכום העברה בש״ח <small className="optional-tag">(אופציונלי)</small>
                  </span>
                  <input
                    id="receipt-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="לדוגמה: 3,450"
                    value={amount}
                    data-valid={amount.trim().length > 0 ? "true" : undefined}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>

                <label className="field" htmlFor="receipt-notes">
                  <span>
                    הערות למחלקת הזמנות <small className="optional-tag">(אופציונלי)</small>
                  </span>
                  <input
                    id="receipt-notes"
                    type="text"
                    placeholder="מספר אסמכתא בנקאית / תאריך אספקה"
                    value={notes}
                    data-valid={notes.trim().length > 0 ? "true" : undefined}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
              </div>

              <label
                htmlFor="receipt-file"
                className={selectedFile ? "receipt-dropzone selected" : "receipt-dropzone"}
              >
                <input
                  id="receipt-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                {selectedFile ? (
                  <div className="dropzone-content">
                    <FileCheck2 size={28} className="dropzone-icon-ok" />
                    <strong>{selectedFile.fileName}</strong>
                    <span>{formatBytes(selectedFile.fileSize)} · לחצו כאן להחלפת הקובץ</span>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <UploadCloud size={28} className="dropzone-icon" />
                    <strong>בחרו קובץ אסמכתא בנקאית להעלאה</strong>
                    <span>תמונת מסך (JPG, PNG, WEBP) או מסמך PDF עד 8MB</span>
                  </div>
                )}
              </label>

              {error && (
                <p role="alert" className="bank-error-banner">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </p>
              )}

              <div className="bank-submit-row">
                <span className="required-note">* שדות חובה לשיוך להזמנה</span>
                <Button
                  type="submit"
                  size="lg"
                  disabled={busy}
                  className="whitespace-nowrap shrink-0"
                >
                  {busy ? <LoaderCircle className="animate-spin" /> : <UploadCloud size={18} />}
                  {busy ? "מעלה אסמכתא לדרייב..." : "העלאת אסמכתא לדרייב"}
                </Button>
              </div>
            </form>

            {uploaded && (
              <div className="uploaded-result-block" aria-live="polite">
                {/* שורת אישור עם סימון אישור העלאת מסמך */}
                <div className="receipt-confirm-banner" role="status">
                  <div className="receipt-confirm-title">
                    <CheckCircle2 size={22} />
                    <div>
                      <strong>אישור העלאת מסמך — האסמכתא התקבלה בהצלחה</strong>
                      <span>
                        מספר אסמכתא: <b dir="ltr">{uploaded.reference}</b> · הועלה ב-
                        {uploaded.uploadedAt} · שויך ל-{uploaded.customerName} (
                        {uploaded.orderOrPhone})
                      </span>
                    </div>
                  </div>
                  {uploaded.driveUrl && (
                    <a
                      href={uploaded.driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="drive-link-btn"
                    >
                      צפייה בדרייב <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                {/* הצגת האסמכתא מתחת לשורת האישור */}
                <div className="receipt-preview-card">
                  <div className="receipt-preview-header">
                    <div className="receipt-preview-meta">
                      <Building2 size={18} />
                      <div>
                        <strong>אסמכתא מצורפת: {uploaded.fileName}</strong>
                        <span>
                          {formatBytes(uploaded.fileSize)}
                          {uploaded.amount ? ` · סכום: ${uploaded.amount} ₪` : ""}
                        </span>
                      </div>
                    </div>
                    <span className="receipt-verified-label">
                      <CheckCircle2 size={15} /> מסמך אושר ונשמר
                    </span>
                  </div>

                  <div className="receipt-media-frame">
                    {uploaded.mimeType === "application/pdf" ? (
                      <object
                        data={uploaded.previewDataUrl}
                        type="application/pdf"
                        className="receipt-pdf-viewer"
                        aria-label={`תצוגת אסמכתא ${uploaded.fileName}`}
                      >
                        <p className="pdf-fallback">
                          מסמך PDF ({uploaded.fileName}) נשמר בהצלחה למחלקת ההזמנות.
                        </p>
                      </object>
                    ) : (
                      <img
                        src={uploaded.previewDataUrl}
                        alt={`אסמכתא בנקאית שהועלתה: ${uploaded.fileName}`}
                        className="receipt-image-viewer"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <strong>ח. סבן חומרי בניין (1994) בע״מ</strong>
          <span>
            <Link to="/">פתיחת כרטיס לקוח</Link> · <a href="#bank-details">העברה בנקאית</a>
          </span>
          <span>© 2026 ח. סבן. כל הזכויות שמורות.</span>
        </div>
      </footer>
    </div>
  );
}

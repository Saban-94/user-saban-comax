import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ArrowRight, UserRound, MapPin, UsersRound, Check, ShieldCheck, LoaderCircle, ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registrationSchema, permissionLabels, type Registration } from '@/lib/registration';
import { submitRegistration } from '@/lib/registration.functions';
import successAsset from '@/assets/saban-brand.asset.json';

const steps = ['פרטי לקוח', 'כתובת ואספקה', 'אנשי קשר ואישור'];
const initial = { kind: 'new', customerType: 'private', name: '', identity: '', mobile: '', email: '', city: '', street: '', house: '', postal: '', pobox: '', floor: '', apartment: '', phone: '', fax: '', unloading: 'coordinate', notes: '', contact: {}, requestedPermissions: [], consent: false, website: '' };
type Draft = Omit<Registration, 'consent'> & { consent: boolean };
export function RegistrationForm() {
  const [data, setData] = useState<Draft>(initial as Draft);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');
  const send = useServerFn(submitRegistration);
  function field(key: keyof Draft, label: string, options: { required?: boolean; type?: string; placeholder?: string } = {}) {
    return <label className="field" key={key} htmlFor={key}><span>{label} {options.required && <em>*</em>}</span><input id={key} name={key} type={options.type || 'text'} inputMode={['identity', 'mobile', 'postal'].includes(key) ? 'numeric' : undefined} maxLength={key === 'notes' ? 2000 : 255} value={String(data[key])} placeholder={options.placeholder} aria-invalid={!!errors[key]} onChange={e => setData(d => ({ ...d, [key]: e.target.value }))} />{errors[key] && <small className="field-error">{errors[key]}</small>}</label>;
  }
  function validate(keys?: string[]) {
    const result = registrationSchema.safeParse(data);
    const next: Record<string,string> = {};
    if (!result.success) result.error.issues.forEach(i => { const key = String(i.path[0]); if (!keys || keys.includes(key)) next[key] = i.message; });
    setErrors(next); return Object.keys(next).length === 0;
  }
  function next() {
    if (validate(step === 0 ? ['name','identity','mobile','email'] : ['city','street','house','postal','floor','apartment'])) setStep(s => s + 1);
  }
  async function submit() {
    if (!validate()) return;
    const parsed = registrationSchema.safeParse(data); if (!parsed.success) return;
    setBusy(true);
    try { const result = await send({ data: parsed.data }); setReference(result.reference); }
    catch { setErrors({ submit: 'השליחה לא הושלמה. הפרטים נשארו בטופס, נסו שוב.' }); }
    finally { setBusy(false); }
  }
  if (reference) return <div className="success-state" role="status"><img src={successAsset.url} alt="ח. סבן — הרשמה בוצעה בהצלחה" width={360} height={360} /><h2>הבקשה התקבלה בהצלחה!</h2><p>הפרטים הועברו לח. סבן לטיפול ובדיקת כרטיס הלקוח.</p><p>מספר פנייה: <b dir="ltr">{reference}</b></p><Button variant="outline" onClick={() => { setData(initial as Draft); setStep(0); setReference(''); }}>שליחת בקשה נוספת</Button></div>;
  return <div className="registration-layout">
    <aside className="registration-aside"><span className="eyebrow">מתחילים לבנות יחד</span><h2>הפרויקט שלכם.<br/>החומרים שלנו.</h2><p>כל הפרטים במקום אחד, כדי שנוכל לדאוג לאספקה שמתאימה בדיוק לכם.</p><div className="aside-checks">{['כרטיס לקוח אישי ומסודר','תיאום אספקה עד הבית או האתר','שירות לקבלנים וללקוחות פרטיים'].map(t => <div key={t}><Check size={18}/>{t}</div>)}</div><div className="aside-note"><ShieldCheck size={24}/><div><strong>הפרטים שלכם בידיים טובות</strong><p>המידע משמש לטיפול בבקשה ולתיאום השירות.</p></div></div><span className="aside-year">בונים אמון מאז 1994</span></aside>
    <div className="form-area"><div className="stepper">{steps.map((s,i) => <div className={i <= step ? 'step active' : 'step'} key={s}><span>{i < step ? <Check size={16}/> : i+1}</span><b>{s}</b></div>)}</div>
      <form noValidate onSubmit={e => { e.preventDefault(); if (step < 2) next(); else void submit(); }}>
        <div className="form-title"><span className="form-title-icon">{step === 0 ? <UserRound/> : step === 1 ? <MapPin/> : <UsersRound/>}</span><div><h3>{steps[step]}</h3><p>{step === 0 ? 'נעים להכיר! נשמח לדעת למי אנחנו בונים.' : step === 1 ? 'לאן מגיעים? פרטים מדויקים עוזרים לתכנן את הפריקה.' : 'אנשי הקשר שלכם והפרטים האחרונים לפני השליחה.'}</p></div><span className="step-count">שלב {step+1} מתוך 3</span></div>
        {step === 0 && <><div className="customer-types" role="group" aria-label="סוג לקוח">{([{id:'private',label:'לקוח פרטי',icon:UserRound},{id:'business',label:'קבלן / עסק',icon:Building2}] as const).map(t => <Button type="button" variant="outline" aria-pressed={data.customerType === t.id} className={data.customerType === t.id ? 'type-option selected' : 'type-option'} key={t.id} onClick={() => setData(d => ({...d, customerType:t.id}))}><t.icon size={20}/>{t.label}{data.customerType === t.id && <Check size={16}/>}</Button>)}</div><div className="fields-grid">{field('name', data.customerType === 'business' ? 'שם עסק / שם מלא' : 'שם מלא', {required:true, placeholder:'השם שמופיע בחשבונית'})}{field('identity',data.customerType === 'business' ? 'עוסק מורשה / ח.פ' : 'תעודת זהות',{required:true,placeholder:'9 ספרות'})}{field('mobile','מספר נייד',{required:true,type:'tel',placeholder:'0501234567'})}{field('email','דוא״ל',{type:'email',placeholder:'name@example.com'})}</div><details className="extra-fields"><summary>פרטי התקשרות נוספים <ChevronDown size={16}/></summary><div className="fields-grid">{field('phone','טלפון נוסף',{type:'tel'})}{field('fax','פקס',{type:'tel'})}</div></details></>}
        {step === 1 && <><div className="fields-grid">{field('city','יישוב',{required:true})}{field('street','רחוב',{required:true})}<div className="fields-grid">{field('house','מספר בית',{required:true})}{field('postal','מיקוד',{required:true})}</div><div className="fields-grid">{field('floor','קומה',{required:true,placeholder:'0 לפריקה בקרקע'})}{field('apartment','דירה',{required:true,placeholder:'0 לאתר בנייה'})}</div>{field('pobox','תיבת דואר')}<label className="field"><span>אופן הפריקה</span><select value={data.unloading} onChange={e => setData(d => ({...d,unloading:e.target.value as Registration['unloading']}))}><option value="coordinate">בתיאום עם הצוות</option><option value="ground">פריקה בקרקע</option><option value="crane">משאית מנוף</option><option value="porter">סבלות</option></select></label></div><label className="field notes-field"><span>הערות למשלוח / חומרים להצעת מחיר</span><textarea maxLength={2000} value={data.notes} onChange={e => setData(d => ({...d,notes:e.target.value}))} placeholder="גישה למשאית, מיקום הפריקה, סוג וכמות החומרים..."/></label></>}
        {step === 2 && <><div className="fields-grid">{([['name','שם איש קשר'],['mobile','נייד איש קשר'],['role','תפקיד'],['email','דוא״ל איש קשר']] as const).map(([key,label]) => <label className="field" key={key}><span>{label}</span><input maxLength={255} value={data.contact[key] || ''} onChange={e => setData(d => ({...d,contact:{...d.contact,[key]:e.target.value}}))}/></label>)}</div><details className="extra-fields"><summary>פרטים והרשאות איש קשר <ChevronDown size={16}/></summary><div className="fields-grid">{([['code','קוד מזהה'],['extension','שלוחה'],['phone','טלפון'],['fax','פקס'],['skype','סקייפ'],['birthdate','תאריך לידה'],['gender','מין'],['branch','סניף לקוח'],['messages','הודעות'],['rules','כללי הרשאות']] as const).map(([key,label]) => <label className="field" key={key}><span>{label}</span><input type={key === 'birthdate' ? 'date' : 'text'} maxLength={255} value={data.contact[key] || ''} onChange={e => setData(d => ({...d,contact:{...d.contact,[key]:e.target.value}}))}/></label>)}</div><p className="permission-note">ההרשאות המבוקשות כפופות לאישור החברה ואינן מופעלות עם שליחת הטופס.</p><div className="permission-grid">{permissionLabels.map(p => <label key={p}><input type="checkbox" checked={data.requestedPermissions.includes(p)} onChange={e => setData(d => ({...d,requestedPermissions:e.target.checked ? [...d.requestedPermissions,p] : d.requestedPermissions.filter(x => x !== p)}))}/>{p}</label>)}</div></details><div className="review-line"><UserRound size={18}/><span>{data.name}</span><MapPin size={18}/><span>{data.street} {data.house}, {data.city}</span></div><label className="consent"><input type="checkbox" checked={data.consent} onChange={e => setData(d => ({...d,consent:e.target.checked}))}/><span>אני מאשר/ת שימוש בפרטים לצורך פתיחת כרטיס, טיפול בבקשה ויצירת קשר.</span></label>{errors['consent'] && <p className="field-error">{errors['consent']}</p>}</>}
        <input className="honeypot" tabIndex={-1} aria-hidden="true" autoComplete="off" value={data.website} onChange={e => setData(d => ({...d,website:e.target.value}))}/>
        {errors['submit'] && <p role="alert" className="field-error">{errors['submit']}</p>}
        <div className="form-bottom"><span className="required-note">* שדות חובה</span><div className="form-actions">{step > 0 && <Button type="button" variant="ghost" onClick={() => {setStep(s => s-1);setErrors({});}}><ArrowRight/>חזרה</Button>}<Button type="submit" size="lg" disabled={busy}>{busy ? <LoaderCircle className="animate-spin"/> : null}{step < 2 ? 'המשך לשלב הבא' : data.kind === 'quote' ? 'שלח לקבלת הצעת מחיר' : 'אישור ופתיחת כרטיס לקוח'}{!busy && <ArrowLeft/>}</Button></div></div>
      </form>
      <div className="request-kind"><span>כבר לקוחות שלנו?</span><Button variant="link" size="sm" onClick={() => setData(d => ({...d,kind:d.kind === 'update' ? 'new' : 'update'}))}>{data.kind === 'update' ? 'בקשה חדשה' : 'עדכון פרטים'}</Button><span>או</span><Button variant="link" size="sm" onClick={() => setData(d => ({...d,kind:d.kind === 'quote' ? 'new' : 'quote'}))}>{data.kind === 'quote' ? 'חזרה לפתיחת כרטיס' : 'בקשת הצעת מחיר'}</Button></div>{data.kind !== 'new' && <p className="mode-note">{data.kind === 'update' ? 'בקשת עדכון פרטים — השינוי יבוצע לאחר בדיקה על ידי החברה.' : 'בקשת הצעת מחיר — הוסיפו את החומרים והכמויות בשלב האספקה.'}</p>}
    </div>
  </div>;
}
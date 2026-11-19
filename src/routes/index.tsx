import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Truck,
  HardHat,
  ShieldCheck,
  Package,
  Forklift,
  Blocks,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegistrationForm } from "@/components/registration-form";
import hero from "@/assets/construction-yard.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ח. סבן חומרי בניין | פתיחת כרטיס לקוח ואספקה לפרויקט" },
      {
        name: "description",
        content:
          "פתיחת כרטיס לקוח, עדכון פרטים ובקשת הצעת מחיר בח. סבן חומרי בניין (1994) בע״מ. חומרי בנייה ואספקה לבית ולאתר.",
      },
      { property: "og:title", content: "ח. סבן חומרי בניין — בונים יחד מאז 1994" },
      {
        property: "og:description",
        content: "כל הפרטים לפתיחת כרטיס לקוח ותיאום אספקת חומרי בניין במקום אחד.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const scrollToForm = () =>
    document.getElementById("registration")?.scrollIntoView({ behavior: "smooth" });
  return (
    <div dir="rtl">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand-block">
            <img
              className="brand-logo"
              src="/logo94.jpeg"
              width={105}
              height={76}
              alt="ח. סבן חומרי בניין (1994) בע״מ"
            />
            <div className="brand-caption">
              חומרי בניין. אנשים. אמון.
              <br />
              השותפים שלכם לכל פרויקט.
            </div>
          </div>
          <div className="header-actions">
            <span className="header-link">בונים איתכם מאז 1994</span>
            <Button onClick={scrollToForm} variant="outline">
              פתיחת כרטיס לקוח <ArrowLeft />
            </Button>
          </div>
        </div>
      </header>
      <main>
        <section className="hero">
          <img
            className="hero-photo"
            src={hero}
            alt="המחשת חומרי בניין ומשאית מנוף במגרש אספקה"
            width={1920}
            height={1024}
          />
          <div className="container hero-inner">
            <span className="eyebrow">חומרים טובים. בסיס חזק.</span>
            <h1>
              ח. סבן חומרי בניין<span>מהיסודות ועד הגמר.</span>
            </h1>
            <p>
              חומרי בניין איכותיים, שירות אישי ואספקה עד האתר.
              <br />
              אתם מתכננים את הפרויקט. אנחנו דואגים לחומרים.
            </p>
            <div className="hero-cta">
              <Button size="lg" onClick={scrollToForm}>
                בואו נבנה יחד <ArrowLeft />
              </Button>
              <span>ללקוחות פרטיים, קבלנים ואנשי מקצוע</span>
            </div>
          </div>
        </section>
        <section className="benefits" aria-label="השירות שלנו">
          <div className="container benefit-row">
            {[
              { icon: Truck, title: "אספקה עד האתר", text: "משאיות מנוף ופתרונות פריקה" },
              { icon: Blocks, title: "כל החומרים במקום אחד", text: "מהבנייה והשיפוץ ועד הגמר" },
              { icon: HardHat, title: "אנשים שמבינים בנייה", text: "שירות אישי וייעוץ מקצועי" },
              { icon: ShieldCheck, title: "בונים אמון מאז 1994", text: "ניסיון שעובד בשבילכם" },
            ].map((x) => (
              <div className="benefit" key={x.title}>
                <x.icon />
                <div>
                  <strong>{x.title}</strong>
                  <span>{x.text}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="container registration-section" id="registration">
          <div className="section-heading">
            <h2>פותחים כרטיס. מתחילים לבנות.</h2>
            <p>השאירו פרטים לפתיחת כרטיס לקוח, עדכון פרטים או קבלת הצעת מחיר.</p>
          </div>
          <RegistrationForm />
        </section>
        <section className="logistics">
          <div className="container">
            <h2 className="logistics-heading">לפני שהמשאית יוצאת לדרך</h2>
            <div className="logistics-grid">
              {[
                {
                  icon: Forklift,
                  title: "הובלה ופריקה בתיאום אישי",
                  text: "פרטי הגישה, הקומה והדירה עוזרים לנו להתאים את ההובלה ופתרון הפריקה. אופן הפריקה ועלויות ההובלה ייקבעו בתיאום עם הצוות.",
                },
                {
                  icon: Package,
                  title: "חומרי בניין לכל שלב",
                  text: "בלות, שקים, לוחות גבס וחומרי בניין לפרויקט שלכם. הוסיפו בבקשה את סוג החומרים והכמויות לקבלת הצעת מחיר מותאמת.",
                },
                {
                  icon: RotateCcw,
                  title: "בלות, משטחים ופיקדונות",
                  text: "ייתכן פיקדון על בלות ומשטחים. סכום הפיקדון, תנאי ההחזרה למגרש והזיכוי יתואמו עם הצוות בעת ההזמנה.",
                },
              ].map((x) => (
                <div className="logistics-item" key={x.title}>
                  <x.icon size={25} />
                  <div>
                    <h3>{x.title}</h3>
                    <p>{x.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <strong>ח. סבן חומרי בניין (1994) בע״מ</strong>
          <span>חומרי בניין • אספקה • שירות אישי</span>
          <span>© 2026 ח. סבן. כל הזכויות שמורות.</span>
        </div>
      </footer>
    </div>
  );
}

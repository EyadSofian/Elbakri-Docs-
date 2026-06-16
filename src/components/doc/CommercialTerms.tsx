import { DocFooter, DocHeader } from "./DocChrome";
import type { Lang } from "@/lib/i18n";

type TermsDocumentType = "invoice" | "voucher";

const termsCopy = {
  en: {
    bismillah: "In the name of Allah, the Most Gracious, the Most Merciful",
    title: "Terms & Conditions",
    subtitle: {
      invoice: "Invoice terms",
      voucher: "Voucher terms",
    },
    items: [
      "The client confirms that all submitted information and documents are accurate and bears full responsibility for any errors or omissions.",
      "Hotel changes may be requested up to 14 days before the travel date, subject to availability and any applicable rate differences.",
      "Seat selection on the bus is not permitted. Seats are assigned according to the company's operational arrangements.",
      "Hotel check-in time is 2:00 PM and check-out time is 12:00 PM, or according to the hotel's policy.",
      "Room location, floor, view, and room allocation are determined solely by the hotel management.",
      "The client must provide copies of ID cards or passports for all travelers aged 16 and above, and birth certificates for children under 16.",
      "If the required documents proving marital status are not provided, the hotel may refuse accommodation without any liability on the company.",
      "The client is responsible for reviewing all booking details upon receipt. Any amendments after confirmation are subject to supplier policies and applicable fees.",
      "Special requests such as connecting rooms, specific views, floors, or bed types are subject to hotel availability and cannot be guaranteed.",
      "The company acts as an intermediary between the client and service providers including hotels, airlines, and transportation companies. The cancellation and amendment policies of the respective service provider shall apply.",
      "The client must adhere to all scheduled meeting and departure times. The company is not responsible for any missed services resulting from the client's delay.",
      "The client shall not be entitled to compensation for any service not utilized due to personal reasons, delays, or errors attributable to the client.",
    ],
  },
  ar: {
    bismillah: "بسم الله الرحمن الرحيم",
    title: "الشروط والأحكام",
    subtitle: {
      invoice: "شروط الفاتورة",
      voucher: "شروط الفاوتشر",
    },
    items: [
      "يقر العميل بصحة جميع البيانات والمستندات المقدمة، ويتحمل مسؤولية أي خطأ أو نقص بها.",
      "يمكن طلب استبدال الفندق قبل موعد السفر بـ 14 يومًا على الأقل وفقًا للتوافر وفروق الأسعار إن وجدت.",
      "لا يحق للعميل اختيار أو حجز مقعد محدد بالباص، ويتم توزيع المقاعد وفقًا لتنظيم الشركة.",
      "موعد دخول الفندق الساعة 2:00 مساءً والخروج الساعة 12:00 ظهرًا أو طبقًا لسياسة الفندق.",
      "يتم تحديد موقع الغرفة والطابق والإطلالة بواسطة إدارة الفندق فقط.",
      "يلتزم العميل بتقديم صور البطاقات أو جوازات السفر للأفراد فوق 16 عامًا، وصور شهادات الميلاد للأطفال الأقل من 16 عامًا.",
      "في حالة عدم تقديم المستندات المطلوبة لإثبات العلاقة الزوجية، يحق للفندق رفض التسكين دون أي مسؤولية على الشركة.",
      "يلتزم العميل بمراجعة بيانات الحجز فور استلامها، وأي تعديل بعد التأكيد يخضع لسياسة ورسوم المورد.",
      "الطلبات الخاصة مثل غرف متجاورة أو إطلالة معينة أو دور محدد أو نوع سرير معين تخضع لتوافر الفندق وغير مضمونة.",
      "الشركة وسيط بين العميل ومقدمي الخدمات من فنادق وطيران ونقل، وتطبق شروط وسياسات الإلغاء والتعديل الخاصة بمقدم الخدمة.",
      "يلتزم العميل بمواعيد التجمع والتحركات المحددة بالبرنامج، والشركة غير مسؤولة عن أي خدمة مفقودة نتيجة التأخير من جانب العميل.",
      "لا يحق للعميل المطالبة بأي تعويض عن الخدمات التي لم يستفد منها بسبب ظروف أو أخطاء خاصة به.",
    ],
  },
} as const;

const paymentCopy = {
  en: {
    title: "Payment Methods",
    items: [
      "At the company office.",
      "Company account deposit or bank transfer: 100067884633, ELBAKRI OVER SEAS.",
      "InstaPay: 01147515456, MAHMOUD SAEED. InstaPay: 01115596215, AHMED ELBAKRI.",
      "Electronic wallet: 01115596215, AHMED ELBAKRI, plus 1%.",
      "Installment and payment partners: Valu, Souhoola, Contact, Tru, Aman, Clever, Halan, and Fawry Card.",
      "Visa, National Bank of Egypt, Apple Pay, Meeza, or payment link.",
    ],
  },
  ar: {
    title: "طرق الدفع",
    items: [
      "عن طريق مقر الشركة.",
      "عن طريق حساب الشركة إيداع أو تحويل: 100067884633، ELBAKRI OVER SEAS.",
      "عن طريق إنستا باي: 01147515456، MAHMOUD SAEED. إنستا باي: 01115596215، AHMED ELBAKRI.",
      "عن طريق محفظة إلكترونية: 01115596215، AHMED ELBAKRI، مع زيادة 1%.",
      "عن طريق فاليو / سهولة / كونتكت / ترو / أمان / كليفر / حالا / كارت فوري.",
      "عن طريق فيزا / البنك الأهلي / Apple Pay / ميزة / لينك دفع.",
    ],
  },
} as const;

export function TermsPage({
  lang = "en",
  documentType = "invoice",
}: {
  lang?: Lang;
  documentType?: TermsDocumentType;
}) {
  const copy = termsCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div className="doc-sheet terms-sheet pdf-avoid-break" dir={dir}>
      <DocHeader title={copy.title} subtitle={copy.subtitle[documentType]} lang={lang} />
      <div className="terms-bismillah">{copy.bismillah}</div>
      <ol className="terms-list">
        {copy.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <DocFooter lang={lang} />
    </div>
  );
}

export function PaymentMethodsBox({ lang = "en" }: { lang?: Lang }) {
  const copy = paymentCopy[lang];

  return (
    <div className="payment-methods-box pdf-avoid-break">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{copy.title}</div>
      <ul>
        {copy.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

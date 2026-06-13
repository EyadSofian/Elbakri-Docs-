import { DocHeader, DocFooter } from "./DocChrome";
import type { Voucher } from "@/lib/storage";
import { formatDate, nightsBetween } from "@/lib/format";
import { tt, type Lang } from "@/lib/i18n";

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <tr className="border-t border-neutral-200">
      <td className="bg-neutral-50 font-semibold doc-navy text-[10.5px] uppercase tracking-wide w-44">{label}</td>
      <td className="text-[11px]">{value}</td>
    </tr>
  );
}

export function VoucherPreview({ voucher, lang = "en" }: { voucher: Voucher; lang?: Lang }) {
  const t = tt(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const nights = nightsBetween(voucher.checkIn, voucher.checkOut);
  return (
    <div className="doc-sheet" dir={dir}>
      <DocHeader
        title={t.reservationVoucher}
        subtitle={t.hotelServiceVoucher}
        number={voucher.number}
        date={formatDate(voucher.date)}
        lang={lang}
      />

      <table className="border border-neutral-200 rounded overflow-hidden text-[11px]">
        <tbody>
          <Row label={t.serviceType} value={voucher.serviceType.toUpperCase()} />
          <Row label={t.serviceProvider} value={`${voucher.providerName}${voucher.hotelRating ? ` (${voucher.hotelRating}★)` : ""}`} />
          <Row label={t.address} value={voucher.address} />
          <Row label={t.telFax} value={voucher.telFax} />
          <Row label={t.serviceBookingRef} value={voucher.serviceBookingRef} />
          <Row label={t.multipleBookingRef} value={voucher.multipleBookingRef} />
          <Row label={t.confirmationNumber} value={voucher.confirmationNumber} />
          <Row label={t.guestNames} value={voucher.guestNames} />
          <Row label={t.leaderGuest} value={voucher.leaderGuest} />
          <Row label={t.roomType} value={voucher.roomType} />
          <Row label={t.rateBasis} value={voucher.rateBasis} />
          <Row label={t.specialRemarks} value={voucher.remarks} />
        </tbody>
      </table>

      <div className="mt-4">
        <div className="doc-gold-bg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">{t.reservationSummary}</div>
        <table className="border border-neutral-200 border-t-0 text-[11px]">
          <thead>
            <tr className="bg-neutral-100">
              <th>{t.checkIn}</th>
              <th>{t.checkOut}</th>
              <th>{t.nights}</th>
              <th>{t.rooms}</th>
              <th>{t.adults}</th>
              <th>{t.children}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-neutral-200 text-center">
              <td className="font-semibold">{formatDate(voucher.checkIn)}</td>
              <td className="font-semibold">{formatDate(voucher.checkOut)}</td>
              <td>{nights}</td>
              <td>{voucher.numberOfRooms}</td>
              <td>{voucher.adults}</td>
              <td>{voucher.children}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {(voucher.checkInOutTimes || voucher.checkInRestrictions || voucher.ageRequirements || voucher.petsPolicy ||
        voucher.frontDeskNotes || voucher.identificationRequirements || voucher.childrenExtraBedPolicy || voucher.diningNotes) && (
        <div className="mt-4">
          <div className="doc-navy-bg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">{t.hotelInfoPolicies}</div>
          <table className="border border-neutral-200 border-t-0 text-[11px] w-full">
            <tbody>
              <Row label="Check-in / out" value={voucher.checkInOutTimes} />
              <Row label="Restrictions" value={voucher.checkInRestrictions} />
              <Row label="Age" value={voucher.ageRequirements} />
              <Row label="Pets" value={voucher.petsPolicy} />
              <Row label="Front Desk" value={voucher.frontDeskNotes} />
              <Row label="Identification" value={voucher.identificationRequirements} />
              <Row label="Children / Extra Bed" value={voucher.childrenExtraBedPolicy} />
              <Row label="Dining" value={voucher.diningNotes} />
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 p-3 border-l-4 border-amber-500 bg-amber-50 text-[10px] text-neutral-700">
        {voucher.finalTerms || t.voucherDefaultTerms}
      </div>

      <DocFooter lang={lang} />
    </div>
  );
}

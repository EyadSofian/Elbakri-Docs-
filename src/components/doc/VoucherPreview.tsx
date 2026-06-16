import { DocHeader, DocFooter } from "./DocChrome";
import { SERVICE_TYPES, type ServiceItem, type Voucher } from "@/lib/storage";
import { formatDate, nightsBetween } from "@/lib/format";
import { tt, rateBasisLabel, type Lang } from "@/lib/i18n";
import { TermsPage } from "@/components/doc/CommercialTerms";

const serviceLabel = (type: string) =>
  SERVICE_TYPES.find((service) => service.value === type)?.label ?? type;

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <tr className="border-t border-neutral-200">
      <td className="bg-neutral-50 font-semibold doc-navy text-[10.5px] uppercase tracking-wide w-44">
        {label}
      </td>
      <td className="text-[11px] whitespace-pre-line">{value}</td>
    </tr>
  );
}

function legacyVoucherItems(voucher: Voucher): ServiceItem[] {
  return [
    {
      id: "legacy-voucher-service",
      type: voucher.serviceType,
      description: voucher.remarks || "",
      passengerName: voucher.leaderGuest || voucher.guestNames || "",
      bookingRef: voucher.serviceBookingRef || "",
      supplierRef: voucher.confirmationNumber || voucher.multipleBookingRef || "",
      startDate: voucher.checkIn || "",
      endDate: voucher.checkOut || "",
      quantity: 1,
      unit: "",
      unitPrice: 0,
      total: 0,
      notes: voucher.remarks || "",
      meta: {
        hotelName: voucher.providerName || "",
        rating: voucher.hotelRating || 0,
        address: voucher.address || "",
        roomType: voucher.roomType || "",
        rooms: voucher.numberOfRooms || 1,
        adults: voucher.adults || 2,
        children: voucher.children || 0,
        checkIn: voucher.checkIn || "",
        checkOut: voucher.checkOut || "",
        board: voucher.rateBasis || "",
      },
    },
  ];
}

function itemSummary(item: ServiceItem) {
  const meta = item.meta || {};
  const parts: string[] = [];

  if (item.type === "hotel") {
    if (meta.hotelName)
      parts.push(`${meta.hotelName}${meta.rating ? ` (${meta.rating} star)` : ""}`);
    if (meta.roomType) parts.push(`${meta.rooms || 1} x ${meta.roomType}`);
    if (meta.checkIn || meta.checkOut) {
      parts.push(
        `${formatDate(meta.checkIn || item.startDate)} to ${formatDate(meta.checkOut || item.endDate)}`,
      );
    }
    if (meta.board) parts.push(meta.board);
  } else if (item.type === "transfer") {
    if (meta.transferType) parts.push(meta.transferType);
    if (meta.from || meta.to) parts.push(`${meta.from || "?"} to ${meta.to || "?"}`);
    if (meta.date) parts.push(formatDate(meta.date));
    if (meta.time) parts.push(meta.time);
    if (meta.vehicle) parts.push(meta.vehicle);
  } else if (item.type === "flight") {
    if (meta.airline) parts.push(meta.airline);
    if (meta.route) parts.push(meta.route);
    if (meta.pnr) parts.push(`PNR ${meta.pnr}`);
    if (meta.ticket) parts.push(`Ticket ${meta.ticket}`);
    if (meta.departure) parts.push(formatDate(meta.departure));
  } else if (item.type === "tour") {
    if (meta.tourName) parts.push(meta.tourName);
    if (meta.city) parts.push(meta.city);
    if (meta.tourDate) parts.push(formatDate(meta.tourDate));
    if (meta.pickup) parts.push(`Pickup ${meta.pickup}`);
  } else if (item.type === "activity") {
    if (meta.activityName) parts.push(meta.activityName);
    if (meta.location) parts.push(meta.location);
    if (meta.date) parts.push(formatDate(meta.date));
    if (meta.time) parts.push(meta.time);
  } else if (item.type === "visa") {
    if (meta.country) parts.push(meta.country);
    if (meta.visaType) parts.push(meta.visaType);
    if (meta.appRef) parts.push(`Application ${meta.appRef}`);
    if (meta.status) parts.push(meta.status);
  } else if (item.type === "package") {
    if (meta.packageName) parts.push(meta.packageName);
    if (meta.destination) parts.push(meta.destination);
    if (meta.departure || meta.returnDate) {
      parts.push(`${formatDate(meta.departure)} to ${formatDate(meta.returnDate)}`);
    }
    if (meta.hotel) parts.push(meta.hotel);
    if (meta.meal) parts.push(meta.meal);
  } else if (item.description) {
    parts.push(item.description);
  }

  return parts.join(" - ");
}

export function VoucherPreview({ voucher, lang = "en" }: { voucher: Voucher; lang?: Lang }) {
  const t = tt(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const nights = nightsBetween(voucher.checkIn, voucher.checkOut);
  const items = voucher.items?.length ? voucher.items : legacyVoucherItems(voucher);
  const serviceNames = items.map((item) => serviceLabel(item.type)).join(", ");
  const hasHotelService =
    items.some((item) => item.type === "hotel") || voucher.serviceType === "hotel";

  const ages = (voucher.childrenAges ?? []).filter(
    (age) => age !== null && age !== undefined && String(age) !== "",
  );
  const childrenAgesText =
    voucher.children > 0 && ages.length > 0
      ? ages.map((age) => `${age} ${t.years}`).join(", ")
      : "";

  const showId = voucher.showIdentification !== false;
  const idText = showId
    ? voucher.identificationRequirements?.trim() || t.identificationDefault
    : "";

  const hasPolicies =
    voucher.checkInOutTimes ||
    voucher.checkInRestrictions ||
    voucher.ageRequirements ||
    voucher.petsPolicy ||
    voucher.frontDeskNotes ||
    idText ||
    voucher.childrenExtraBedPolicy ||
    voucher.diningNotes;

  return (
    <>
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
            <Row label={t.serviceType} value={serviceNames || voucher.serviceType.toUpperCase()} />
            <Row
              label={t.serviceProvider}
              value={`${voucher.providerName}${voucher.hotelRating ? ` (${voucher.hotelRating} star)` : ""}`}
            />
            <Row label={t.address} value={voucher.address} />
            <Row label={t.serviceBookingRef} value={voucher.serviceBookingRef} />
            <Row label={t.multipleBookingRef} value={voucher.multipleBookingRef} />
            <Row label={t.confirmationNumber} value={voucher.confirmationNumber} />
            <Row label={t.guestNames} value={voucher.guestNames} />
            <Row label={t.leaderGuest} value={voucher.leaderGuest} />
            <Row label={t.roomType} value={voucher.roomType} />
            <Row label={t.rateBasis} value={rateBasisLabel(voucher.rateBasis, lang)} />
            <Row label={t.childrenAges} value={childrenAgesText} />
            <Row label={t.specialRemarks} value={voucher.remarks} />
          </tbody>
        </table>

        <div className="mt-4">
          <div className="doc-gold-bg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
            Voucher Services
          </div>
          <table className="border border-neutral-200 border-t-0 text-[10.5px]">
            <thead>
              <tr className="bg-neutral-100 text-left">
                <th className="w-8">#</th>
                <th className="w-36">Service</th>
                <th>Details</th>
                <th className="w-36">Guest / Ref</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const details = itemSummary(item);
                return (
                  <tr key={item.id || index} className="border-t border-neutral-200 align-top">
                    <td className="text-neutral-500">{index + 1}</td>
                    <td className="font-semibold doc-navy">{serviceLabel(item.type)}</td>
                    <td>
                      {item.description && (
                        <div className="text-neutral-700">{item.description}</div>
                      )}
                      {details && <div className="text-neutral-600">{details}</div>}
                      {item.notes && (
                        <div className="text-neutral-500 text-[9.5px]">{item.notes}</div>
                      )}
                    </td>
                    <td>
                      {item.passengerName && <div>{item.passengerName}</div>}
                      {item.bookingRef && (
                        <div className="text-neutral-500 text-[9.5px]">
                          Booking {item.bookingRef}
                        </div>
                      )}
                      {item.supplierRef && (
                        <div className="text-neutral-500 text-[9.5px]">
                          Supplier {item.supplierRef}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {hasHotelService && (
          <div className="mt-4">
            <div className="doc-gold-bg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
              {t.reservationSummary}
            </div>
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
        )}

        {hasPolicies && (
          <div className="mt-4">
            <div className="doc-navy-bg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
              {t.hotelInfoPolicies}
            </div>
            <table className="border border-neutral-200 border-t-0 text-[11px] w-full">
              <tbody>
                <Row label="Check-in / out" value={voucher.checkInOutTimes} />
                <Row label="Restrictions" value={voucher.checkInRestrictions} />
                <Row label="Age" value={voucher.ageRequirements} />
                <Row label="Pets" value={voucher.petsPolicy} />
                <Row label="Front Desk" value={voucher.frontDeskNotes} />
                <Row label={t.identificationRequirements} value={idText} />
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
      {voucher.showTerms && <TermsPage lang={lang} documentType="voucher" />}
    </>
  );
}

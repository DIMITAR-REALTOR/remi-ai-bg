// REMI Правен анализ — типове документи, полета за AI извличане и labels.
// Blueprint Гл. 7.4 (Legal Layer). Всеки тип документ има собствена JSON схема
// за extracted_data, попълвана от AI OCR (Gemini vision) и потвърждавана от брокера.

export type LegalDocumentType =
  | "ownership_document"
  | "skitsa"
  | "shema"
  | "encumbrance_cert"
  | "tax_assessment";

export type LegalField = { key: string; label: string; placeholder?: string };

export const LEGAL_DOCUMENT_TYPES: {
  value: LegalDocumentType;
  label: string;
  shortLabel: string;
  fields: LegalField[];
  allowMultiplePerListing: boolean;
  allowAvailableNotUploaded: boolean;
}[] = [
  {
    value: "ownership_document",
    label: "Документ за собственост (нот. акт / договор / съдебно решение)",
    shortLabel: "Документ за собственост",
    allowMultiplePerListing: false,
    allowAvailableNotUploaded: true,
    fields: [
      { key: "doc_subtype", label: "Вид документ", placeholder: "нотариален акт / договор за покупко-продажба / дарение / съдебно решение" },
      { key: "seller_name", label: "Продавач / Прехвърлител" },
      { key: "buyer_name", label: "Купувач / Приобретател" },
      { key: "act_date", label: "Дата на акта", placeholder: "дд.мм.гггг" },
      { key: "acquisition_method", label: "Начин на придобиване", placeholder: "покупко-продажба / дарение / наследство / давност / съдебно решение" },
      { key: "price_eur", label: "Цена по документ" },
      { key: "property_identifier", label: "Идентификатор на имота", placeholder: "кадастрален №" },
      { key: "notary_reference", label: "Том, рег. №, дело" },
    ],
  },
  {
    value: "skitsa",
    label: "Скица",
    shortLabel: "Скица",
    allowMultiplePerListing: true,
    allowAvailableNotUploaded: false,
    fields: [
      { key: "property_identifier", label: "Идентификатор на имота (КИ)" },
      { key: "area_sqm", label: "Площ (кв.м)" },
      { key: "address", label: "Адрес / местност" },
      { key: "purpose", label: "Предназначение", placeholder: "жилищно / земеделско / друго" },
      { key: "borders", label: "Граници / съседи" },
      { key: "issue_date", label: "Дата на издаване", placeholder: "дд.мм.гггг" },
      { key: "issuer", label: "Издател", placeholder: "СГКК/Община" },
    ],
  },
  {
    value: "shema",
    label: "Схема (самостоятелен обект)",
    shortLabel: "Схема",
    allowMultiplePerListing: true,
    allowAvailableNotUploaded: false,
    fields: [
      { key: "property_identifier", label: "Идентификатор на обекта (КИ)" },
      { key: "area_sqm", label: "Площ по схема (кв.м)" },
      { key: "floor_level", label: "Ниво / Етаж" },
      { key: "purpose", label: "Предназначение", placeholder: "жилище / офис / гараж" },
      { key: "adjoining_parts", label: "Прилежащи части", placeholder: "изба, таван, ид. части" },
      { key: "neighbors", label: "Съседни самостоятелни обекти" },
      { key: "issue_date", label: "Дата на издаване", placeholder: "дд.мм.гггг" },
      { key: "issuer", label: "Издател", placeholder: "СГКК" },
    ],
  },
  {
    value: "encumbrance_cert",
    label: "Удостоверение за тежести",
    shortLabel: "Удостоверение за тежести",
    allowMultiplePerListing: true,
    allowAvailableNotUploaded: false,
    fields: [
      { key: "encumbrance_type", label: "Тип тежест", placeholder: "ипотека / възбрана / залог / сервитут / друго" },
      { key: "creditor", label: "Кредитор / бенефициент" },
      { key: "amount", label: "Сума (ако е ипотека)" },
      { key: "registration_date", label: "Дата на вписване", placeholder: "дд.мм.гггг" },
      { key: "status", label: "Статус", placeholder: "активна / заличена" },
      { key: "registration_number", label: "Номер на вписване" },
    ],
  },
  {
    value: "tax_assessment",
    label: "Удостоверение за данъчна оценка",
    shortLabel: "Данъчна оценка",
    allowMultiplePerListing: false,
    allowAvailableNotUploaded: false,
    fields: [
      { key: "property_identifier", label: "Идентификатор на имота (КИ/адрес)" },
      { key: "tax_value", label: "Данъчна оценка (лв.)" },
      { key: "issue_date", label: "Дата на издаване", placeholder: "дд.мм.гггг" },
      { key: "validity", label: "Валидност" },
      { key: "owner_name", label: "Собственик по документа" },
      { key: "issuer", label: "Издател", placeholder: "Общинска данъчна служба" },
    ],
  },
];

export const legalDocTypeLabel = (v: string) =>
  LEGAL_DOCUMENT_TYPES.find((t) => t.value === v)?.label ?? v;
export const legalDocTypeShortLabel = (v: string) =>
  LEGAL_DOCUMENT_TYPES.find((t) => t.value === v)?.shortLabel ?? v;
export const legalDocFields = (v: string) =>
  LEGAL_DOCUMENT_TYPES.find((t) => t.value === v)?.fields ?? [];

export const AVAILABILITY_LABELS: Record<string, string> = {
  uploaded: "Качен",
  available_not_uploaded: "Налично при брокера",
};

// Документ за самоличност — отделна таблица identity_documents, не е част от дропдауна по-горе.
export const IDENTITY_ROLES = ["Продавач", "Купувач", "Пълномощник", "Друго"] as const;

export const IDENTITY_FIELDS: LegalField[] = [
  { key: "full_name", label: "Имена (по документ)" },
  { key: "egn", label: "ЕГН" },
  { key: "document_number", label: "Номер на документ" },
  { key: "valid_until", label: "Валидност", placeholder: "дд.мм.гггг" },
  { key: "role_in_deal", label: "Роля в сделката" },
];

// Маскира ЕГН до последните 4 цифри — пълното се вижда само при expand в UI.
export function maskEgn(egn: string | null | undefined): string {
  if (!egn) return "—";
  const digits = egn.replace(/\s/g, "");
  if (digits.length <= 4) return digits;
  return `••••••${digits.slice(-4)}`;
}

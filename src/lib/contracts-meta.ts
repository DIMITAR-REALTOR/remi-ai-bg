export type ContractType = "preliminary_sale" | "deposit" | "rent" | "commission";

export const CONTRACT_TYPES: {
  value: ContractType;
  label: string;
  shortLabel: string;
  available: boolean;
}[] = [
  { value: "preliminary_sale", label: "Предварителен договор за покупко-продажба", shortLabel: "Предварителен договор", available: true },
  { value: "deposit", label: "Договор за капаро / депозит", shortLabel: "Капаро", available: false },
  { value: "rent", label: "Договор за наем", shortLabel: "Наем", available: false },
  { value: "commission", label: "Комисионен договор брокер-клиент", shortLabel: "Комисионен", available: false },
];

export const contractTypeLabel = (v: string) =>
  CONTRACT_TYPES.find((t) => t.value === v)?.label ?? v;
export const contractTypeShortLabel = (v: string) =>
  CONTRACT_TYPES.find((t) => t.value === v)?.shortLabel ?? v;

export const CONTRACT_STATUSES = [
  { value: "draft", label: "Чернова", tone: "warning" },
  { value: "finalized", label: "Финализиран", tone: "success" },
] as const;

export const contractStatusLabel = (v: string) =>
  CONTRACT_STATUSES.find((s) => s.value === v)?.label ?? v;
export const contractStatusTone = (v: string) =>
  CONTRACT_STATUSES.find((s) => s.value === v)?.tone ?? "muted";

export type PartyData = {
  name: string;
  egn: string;
  address: string;
  id_number: string; // № лична карта
  id_issued_by: string;
  id_issued_on: string; // дата на издаване
  phone: string;
};

export const EMPTY_PARTY: PartyData = {
  name: "", egn: "", address: "", id_number: "", id_issued_by: "", id_issued_on: "", phone: "",
};

export type PreliminarySaleTerms = {
  property_description: string;
  property_address: string;
  area_sqm: string;
  price_eur: string;
  deposit_eur: string;
  balance_due_date: string; // срок за окончателно плащане / нотариален акт
  notary_deadline: string; // краен срок за сключване на нотариален акт
  extra_clauses: string;
};

export const EMPTY_PRELIMINARY_TERMS: PreliminarySaleTerms = {
  property_description: "", property_address: "", area_sqm: "", price_eur: "",
  deposit_eur: "", balance_due_date: "", notary_deadline: "", extra_clauses: "",
};

const fmtDateBg = (iso: string) => {
  if (!iso) return "__________";
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const partyBlock = (p: PartyData, role: string) =>
  `${p.name || "__________"}, ЕГН ${p.egn || "__________"}, с адрес ${p.address || "__________"}, ` +
  `притежаващ(а) лична карта № ${p.id_number || "__________"}, издадена на ${fmtDateBg(p.id_issued_on)} от ${p.id_issued_by || "__________"}, ` +
  `тел. ${p.phone || "__________"} (наричан(а) по-долу „${role}“)`;

/**
 * Генерира текст на предварителен договор за покупко-продажба на недвижим имот
 * по общата практика съгласно чл. 19 от Закона за задълженията и договорите (ЗЗД).
 *
 * ВАЖНО: Това е стандартен ориентировъчен текст, не е изготвен и не е прегледан
 * от юрист. Преди подписване от страните, документът трябва да бъде прегледан
 * от квалифициран юрист или нотариус.
 */
export function generatePreliminarySaleContract(
  seller: PartyData,
  buyer: PartyData,
  terms: PreliminarySaleTerms,
  contractDate: string = new Date().toISOString(),
  cityOfSigning: string = "гр. Варна"
): string {
  return `ПРЕДВАРИТЕЛЕН ДОГОВОР
за покупко-продажба на недвижим имот
(по чл. 19 от Закона за задълженията и договорите)

Днес, ${fmtDateBg(contractDate)}, в ${cityOfSigning}, между:

1. ${partyBlock(seller, "ПРОДАВАЧ")},

и

2. ${partyBlock(buyer, "КУПУВАЧ")},

наричани заедно „Страните“, се сключи настоящият предварителен договор за следното:

ПРЕДМЕТ НА ДОГОВОРА

Чл. 1. ПРОДАВАЧЪТ се задължава да продаде, а КУПУВАЧЪТ се задължава да купи следния недвижим имот:
${terms.property_description || "__________"}, находящ се на адрес: ${terms.property_address || "__________"}, с обща площ ${terms.area_sqm || "____"} кв.м (наричан по-долу „Имота“).

ЦЕНА И НАЧИН НА ПЛАЩАНЕ

Чл. 2. Договорената между Страните цена на Имота е ${terms.price_eur || "__________"} евро.

Чл. 3. При подписване на настоящия договор КУПУВАЧЪТ заплаща на ПРОДАВАЧА капаро/задатък в размер на ${terms.deposit_eur || "__________"} евро, като остатъкът от договорената цена се заплаща в срок до ${fmtDateBg(terms.balance_due_date)}.

СРОК ЗА СКЛЮЧВАНЕ НА ОКОНЧАТЕЛЕН ДОГОВОР

Чл. 4. Страните се задължават да сключат окончателен договор във формата на нотариален акт за прехвърляне на собствеността върху Имота в срок до ${fmtDateBg(terms.notary_deadline)}.

Чл. 5. Всички разходи по прехвърлянето на собствеността (местен данък, такса за вписване, нотариална такса и др.) са за сметка на КУПУВАЧА, освен ако Страните не са уговорили друго.

НЕУСТОЙКИ

Чл. 6. При отказ на КУПУВАЧА да сключи окончателния договор в уговорения срок без основателна причина, платеното капаро остава в полза на ПРОДАВАЧА.

Чл. 7. При отказ на ПРОДАВАЧА да сключи окончателния договор в уговорения срок без основателна причина, той дължи връщане на платеното капаро в двоен размер.

ДОПЪЛНИТЕЛНИ УСЛОВИЯ

${terms.extra_clauses || "Няма допълнителни уговорки."}

ЗАКЛЮЧИТЕЛНИ РАЗПОРЕДБИ

Чл. 8. Настоящият договор се изготви и подписа в два еднообразни екземпляра — по един за всяка от Страните.

Чл. 9. За неуредените в този договор въпроси се прилагат разпоредбите на българското законодателство.


ПРОДАВАЧ: ______________________          КУПУВАЧ: ______________________
            (${seller.name || "__________"})                        (${buyer.name || "__________"})


—
Този документ е генериран автоматично чрез REMI AI и има ориентировъчен характер.
Преди подписване се препоръчва преглед от квалифициран юрист или нотариус.`;
}

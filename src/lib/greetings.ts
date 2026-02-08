export const RELATION_OPTIONS = [
  { value: "", label: "Brak relacji" },
  { value: "babcia", label: "Babcia" },
  { value: "dziadek", label: "Dziadek" },
  { value: "mama", label: "Mama" },
  { value: "tata", label: "Tata" },
  { value: "ciocia", label: "Ciocia" },
  { value: "wujek", label: "Wujek" },
  { value: "siostra", label: "Siostra" },
  { value: "brat", label: "Brat" },
  { value: "przyjaciel", label: "Przyjaciel" },
  { value: "przyjaciolka", label: "Przyjaciółka" },
  { value: "kuzyn", label: "Kuzyn" },
  { value: "kuzynka", label: "Kuzynka" },
  { value: "swiadek", label: "Świadek" },
  { value: "swiadkowa", label: "Świadkowa" },
];

const RELATION_VOCATIVE: Record<string, string> = {
  babcia: "Babciu",
  dziadek: "Dziadku",
  mama: "Mamo",
  tata: "Tato",
  ciocia: "Ciociu",
  wujek: "Wujku",
  siostra: "Siostro",
  brat: "Bracie",
  przyjaciel: "Przyjacielu",
  przyjaciolka: "Przyjaciółko",
  kuzyn: "Kuzynie",
  kuzynka: "Kuzynko",
  swiadek: "Świadku",
  swiadkowa: "Świadkowo",
};

function joinWithAnd(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} i ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} i ${items[items.length - 1]}`;
}

export function buildGreeting(
  guests: Array<{ fullName: string; relation?: string }>
) {
  if (!guests.length) return "Cześć!";

  const allWithRelation = guests.every(
    (guest) => guest.relation && RELATION_VOCATIVE[guest.relation]
  );

  const names = allWithRelation
    ? guests.map((guest) => RELATION_VOCATIVE[guest.relation!])
    : guests.map((guest) => guest.fullName.split(" ")[0]).filter(Boolean);

  const joined = joinWithAnd(names);
  return `Cześć ${joined}!`;
}

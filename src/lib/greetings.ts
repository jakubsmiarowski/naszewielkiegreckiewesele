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

const FEMALE_RELATIONS = new Set([
  "babcia",
  "mama",
  "ciocia",
  "siostra",
  "przyjaciolka",
  "kuzynka",
  "swiadkowa",
]);

const MALE_RELATIONS = new Set([
  "dziadek",
  "tata",
  "wujek",
  "brat",
  "przyjaciel",
  "kuzyn",
  "swiadek",
]);

const MALE_NAMES_ENDING_WITH_A = new Set([
  "kuba",
  "barnaba",
  "bonawentura",
  "kosma",
]);

type Gender = "female" | "male" | "unknown";

function normalizeName(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[^a-ząćęłńóśżź]/gi, "")
    .toLowerCase();
}

function looksLikeFemaleName(value: string) {
  if (!value) return false;
  const normalized = normalizeName(value);
  return Boolean(
    normalized &&
      normalized.endsWith("a") &&
      !MALE_NAMES_ENDING_WITH_A.has(normalized)
  );
}

function estimateGenderFromName(name?: string): Gender {
  return looksLikeFemaleName(name ?? "") ? "female" : "unknown";
}

function getGenderForRelation(relation?: string): Gender {
  if (!relation) return "unknown";
  if (FEMALE_RELATIONS.has(relation)) return "female";
  if (MALE_RELATIONS.has(relation)) return "male";
  return "unknown";
}

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

  const entries = guests
    .map((guest, index) => {
      const relation = guest.relation;
      const vocative =
        relation && RELATION_VOCATIVE[relation]
          ? RELATION_VOCATIVE[relation]
          : undefined;
      const firstName = guest.fullName.split(" ")[0] ?? "";
      const label =
        allWithRelation && vocative ? vocative : firstName || guest.fullName;
      const relationGender = getGenderForRelation(relation);

      return {
        label,
        gender:
          relationGender !== "unknown"
            ? relationGender
            : estimateGenderFromName(firstName),
        index,
      };
    })
    .filter((entry) => Boolean(entry.label));

  if (!entries.length) return "Cześć!";

  const sortRank = (gender: Gender) =>
    gender === "female" ? 0 : gender === "male" ? 1 : 2;

  const sortedEntries = [...entries].sort((a, b) => {
    const aRank = sortRank(a.gender);
    const bRank = sortRank(b.gender);
    if (aRank !== bRank) return aRank - bRank;
    return a.index - b.index;
  });

  const names = sortedEntries.map((entry) => entry.label);
  const joined = joinWithAnd(names);
  return `Cześć ${joined}!`;
}

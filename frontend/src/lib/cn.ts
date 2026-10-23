type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Minimal className joiner — keeps conditional Tailwind classes readable. */
export const cn = (...values: ClassValue[]): string =>
  values
    .flat(Infinity as 1)
    .filter((value): value is string | number => Boolean(value))
    .join(' ');

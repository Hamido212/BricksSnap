import type { ClassLibrary } from "../build";
import { baseClasses } from "../styles";
import type { ResolvedKit } from "../tokens";
import { commonClasses, SECTION_TYPES, type SectionType, type Variant } from "./common";
import { headerVariants, heroVariants } from "./header-hero";
import { featuresVariants, servicesVariants } from "./services";
import { ctaVariants, pricingVariants, testimonialVariants } from "./conversion";
import { footerVariants, moreVariants } from "./more";

export { SECTION_TYPES, type SectionType, type Variant } from "./common";

export const VARIANTS: Variant[] = [
  ...headerVariants, ...heroVariants, ...servicesVariants, ...featuresVariants, ...pricingVariants,
  ...testimonialVariants, ...ctaVariants, ...footerVariants, ...moreVariants,
];

export const isSectionType = (value: unknown): value is SectionType => typeof value === "string" && (SECTION_TYPES as readonly string[]).includes(value);

export function variantsFor(type: SectionType): Variant[] {
  return VARIANTS.filter(v => v.type === type);
}

/** The requested variant, or the type's first one. */
export function findVariant(type: SectionType, id?: string): Variant {
  const list = variantsFor(type);
  const found = list.find(v => v.id === id) ?? list[0];
  if (!found) throw new Error(`No layout for section type ${type}.`);
  return found;
}

/** Every class the kit can emit, for one brand kit. */
export function classLibrary(r: ResolvedKit): ClassLibrary {
  const library: ClassLibrary = { ...baseClasses(r), ...commonClasses(r) };
  for (const factory of new Set(VARIANTS.map(v => v.classes).filter(Boolean))) Object.assign(library, factory!(r));
  return library;
}

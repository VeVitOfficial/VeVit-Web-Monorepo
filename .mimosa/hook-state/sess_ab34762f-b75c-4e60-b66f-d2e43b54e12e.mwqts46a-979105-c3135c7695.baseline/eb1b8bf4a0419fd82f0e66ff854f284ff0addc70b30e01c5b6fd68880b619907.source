// Strom kategorií Services (hlavní kategorie → podkategorie). Server i klient.

export type ServicesCategory = {
  slug: string;
  name_cs: string;
  parent_slug: string | null;
  icon: string;
  description_cs: string;
  sort_order: number;
};

export type CategoryNode = ServicesCategory & { children: ServicesCategory[] };

export function categoryTree(categories: ServicesCategory[]): CategoryNode[] {
  const parents = categories
    .filter((category) => !category.parent_slug)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => ({ ...category, children: [] as ServicesCategory[] }));
  const bySlug = new Map(parents.map((parent) => [parent.slug, parent]));
  for (const category of categories) {
    if (category.parent_slug) bySlug.get(category.parent_slug)?.children.push(category);
  }
  for (const parent of parents) parent.children.sort((a, b) => a.sort_order - b.sort_order);
  return parents;
}

/** Rozbalí výběr: hlavní kategorie zahrnuje všechny své podkategorie. */
export function expandCategories(selected: string[], categories: ServicesCategory[]): string[] {
  const known = new Map(categories.map((category) => [category.slug, category]));
  const result = new Set<string>();
  for (const slug of selected) {
    const category = known.get(slug);
    if (!category) continue;
    result.add(slug);
    if (!category.parent_slug) {
      for (const child of categories) if (child.parent_slug === slug) result.add(child.slug);
    }
  }
  return [...result];
}

/** [hlavní, podkategorie] pro drobečkovou navigaci a štítky. */
export function categoryPath(slug: string, categories: ServicesCategory[]): { parent: ServicesCategory | null; child: ServicesCategory | null } {
  const category = categories.find((item) => item.slug === slug) ?? null;
  if (!category) return { parent: null, child: null };
  if (!category.parent_slug) return { parent: category, child: null };
  return { parent: categories.find((item) => item.slug === category.parent_slug) ?? null, child: category };
}

export function categoryLabel(slug: string, categories: ServicesCategory[]): string {
  const { parent, child } = categoryPath(slug, categories);
  if (child) return child.name_cs;
  return parent?.name_cs ?? slug;
}

export function categoryIcon(slug: string, categories: ServicesCategory[]): string {
  const { parent } = categoryPath(slug, categories);
  return parent?.icon ?? "layers";
}

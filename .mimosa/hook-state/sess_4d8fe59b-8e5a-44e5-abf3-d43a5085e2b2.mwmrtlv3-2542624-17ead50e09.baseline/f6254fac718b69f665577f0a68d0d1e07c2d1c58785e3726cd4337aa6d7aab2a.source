const STEPS = ["Košík", "Doprava a platba", "Údaje", "Platba", "Hotovo"] as const;

/** Progress bar of the checkout. A digital-only cart skips step 2, which is then shown as done. */
export function CheckoutSteps({ current, skipDelivery = false }: { current: 1 | 2 | 3 | 4 | 5; skipDelivery?: boolean }) {
  return (
    <ol className="store-steps" aria-label="Postup objednávky">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const skipped = skipDelivery && number === 2;
        const state = number === current ? "now" : number < current || skipped ? "done" : "";
        return (
          <li key={label} className={`store-step ${state}`} aria-current={number === current ? "step" : undefined}>
            {number} {label}
          </li>
        );
      })}
    </ol>
  );
}

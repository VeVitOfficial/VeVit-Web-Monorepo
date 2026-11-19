// Registr kalkulaček — viz konvence v pdf.ts / index.ts.
// Referenční implementace BMI je zaregistrována jiným agentem; tento soubor
// přidávám (calc batch agent) — bmi-calc nechávám beze změny.
import dynamic from "next/dynamic";
import type { ToolComponent } from "@/components/tools/registry/data";
import { ToolBodySkeleton } from "@/components/tools/tool-skeleton";
const BmiCalc = dynamic(() => import("@/components/tools/tools/bmi-calc"), { loading: ToolBodySkeleton });
const BirthNumberValidator = dynamic(() => import("@/components/tools/tools/birth-number-validator"), { loading: ToolBodySkeleton });
const BmrCalc = dynamic(() => import("@/components/tools/tools/bmr-calc"), { loading: ToolBodySkeleton });
const ColorConverter = dynamic(() => import("@/components/tools/tools/color-converter"), { loading: ToolBodySkeleton });
const CompoundInterestCalc = dynamic(() => import("@/components/tools/tools/compound-interest-calc"), { loading: ToolBodySkeleton });
const DateDiffCalc = dynamic(() => import("@/components/tools/tools/date-diff-calc"), { loading: ToolBodySkeleton });
const DiscountCalc = dynamic(() => import("@/components/tools/tools/discount-calc"), { loading: ToolBodySkeleton });
const FuelConsumptionCalc = dynamic(() => import("@/components/tools/tools/fuel-consumption-calc"), { loading: ToolBodySkeleton });
const GradeAverageCalc = dynamic(() => import("@/components/tools/tools/grade-average-calc"), { loading: ToolBodySkeleton });
const IbanConverter = dynamic(() => import("@/components/tools/tools/iban-converter"), { loading: ToolBodySkeleton });
const LoanCalc = dynamic(() => import("@/components/tools/tools/loan-calc"), { loading: ToolBodySkeleton });
const NetSalaryCalc = dynamic(() => import("@/components/tools/tools/net-salary-calc"), { loading: ToolBodySkeleton });
const NumberBaseConverter = dynamic(() => import("@/components/tools/tools/number-base-converter"), { loading: ToolBodySkeleton });
const PercentageCalc = dynamic(() => import("@/components/tools/tools/percentage-calc"), { loading: ToolBodySkeleton });
const TimeCalc = dynamic(() => import("@/components/tools/tools/time-calc"), { loading: ToolBodySkeleton });
const UnitConverter = dynamic(() => import("@/components/tools/tools/unit-converter"), { loading: ToolBodySkeleton });
const VatCalc = dynamic(() => import("@/components/tools/tools/vat-calc"), { loading: ToolBodySkeleton });

const CALC: Record<string, ToolComponent | undefined> = {
  "bmi-calc": BmiCalc,
  "birth-number-validator": BirthNumberValidator,
  "bmr-calc": BmrCalc,
  "color-converter": ColorConverter,
  "compound-interest-calc": CompoundInterestCalc,
  "date-diff-calc": DateDiffCalc,
  "discount-calc": DiscountCalc,
  "fuel-consumption-calc": FuelConsumptionCalc,
  "grade-average-calc": GradeAverageCalc,
  "iban-converter": IbanConverter,
  "loan-calc": LoanCalc,
  "net-salary-calc": NetSalaryCalc,
  "number-base-converter": NumberBaseConverter,
  "percentage-calc": PercentageCalc,
  "time-calc": TimeCalc,
  "unit-converter": UnitConverter,
  "vat-calc": VatCalc,
};

export default CALC;
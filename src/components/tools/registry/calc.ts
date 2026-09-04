// Registr kalkulaček — viz konvence v pdf.ts / index.ts.
// Referenční implementace BMI je zaregistrována jiným agentem; tento soubor
// přidávám (calc batch agent) — bmi-calc nechávám beze změny.
import type { ToolComponent } from "@/components/tools/registry/data";
import BmiCalc from "@/components/tools/tools/bmi-calc";
import BirthNumberValidator from "@/components/tools/tools/birth-number-validator";
import BmrCalc from "@/components/tools/tools/bmr-calc";
import ColorConverter from "@/components/tools/tools/color-converter";
import CompoundInterestCalc from "@/components/tools/tools/compound-interest-calc";
import DateDiffCalc from "@/components/tools/tools/date-diff-calc";
import DiscountCalc from "@/components/tools/tools/discount-calc";
import FuelConsumptionCalc from "@/components/tools/tools/fuel-consumption-calc";
import GradeAverageCalc from "@/components/tools/tools/grade-average-calc";
import IbanConverter from "@/components/tools/tools/iban-converter";
import LoanCalc from "@/components/tools/tools/loan-calc";
import NetSalaryCalc from "@/components/tools/tools/net-salary-calc";
import NumberBaseConverter from "@/components/tools/tools/number-base-converter";
import PercentageCalc from "@/components/tools/tools/percentage-calc";
import TimeCalc from "@/components/tools/tools/time-calc";
import UnitConverter from "@/components/tools/tools/unit-converter";
import VatCalc from "@/components/tools/tools/vat-calc";

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
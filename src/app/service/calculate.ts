import { Injectable } from '@angular/core';

export type GrantType = 'none' | 'percent' | 'amount';
export type ProductivityMode = 'units' | 'direct';

export interface InvestmentInput {
    // MVP required
    equipmentCost: number;

    // Optional for MVP (defaults to 0 when omitted)
    installationCost?: number;
    integrationCost?: number;
    trainingCost?: number;
    downtimeCost?: number;
    otherUpfrontCosts?: number;
    additionalUpfrontCosts?: number[];
    grantPercent?: number;
    grantAmount?: number;
}

export interface LabourInput {
    // MVP required
    fteReduced: number;
    fullyLoadedAnnualCostPerFte: number;
}

export interface ProductivityInput {
    annualProfitIncrease?: number;
    currentUnitsPerYear?: number;
    productivityGainPercent?: number;
    profitPerUnit?: number;
}

export interface AnnualSavingsInput {
    scrapSavings?: number;
    overtimeSavings?: number;
    qualityWarrantySavings?: number;
    otherSavings?: number;
    additionalSavings?: number[];
}

export interface AnnualCostsInput {
    maintenanceCost?: number;
    softwareSubscription?: number;
    energyDelta?: number;
    otherAnnualCosts?: number;
    additionalAnnualCosts?: number[];
}

export interface FinancialInput {
    // MVP required
    timeHorizonYears: number;

    // Optional advanced metric input (only needed if you want NPV)
    discountRate?: number;
}

export interface RoiCalculationInput {
    // Optional label for comparison tables/charts
    optionName?: string;

    // MVP required sections
    investment: InvestmentInput;
    labour: LabourInput;
    // Optional for MVP (defaults to 0 productivity gain)
    productivity?: ProductivityInput;

    // Optional for MVP
    annualSavings?: AnnualSavingsInput;
    annualCosts?: AnnualCostsInput;
    financial: FinancialInput;
}

export interface CumulativeCashFlowPoint {
    year: number;
    cumulativeCashFlow: number;
    discountedCumulativeCashFlow: number | null;
}

export interface RoiCalculationResult {
    optionName: string | null;
    investment: {
        initialInvestment: number;
        // MVP output
        effectiveInvestment: number;
        grantType: GrantType;
        grantAppliedAmount: number;
    };
    annual: {
        labourSavings: number;
        productivityMode: ProductivityMode;
        extraUnitsPerYear: number | null;
        productivityProfit: number;
        otherSavings: number;
        totalBenefits: number;
        operatingCosts: number;
        // MVP output
        netAnnualBenefit: number;
    };
    payback: {
        isAchievable: boolean;
        // MVP output
        paybackYears: number | null;
        // MVP output
        paybackMonths: number | null;
        breakevenYearFromCumulative: number | null;
    };
    horizon: {
        years: number;
        totalNetBenefits: number;
        netProfit: number;
        // MVP output
        roiPercent: number | null;
    };
    npv: {
        discountRate: number | null;
        value: number | null;
    };
    cumulativeCashFlow: CumulativeCashFlowPoint[];
    notes: string[];
}

export interface RankedOption {
    rank: number;
    optionName: string;
    metricValue: number | null;
}

export interface RoiComparisonResult {
    options: RoiCalculationResult[];
    ranking: {
        byFastestPayback: RankedOption[];
        byHighestRoi: RankedOption[];
        byHighestNpv: RankedOption[];
    };
}

export interface SensitivitySnapshot {
    netAnnualBenefit: number;
    paybackYears: number | null;
    roiPercent: number | null;
    npv: number | null;
}

export interface SensitivityScenario {
    low: SensitivitySnapshot;
    base: SensitivitySnapshot;
    high: SensitivitySnapshot;
}

export interface RoiSensitivityResult {
    deltaPercent: number;
    baseCase: SensitivitySnapshot;
    productivityGain: SensitivityScenario;
    labourCostPerFte: SensitivityScenario;
    annualOperatingCosts: SensitivityScenario;
}

interface GrantComputation {
    grantType: GrantType;
    grantAppliedAmount: number;
    effectiveInvestment: number;
}

interface ProductivityComputation {
    mode: ProductivityMode;
    extraUnitsPerYear: number | null;
    annualProductivityProfit: number;
}

@Injectable({
    providedIn: 'root'
})
export class Calculate {
    /*
     * MVP quick start:
     * Required inputs:
     * - investment.equipmentCost
     * - labour.fteReduced
     * - labour.fullyLoadedAnnualCostPerFte
     * - financial.timeHorizonYears
     *
     * First outputs to show in UI:
     * - investment.effectiveInvestment
     * - annual.netAnnualBenefit
     * - payback.paybackYears / payback.paybackMonths
     * - horizon.roiPercent
     */
    calculate(input: RoiCalculationInput): RoiCalculationResult {
        const notes: string[] = [];
        const optionName = this.normalizeOptionName(input.optionName);

        const years = this.normalizeTimeHorizonYears(input.financial.timeHorizonYears, notes);

        const initialInvestment = this.sum([
            this.nonNegative(input.investment.equipmentCost),
            this.nonNegative(input.investment.installationCost),
            this.nonNegative(input.investment.integrationCost),
            this.nonNegative(input.investment.trainingCost),
            this.nonNegative(input.investment.downtimeCost),
            this.nonNegative(input.investment.otherUpfrontCosts),
            this.sumPositiveArray(input.investment.additionalUpfrontCosts)
        ]);

        const grant = this.computeGrant(
            initialInvestment,
            input.investment.grantPercent,
            input.investment.grantAmount,
            notes
        );

        const annualLabourSavings =
            this.toNumber(input.labour.fteReduced) * this.toNumber(input.labour.fullyLoadedAnnualCostPerFte);

        const productivity = this.computeProductivity(input.productivity);

        const annualOtherSavings = this.sum([
            input.annualSavings?.scrapSavings,
            input.annualSavings?.overtimeSavings,
            input.annualSavings?.qualityWarrantySavings,
            input.annualSavings?.otherSavings,
            this.sumArray(input.annualSavings?.additionalSavings)
        ]);

        const annualOperatingCosts = this.sum([
            input.annualCosts?.maintenanceCost,
            input.annualCosts?.softwareSubscription,
            input.annualCosts?.energyDelta,
            input.annualCosts?.otherAnnualCosts,
            this.sumArray(input.annualCosts?.additionalAnnualCosts)
        ]);

        const annualTotalBenefits = annualLabourSavings + productivity.annualProductivityProfit + annualOtherSavings;
        const netAnnualBenefit = annualTotalBenefits - annualOperatingCosts;

        const paybackYears = netAnnualBenefit > 0 ? grant.effectiveInvestment / netAnnualBenefit : null;
        const paybackMonths = paybackYears === null ? null : Math.round(paybackYears * 12);
        const isAchievable = paybackYears !== null;

        if (!isAchievable) {
            notes.push('Payback is not achievable because net annual benefit is zero or negative.');
        }

        const totalNetBenefits = netAnnualBenefit * years;
        const netProfit = totalNetBenefits - grant.effectiveInvestment;
        const roiPercent = this.computeRoiPercent(netProfit, grant.effectiveInvestment, notes);

        const discountRate = this.normalizeDiscountRate(input.financial.discountRate, notes);
        const npvValue =
            discountRate === null
                ? null
                : this.computeNpv(grant.effectiveInvestment, netAnnualBenefit, years, discountRate);

        const cumulativeCashFlow = this.buildCumulativeCashFlow(
            grant.effectiveInvestment,
            netAnnualBenefit,
            years,
            discountRate
        );
        const breakevenYearFromCumulative = this.findBreakevenYear(cumulativeCashFlow);

        return {
            optionName,
            investment: {
                initialInvestment,
                effectiveInvestment: grant.effectiveInvestment,
                grantType: grant.grantType,
                grantAppliedAmount: grant.grantAppliedAmount
            },
            annual: {
                labourSavings: annualLabourSavings,
                productivityMode: productivity.mode,
                extraUnitsPerYear: productivity.extraUnitsPerYear,
                productivityProfit: productivity.annualProductivityProfit,
                otherSavings: annualOtherSavings,
                totalBenefits: annualTotalBenefits,
                operatingCosts: annualOperatingCosts,
                netAnnualBenefit
            },
            payback: {
                isAchievable,
                paybackYears,
                paybackMonths,
                breakevenYearFromCumulative
            },
            horizon: {
                years,
                totalNetBenefits,
                netProfit,
                roiPercent
            },
            npv: {
                discountRate,
                value: npvValue
            },
            cumulativeCashFlow,
            notes
        };
    }

    compareOptions(inputs: RoiCalculationInput[]): RoiComparisonResult {
        const options = inputs.map((input, index) => {
            const result = this.calculate(input);
            const fallbackName = `Option ${index + 1}`;
            return {
                ...result,
                optionName: result.optionName ?? fallbackName
            };
        });

        return {
            options,
            ranking: {
                byFastestPayback: this.rankOptions(options, (option) => option.payback.paybackYears, 'asc'),
                byHighestRoi: this.rankOptions(options, (option) => option.horizon.roiPercent, 'desc'),
                byHighestNpv: this.rankOptions(options, (option) => option.npv.value, 'desc')
            }
        };
    }

    calculateSensitivity(input: RoiCalculationInput, deltaPercent = 0.1): RoiSensitivityResult {
        const normalizedDelta = Math.abs(this.toNumber(deltaPercent));

        const baseCase = this.calculate(input);

        const productivityLow = this.calculate(this.scaleProductivityInput(input, 1 - normalizedDelta));
        const productivityHigh = this.calculate(this.scaleProductivityInput(input, 1 + normalizedDelta));

        const labourLow = this.calculate(this.scaleLabourCostInput(input, 1 - normalizedDelta));
        const labourHigh = this.calculate(this.scaleLabourCostInput(input, 1 + normalizedDelta));

        const costsLow = this.calculate(this.scaleAnnualOperatingCostsInput(input, 1 - normalizedDelta));
        const costsHigh = this.calculate(this.scaleAnnualOperatingCostsInput(input, 1 + normalizedDelta));

        const baseSnapshot = this.toSensitivitySnapshot(baseCase);

        return {
            deltaPercent: normalizedDelta,
            baseCase: baseSnapshot,
            productivityGain: {
                low: this.toSensitivitySnapshot(productivityLow),
                base: baseSnapshot,
                high: this.toSensitivitySnapshot(productivityHigh)
            },
            labourCostPerFte: {
                low: this.toSensitivitySnapshot(labourLow),
                base: baseSnapshot,
                high: this.toSensitivitySnapshot(labourHigh)
            },
            annualOperatingCosts: {
                low: this.toSensitivitySnapshot(costsLow),
                base: baseSnapshot,
                high: this.toSensitivitySnapshot(costsHigh)
            }
        };
    }

    private normalizeOptionName(optionName?: string): string | null {
        const normalized = optionName?.trim();
        return normalized ? normalized : null;
    }

    private normalizeTimeHorizonYears(rawYears: number, notes: string[]): number {
        const years = Number.isFinite(rawYears) ? Math.floor(rawYears) : 0;
        if (years >= 1) {
            return years;
        }

        notes.push('timeHorizonYears must be at least 1. Defaulted to 1 year.');
        return 1;
    }

    private computeGrant(
        initialInvestment: number,
        grantPercentRaw: number | undefined,
        grantAmountRaw: number | undefined,
        notes: string[]
    ): GrantComputation {
        const hasGrantPercent = this.isFiniteNumber(grantPercentRaw);
        const hasGrantAmount = this.isFiniteNumber(grantAmountRaw);

        if (hasGrantPercent && hasGrantAmount) {
            notes.push('Both grantPercent and grantAmount were provided. grantAmount was applied.');
        }

        if (hasGrantAmount) {
            const grantAmount = this.nonNegative(grantAmountRaw);
            const grantAppliedAmount = Math.min(initialInvestment, grantAmount);
            return {
                grantType: 'amount',
                grantAppliedAmount,
                effectiveInvestment: Math.max(0, initialInvestment - grantAppliedAmount)
            };
        }

        if (hasGrantPercent) {
            const rawPercent = this.toNumber(grantPercentRaw);
            const grantPercent = this.clamp(rawPercent, 0, 1);
            if (grantPercent !== rawPercent) {
                notes.push('grantPercent was clamped to the 0-1 range.');
            }

            const grantAppliedAmount = initialInvestment * grantPercent;
            return {
                grantType: 'percent',
                grantAppliedAmount,
                effectiveInvestment: Math.max(0, initialInvestment - grantAppliedAmount)
            };
        }

        return {
            grantType: 'none',
            grantAppliedAmount: 0,
            effectiveInvestment: initialInvestment
        };
    }

    private computeProductivity(productivity?: ProductivityInput): ProductivityComputation {
        if (!productivity) {
            return {
                mode: 'direct',
                extraUnitsPerYear: null,
                annualProductivityProfit: 0
            };
        }

        if (this.isFiniteNumber(productivity.annualProfitIncrease)) {
            return {
                mode: 'direct',
                extraUnitsPerYear: null,
                annualProductivityProfit: this.toNumber(productivity.annualProfitIncrease)
            };
        }

        const currentUnitsPerYear = this.toNumber(productivity.currentUnitsPerYear);
        const productivityGainPercent = this.toNumber(productivity.productivityGainPercent);
        const profitPerUnit = this.toNumber(productivity.profitPerUnit);
        const extraUnitsPerYear = currentUnitsPerYear * productivityGainPercent;

        return {
            mode: 'units',
            extraUnitsPerYear,
            annualProductivityProfit: extraUnitsPerYear * profitPerUnit
        };
    }

    private computeRoiPercent(netProfit: number, effectiveInvestment: number, notes: string[]): number | null {
        if (effectiveInvestment === 0) {
            notes.push('ROI is undefined because effectiveInvestment is zero.');
            return null;
        }

        return (netProfit / effectiveInvestment) * 100;
    }

    private normalizeDiscountRate(discountRateRaw: number | undefined, notes: string[]): number | null {
        if (!this.isFiniteNumber(discountRateRaw)) {
            return null;
        }

        const discountRate = this.toNumber(discountRateRaw);
        if (discountRate <= -1) {
            notes.push('discountRate must be greater than -100%. NPV was not calculated.');
            return null;
        }

        return discountRate;
    }

    private computeNpv(
        effectiveInvestment: number,
        netAnnualBenefit: number,
        years: number,
        discountRate: number
    ): number {
        let npv = -effectiveInvestment;

        for (let year = 1; year <= years; year += 1) {
            npv += netAnnualBenefit / Math.pow(1 + discountRate, year);
        }

        return npv;
    }

    private buildCumulativeCashFlow(
        effectiveInvestment: number,
        netAnnualBenefit: number,
        years: number,
        discountRate: number | null
    ): CumulativeCashFlowPoint[] {
        const points: CumulativeCashFlowPoint[] = [];
        let cumulativeCashFlow = -effectiveInvestment;
        let discountedCumulativeCashFlow = -effectiveInvestment;

        points.push({
            year: 0,
            cumulativeCashFlow,
            discountedCumulativeCashFlow: discountRate === null ? null : discountedCumulativeCashFlow
        });

        for (let year = 1; year <= years; year += 1) {
            cumulativeCashFlow += netAnnualBenefit;

            if (discountRate !== null) {
                discountedCumulativeCashFlow += netAnnualBenefit / Math.pow(1 + discountRate, year);
            }

            points.push({
                year,
                cumulativeCashFlow,
                discountedCumulativeCashFlow: discountRate === null ? null : discountedCumulativeCashFlow
            });
        }

        return points;
    }

    private findBreakevenYear(points: CumulativeCashFlowPoint[]): number | null {
        const breakevenPoint = points.find((point) => point.year > 0 && point.cumulativeCashFlow >= 0);
        return breakevenPoint?.year ?? null;
    }

    private rankOptions(
        options: RoiCalculationResult[],
        getValue: (option: RoiCalculationResult) => number | null,
        direction: 'asc' | 'desc'
    ): RankedOption[] {
        const sorted = [...options].sort((left, right) =>
            this.compareNullableNumbers(getValue(left), getValue(right), direction)
        );

        return sorted.map((option, index) => ({
            rank: index + 1,
            optionName: option.optionName ?? `Option ${index + 1}`,
            metricValue: getValue(option)
        }));
    }

    private compareNullableNumbers(left: number | null, right: number | null, direction: 'asc' | 'desc'): number {
        if (left === null && right === null) {
            return 0;
        }

        if (left === null) {
            return 1;
        }

        if (right === null) {
            return -1;
        }

        return direction === 'asc' ? left - right : right - left;
    }

    private toSensitivitySnapshot(result: RoiCalculationResult): SensitivitySnapshot {
        return {
            netAnnualBenefit: result.annual.netAnnualBenefit,
            paybackYears: result.payback.paybackYears,
            roiPercent: result.horizon.roiPercent,
            npv: result.npv.value
        };
    }

    private scaleProductivityInput(input: RoiCalculationInput, factor: number): RoiCalculationInput {
        const cloned = this.cloneInput(input);
        if (!cloned.productivity) {
            cloned.productivity = {
                annualProfitIncrease: 0
            };
        }

        if (this.isFiniteNumber(cloned.productivity.annualProfitIncrease)) {
            cloned.productivity.annualProfitIncrease = this.toNumber(cloned.productivity.annualProfitIncrease) * factor;
            return cloned;
        }

        cloned.productivity.productivityGainPercent = this.toNumber(cloned.productivity.productivityGainPercent) * factor;
        return cloned;
    }

    private scaleLabourCostInput(input: RoiCalculationInput, factor: number): RoiCalculationInput {
        const cloned = this.cloneInput(input);
        cloned.labour.fullyLoadedAnnualCostPerFte = this.toNumber(cloned.labour.fullyLoadedAnnualCostPerFte) * factor;
        return cloned;
    }

    private scaleAnnualOperatingCostsInput(input: RoiCalculationInput, factor: number): RoiCalculationInput {
        const cloned = this.cloneInput(input);

        cloned.annualCosts = {
            ...cloned.annualCosts,
            maintenanceCost: this.toNumber(cloned.annualCosts?.maintenanceCost) * factor,
            softwareSubscription: this.toNumber(cloned.annualCosts?.softwareSubscription) * factor,
            energyDelta: this.toNumber(cloned.annualCosts?.energyDelta) * factor,
            otherAnnualCosts: this.toNumber(cloned.annualCosts?.otherAnnualCosts) * factor,
            additionalAnnualCosts: (cloned.annualCosts?.additionalAnnualCosts ?? []).map((value) =>
                this.toNumber(value) * factor
            )
        };

        return cloned;
    }

    private cloneInput(input: RoiCalculationInput): RoiCalculationInput {
        return {
            ...input,
            investment: {
                ...input.investment,
                additionalUpfrontCosts: [...(input.investment.additionalUpfrontCosts ?? [])]
            },
            labour: {
                ...input.labour
            },
            productivity: input.productivity
                ? {
                      ...input.productivity
                  }
                : undefined,
            annualSavings: input.annualSavings
                ? {
                      ...input.annualSavings,
                      additionalSavings: [...(input.annualSavings.additionalSavings ?? [])]
                  }
                : undefined,
            annualCosts: input.annualCosts
                ? {
                      ...input.annualCosts,
                      additionalAnnualCosts: [...(input.annualCosts.additionalAnnualCosts ?? [])]
                  }
                : undefined,
            financial: {
                ...input.financial
            }
        };
    }

    private sum(values: Array<number | undefined>): number {
        let total = 0;
        for (const value of values) {
            total += this.toNumber(value);
        }

        return total;
    }

    private sumArray(values?: number[]): number {
        if (!values) {
            return 0;
        }

        return values.reduce((accumulator, value) => accumulator + this.toNumber(value), 0);
    }

    private sumPositiveArray(values?: number[]): number {
        if (!values) {
            return 0;
        }

        return values.reduce((accumulator, value) => accumulator + this.nonNegative(value), 0);
    }

    private nonNegative(value: number | undefined): number {
        return Math.max(0, this.toNumber(value));
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }

    private isFiniteNumber(value: number | undefined): value is number {
        return typeof value === 'number' && Number.isFinite(value);
    }

    private toNumber(value: number | undefined): number {
        return this.isFiniteNumber(value) ? value : 0;
    }
}

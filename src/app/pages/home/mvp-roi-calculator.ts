import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Calculate, type RoiCalculationInput, type RoiCalculationResult } from '../../service/calculate';

type GrantSelection = 'none' | 'percent' | 'amount';

interface MvpFormModel {
    optionName: string;
    equipmentCost: number;
    fteReduced: number;
    fullyLoadedAnnualCostPerFte: number;
    annualOperatingCosts: number;
    annualProfitIncrease: number;
    annualOtherSavings: number;
    timeHorizonYears: number;
    grantType: GrantSelection;
    grantPercent: number;
    grantAmount: number;
    includeNpv: boolean;
    discountRatePercent: number;
}

@Component({
    selector: 'app-mvp-roi-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-6">
            <div class="mb-6">
                <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">MVP ROI Calculator</h2>
                <p class="text-sm text-surface-500 dark:text-surface-400">Enter the minimum numbers needed to estimate investment ROI and payback.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="flex flex-col gap-2">
                    <span class="text-sm text-surface-600 dark:text-surface-300">Technology Name (optional)</span>
                    <input type="text" [(ngModel)]="form.optionName" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" placeholder="Robot / AI / CNC" />
                </label>

                <label class="flex flex-col gap-2">
                    <span class="text-sm text-surface-600 dark:text-surface-300">Equipment Cost (required)</span>
                    <input type="number" [(ngModel)]="form.equipmentCost" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" min="0" step="1000" />
                </label>

                <label class="flex flex-col gap-2">
                    <span class="text-sm text-surface-600 dark:text-surface-300">FTE Reduced (required)</span>
                    <input type="number" [(ngModel)]="form.fteReduced" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" min="0" step="0.1" />
                </label>

                <label class="flex flex-col gap-2">
                    <span class="text-sm text-surface-600 dark:text-surface-300">Fully-Loaded Annual Cost per FTE (required)</span>
                    <input type="number" [(ngModel)]="form.fullyLoadedAnnualCostPerFte" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" min="0" step="1000" />
                </label>

                <label class="flex flex-col gap-2">
                    <span class="text-sm text-surface-600 dark:text-surface-300">Annual Operating Costs</span>
                    <input type="number" [(ngModel)]="form.annualOperatingCosts" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" min="0" step="1000" />
                </label>

                <label class="flex flex-col gap-2">
                    <span class="text-sm text-surface-600 dark:text-surface-300">Annual Productivity Profit Increase</span>
                    <input type="number" [(ngModel)]="form.annualProfitIncrease" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" min="0" step="1000" />
                </label>

                <label class="flex flex-col gap-2">
                    <span class="text-sm text-surface-600 dark:text-surface-300">Other Annual Savings</span>
                    <input type="number" [(ngModel)]="form.annualOtherSavings" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" min="0" step="1000" />
                </label>

                <label class="flex flex-col gap-2">
                    <span class="text-sm text-surface-600 dark:text-surface-300">Time Horizon (years, required)</span>
                    <input type="number" [(ngModel)]="form.timeHorizonYears" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" min="1" step="1" />
                </label>

                <label class="flex flex-col gap-2">
                    <span class="text-sm text-surface-600 dark:text-surface-300">Grant Type</span>
                    <select [(ngModel)]="form.grantType" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2">
                        <option value="none">No Grant</option>
                        <option value="percent">Grant %</option>
                        <option value="amount">Grant Amount</option>
                    </select>
                </label>

                @if (form.grantType === 'percent') {
                    <label class="flex flex-col gap-2">
                        <span class="text-sm text-surface-600 dark:text-surface-300">Grant Percent (%)</span>
                        <input type="number" [(ngModel)]="form.grantPercent" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" min="0" max="100" step="1" />
                    </label>
                }

                @if (form.grantType === 'amount') {
                    <label class="flex flex-col gap-2">
                        <span class="text-sm text-surface-600 dark:text-surface-300">Grant Amount</span>
                        <input type="number" [(ngModel)]="form.grantAmount" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" min="0" step="1000" />
                    </label>
                }
            </div>

            <div class="mt-4 flex items-center gap-3">
                <input id="includeNpv" type="checkbox" [(ngModel)]="form.includeNpv" />
                <label for="includeNpv" class="text-sm text-surface-600 dark:text-surface-300">Include NPV</label>
            </div>

            @if (form.includeNpv) {
                <label class="mt-3 flex flex-col gap-2 max-w-xs">
                    <span class="text-sm text-surface-600 dark:text-surface-300">Discount Rate (%)</span>
                    <input type="number" [(ngModel)]="form.discountRatePercent" class="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-transparent px-3 py-2" min="0" step="0.1" />
                </label>
            }

            <div class="mt-6">
                <button type="button" (click)="calculateMvp()" class="rounded-lg bg-primary text-primary-contrast px-4 py-2 text-sm font-medium">Calculate</button>
            </div>

            @if (validationError) {
                <p class="mt-4 text-sm text-red-600 dark:text-red-400">{{ validationError }}</p>
            }

            @if (result) {
                <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                        <div class="text-xs text-surface-500 uppercase tracking-wide">Effective Investment</div>
                        <div class="text-2xl font-semibold mt-1">{{ formatCurrency(result.investment.effectiveInvestment) }}</div>
                    </div>

                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                        <div class="text-xs text-surface-500 uppercase tracking-wide">Net Annual Benefit</div>
                        <div class="text-2xl font-semibold mt-1">{{ formatCurrency(result.annual.netAnnualBenefit) }}</div>
                    </div>

                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                        <div class="text-xs text-surface-500 uppercase tracking-wide">Payback</div>
                        <div class="text-2xl font-semibold mt-1">
                            @if (result.payback.paybackYears !== null) {
                                {{ formatYears(result.payback.paybackYears) }}
                            } @else {
                                Not achievable
                            }
                        </div>
                    </div>

                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                        <div class="text-xs text-surface-500 uppercase tracking-wide">ROI (Horizon)</div>
                        <div class="text-2xl font-semibold mt-1">
                            @if (result.horizon.roiPercent !== null) {
                                {{ result.horizon.roiPercent | number: '1.2-2' }}%
                            } @else {
                                Undefined
                            }
                        </div>
                    </div>
                </div>

                @if (form.includeNpv && result.npv.value !== null) {
                    <div class="mt-4 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                        <div class="text-xs text-surface-500 uppercase tracking-wide">NPV</div>
                        <div class="text-2xl font-semibold mt-1">{{ formatCurrency(result.npv.value) }}</div>
                    </div>
                }
            }
        </div>
    `
})
export class MvpRoiCalculator {
    private readonly calculateService = inject(Calculate);

    readonly form: MvpFormModel = {
        optionName: '',
        equipmentCost: 0,
        fteReduced: 0,
        fullyLoadedAnnualCostPerFte: 0,
        annualOperatingCosts: 0,
        annualProfitIncrease: 0,
        annualOtherSavings: 0,
        timeHorizonYears: 5,
        grantType: 'none',
        grantPercent: 0,
        grantAmount: 0,
        includeNpv: false,
        discountRatePercent: 10
    };

    result: RoiCalculationResult | null = null;
    validationError: string | null = null;

    calculateMvp(): void {
        this.validationError = this.validateMvpInputs();
        if (this.validationError) {
            this.result = null;
            return;
        }

        const input: RoiCalculationInput = {
            // optionName: this.emptyToUndefined(this.form.optionName),
            investment: {
                equipmentCost: this.form.equipmentCost
                // grantPercent: this.form.grantType === 'percent' ? this.form.grantPercent / 100 : undefined,
                // grantAmount: this.form.grantType === 'amount' ? this.form.grantAmount : undefined
            },
            labour: {
                fteReduced: this.form.fteReduced,
                fullyLoadedAnnualCostPerFte: this.form.fullyLoadedAnnualCostPerFte
            },
            // productivity:
            //     this.form.annualProfitIncrease > 0
            //         ? {
            //               annualProfitIncrease: this.form.annualProfitIncrease
            //           }
            //         : undefined,
            // annualSavings:
            //     this.form.annualOtherSavings > 0
            //         ? {
            //               otherSavings: this.form.annualOtherSavings
            //           }
            //         : undefined,
            annualCosts: {
                otherAnnualCosts: this.form.annualOperatingCosts
            },
            financial: {
                timeHorizonYears: this.form.timeHorizonYears,
                discountRate: this.form.includeNpv ? this.form.discountRatePercent / 100 : undefined
            }
        };

        this.result = this.calculateService.calculate(input);
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(value);
    }

    formatYears(value: number): string {
        const years = Math.floor(value);
        const months = Math.round((value - years) * 12);

        if (years === 0) {
            return `${months} months`;
        }

        if (months === 0) {
            return `${years} years`;
        }

        return `${years} years ${months} months`;
    }

    private validateMvpInputs(): string | null {
        if (!Number.isFinite(this.form.equipmentCost) || this.form.equipmentCost < 0) {
            return 'Equipment cost must be zero or greater.';
        }

        if (!Number.isFinite(this.form.fteReduced) || this.form.fteReduced < 0) {
            return 'FTE reduced must be zero or greater.';
        }

        if (!Number.isFinite(this.form.fullyLoadedAnnualCostPerFte) || this.form.fullyLoadedAnnualCostPerFte < 0) {
            return 'Fully-loaded annual cost per FTE must be zero or greater.';
        }

        if (!Number.isFinite(this.form.timeHorizonYears) || this.form.timeHorizonYears < 1) {
            return 'Time horizon must be at least 1 year.';
        }

        if (this.form.grantType === 'percent' && (this.form.grantPercent < 0 || this.form.grantPercent > 100)) {
            return 'Grant percent must be between 0 and 100.';
        }

        if (this.form.grantType === 'amount' && this.form.grantAmount < 0) {
            return 'Grant amount must be zero or greater.';
        }

        if (this.form.includeNpv && this.form.discountRatePercent < 0) {
            return 'Discount rate must be zero or greater.';
        }

        return null;
    }

    private emptyToUndefined(value: string): string | undefined {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
}

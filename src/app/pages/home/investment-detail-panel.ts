import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutomationInvestment } from './automation-investments';
import { InputNumber } from 'primeng/inputnumber';
import { Checkbox } from 'primeng/checkbox';
import { FloatLabel } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { Calculate, type RoiCalculationInput, type RoiCalculationResult } from '../../service/calculate';

@Component({
    selector: 'app-investment-detail-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, InputNumber, Checkbox, FloatLabel, ButtonModule],
    templateUrl: './investment-detail-panel.html'
})
export class InvestmentDetailPanel {
    private readonly calculateService = inject(Calculate);

    investment = input<AutomationInvestment | null>(null);

    ftePositions: number | null = null;
    fullyLoadedAnnualCostPerFte: number | null = null;
    timeHorizonYears: number | null = null;
    includeNpv: boolean = false;
    discountRatePercent: number | null = null;

    result: RoiCalculationResult | null = null;

    calculate(): void {
        const inv = this.investment();
        if (!inv) return;

        const input: RoiCalculationInput = {
            investment: {
                equipmentCost: inv.equipmentCost
            },
            labour: {
                fteReduced: this.ftePositions ?? 0,
                fullyLoadedAnnualCostPerFte: this.fullyLoadedAnnualCostPerFte ?? 0
            },
            annualCosts: {
                otherAnnualCosts: inv.otherAnnualCosts
            },
            financial: {
                timeHorizonYears: this.timeHorizonYears ?? 5,
                discountRate: this.includeNpv && this.discountRatePercent != null ? this.discountRatePercent / 100 : undefined
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
        if (years === 0) return `${months} months`;
        if (months === 0) return `${years} years`;
        return `${years} years ${months} months`;
    }
}

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutomationInvestment } from './automation-investments';
import { InputNumber } from 'primeng/inputnumber';
import { Checkbox } from 'primeng/checkbox';
import { FloatLabel } from 'primeng/floatlabel';

@Component({
    selector: 'app-investment-detail-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, InputNumber, Checkbox, FloatLabel],
    templateUrl: './investment-detail-panel.html'
})
export class InvestmentDetailPanel {
    investment = input<AutomationInvestment | null>(null);

    ftePositions: number | null = null;
    fullyLoadedAnnualCostPerFte: number | null = null;
    timeHorizonYears: number | null = null;
    includeNpv: boolean = false;
    discountRatePercent: number | null = null;
}

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutomationInvestment } from './automation-investments';

@Component({
    selector: 'app-investment-detail-panel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './investment-detail-panel.html'
})
export class InvestmentDetailPanel {
    investment = input<AutomationInvestment | null>(null);
}

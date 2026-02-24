import { Component, effect, inject, input, signal } from '@angular/core';
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
    reportGenerating = signal(false);
    reportError = signal<string | null>(null);

    constructor() {
        effect(() => {
            const inv = this.investment();
            if (inv) {
                this.ftePositions = inv.defaultFtePositions;
                this.fullyLoadedAnnualCostPerFte = inv.defaultFullyLoadedAnnualCostPerFte;
                this.timeHorizonYears = inv.defaultTimeHorizonYears;
            } else {
                this.ftePositions = null;
                this.fullyLoadedAnnualCostPerFte = null;
                this.timeHorizonYears = null;
            }
            this.includeNpv = false;
            this.discountRatePercent = null;
            this.result = null;
            this.reportGenerating.set(false);
            this.reportError.set(null);
        });
    }

    calculate(): void {
        this.reportError.set(null);

        const input = this.buildCalculationInput();
        if (!input) {
            return;
        }

        this.result = this.calculateService.calculate(input);
    }

    async generateInternalRoiReport(): Promise<void> {
        this.reportError.set(null);

        const calculationInput = this.buildCalculationInput();
        if (!calculationInput) {
            this.reportError.set('Select an investment before generating a report.');
            return;
        }

        const calculationResult = this.result ?? this.calculateService.calculate(calculationInput);
        this.result = calculationResult;
        this.reportGenerating.set(true);

        try {
            const response = await fetch(this.resolveReportApiUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    calculationInput,
                    calculationResult
                })
            });

            if (!response.ok) {
                const bodyText = await response.text();
                throw new Error(bodyText || `Request failed with status ${response.status}.`);
            }

            const pdfBlob = await response.blob();
            const filename = this.extractFilename(response.headers.get('content-disposition'));
            this.downloadBlob(pdfBlob, filename);
        } catch (error) {
            console.error(error);
            this.reportError.set('Failed to generate report PDF. Please try again.');
        } finally {
            this.reportGenerating.set(false);
        }
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

    private buildCalculationInput(): RoiCalculationInput | null {
        const inv = this.investment();
        if (!inv) {
            return null;
        }

        return {
            optionName: inv.name,
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
    }

    private resolveReportApiUrl(): string {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:4000/api/reports/pdf';
        }

        return '/api/reports/pdf';
    }

    private extractFilename(contentDisposition: string | null): string {
        if (!contentDisposition) {
            return 'internal-roi-report.pdf';
        }

        const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
        if (quotedMatch && quotedMatch[1]) {
            return quotedMatch[1];
        }

        const plainMatch = contentDisposition.match(/filename=([^;]+)/i);
        if (plainMatch && plainMatch[1]) {
            return plainMatch[1].trim();
        }

        return 'internal-roi-report.pdf';
    }

    private downloadBlob(blob: Blob, filename: string): void {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
    }
}

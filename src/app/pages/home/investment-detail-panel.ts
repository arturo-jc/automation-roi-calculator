import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutomationInvestment } from './automation-investments';
import { InputNumber } from 'primeng/inputnumber';
import { Checkbox } from 'primeng/checkbox';
import { FloatLabel } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { Calculate, type RoiCalculationInput, type RoiCalculationResult } from '../../service/calculate';

interface GrantCalculationHint {
    grantAmount: number | null;
    grantPercent: number | null;
}

interface GrantOption {
    id: string;
    name: string;
    provider: string;
    status: string;
    summary: string;
    displayValue: string;
    calculationHint: GrantCalculationHint;
}

interface ResolvedGrantInput {
    grantAmount?: number;
    grantPercent?: number;
}

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
    grantsLoading = signal(false);
    grantsError = signal<string | null>(null);
    grants = signal<GrantOption[]>([]);
    selectedGrantId = signal<string | null>(null);
    selectedGrant = computed(() => this.grants().find((grant) => grant.id === this.selectedGrantId()) ?? null);

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

    async searchForGrants(): Promise<void> {
        this.grantsError.set(null);
        this.grantsLoading.set(true);

        try {
            const response = await fetch(this.resolveGrantsApiUrl());
            if (!response.ok) {
                const bodyText = await response.text();
                throw new Error(bodyText || `Request failed with status ${response.status}.`);
            }

            const data = (await response.json()) as { grants?: unknown };
            const parsedGrants = this.parseGrantsFromResponse(data);
            const previousGrantId = this.selectedGrantId();

            this.grants.set(parsedGrants);
            if (!previousGrantId || !parsedGrants.some((grant) => grant.id === previousGrantId)) {
                this.selectedGrantId.set(null);
            }
        } catch (error) {
            console.error(error);
            this.grantsError.set('Failed to retrieve grants. Please try again.');
        } finally {
            this.grantsLoading.set(false);
        }
    }

    onGrantSelectionChange(selectedGrantId: string): void {
        this.selectedGrantId.set(selectedGrantId || null);
        if (this.result) {
            this.calculate();
        }
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

    formatPercent(value: number): string {
        return `${(value * 100).toFixed(2)}%`;
    }

    describeGrantApplication(grant: GrantOption): string {
        const hint = grant.calculationHint;
        const grantAmount = this.isFiniteNumber(hint.grantAmount) ? Math.max(0, hint.grantAmount) : null;
        const grantPercent = this.isFiniteNumber(hint.grantPercent) ? this.clamp(hint.grantPercent, 0, 1) : null;

        if (grantAmount !== null && grantPercent !== null) {
            return `Applied as the lower of ${this.formatPercent(grantPercent)} of equipment cost and ${this.formatCurrency(grantAmount)}.`;
        }

        if (grantAmount !== null) {
            return `Applied in calculation as grant amount: ${this.formatCurrency(grantAmount)}.`;
        }

        if (grantPercent !== null) {
            return `Applied in calculation as grant percent: ${this.formatPercent(grantPercent)}.`;
        }

        return 'No direct grant amount/percent available for automatic ROI input.';
    }

    private buildCalculationInput(): RoiCalculationInput | null {
        const inv = this.investment();
        if (!inv) {
            return null;
        }

        const selectedGrant = this.selectedGrant();
        const resolvedGrant = this.resolveGrantInput(inv.equipmentCost, selectedGrant?.calculationHint ?? null);

        return {
            optionName: inv.name,
            investment: {
                equipmentCost: inv.equipmentCost,
                grantAmount: resolvedGrant.grantAmount,
                grantPercent: resolvedGrant.grantPercent
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

        return 'https://api.stepbystepstrength.com/api/reports/pdf';
    }

    private resolveGrantsApiUrl(): string {
        const path = '/api/grants?country=CA';
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return `http://localhost:4000${path}`;
        }

        return 'https://api.stepbystepstrength.com/api/grants?country=CA';
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

    private parseGrantsFromResponse(payload: { grants?: unknown }): GrantOption[] {
        if (!Array.isArray(payload.grants)) {
            return [];
        }

        const parsed: GrantOption[] = [];
        for (const grant of payload.grants) {
            const item = this.parseSingleGrant(grant);
            if (item) {
                parsed.push(item);
            }
        }

        return parsed;
    }

    private parseSingleGrant(grant: unknown): GrantOption | null {
        const record = this.asRecord(grant);
        if (!record) {
            return null;
        }

        const id = typeof record['id'] === 'string' ? record['id'] : '';
        const name = typeof record['name'] === 'string' ? record['name'] : '';
        if (!id || !name) {
            return null;
        }

        const hintRecord = this.asRecord(record['calculationHint']);
        const calculationHint: GrantCalculationHint = {
            grantAmount: this.toNullableNumber(hintRecord?.['grantAmount']),
            grantPercent: this.toNullableNumber(hintRecord?.['grantPercent'])
        };

        return {
            id,
            name,
            provider: typeof record['provider'] === 'string' ? record['provider'] : 'Unknown provider',
            status: typeof record['status'] === 'string' ? record['status'] : 'unknown',
            summary: typeof record['summary'] === 'string' ? record['summary'] : '',
            displayValue: typeof record['displayValue'] === 'string' ? record['displayValue'] : '',
            calculationHint
        };
    }

    private asRecord(value: unknown): Record<string, unknown> | null {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return null;
        }

        return value as Record<string, unknown>;
    }

    private toNullableNumber(value: unknown): number | null {
        return typeof value === 'number' && Number.isFinite(value) ? value : null;
    }

    private isFiniteNumber(value: number | null): value is number {
        return typeof value === 'number' && Number.isFinite(value);
    }

    private resolveGrantInput(equipmentCost: number, hint: GrantCalculationHint | null): ResolvedGrantInput {
        if (!hint) {
            return {};
        }

        const grantAmountCap = this.isFiniteNumber(hint.grantAmount) ? Math.max(0, hint.grantAmount) : null;
        const grantPercent = this.isFiniteNumber(hint.grantPercent) ? this.clamp(hint.grantPercent, 0, 1) : null;
        const normalizedCost = Math.max(0, equipmentCost);

        if (grantAmountCap !== null && grantPercent !== null) {
            const percentLimitedAmount = normalizedCost * grantPercent;
            return {
                grantAmount: Math.min(grantAmountCap, percentLimitedAmount)
            };
        }

        if (grantAmountCap !== null) {
            return {
                grantAmount: grantAmountCap
            };
        }

        if (grantPercent !== null) {
            return {
                grantPercent
            };
        }

        return {};
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }
}

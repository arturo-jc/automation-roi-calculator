import { Component } from '@angular/core';
import { AutomationInvestments } from './automation-investments';
import { MvpRoiCalculator } from './mvp-roi-calculator';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [AutomationInvestments, MvpRoiCalculator],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <app-automation-investments />
            </div>
            <div class="col-span-12">
                <app-mvp-roi-calculator />
            </div>
        </div>
    `
})
export class Home {}

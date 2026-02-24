import { Component } from '@angular/core';
import { AutomationInvestments } from './automation-investments';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [AutomationInvestments],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <app-automation-investments />
            </div>
        </div>
    `
})
export class Home {}

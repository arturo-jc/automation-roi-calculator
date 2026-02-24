import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Listbox } from 'primeng/listbox';

interface AutomationInvestment {
    id: number;
    name: string;
    category: string;
    estimatedCost: string;
    annualSavings: string;
    roiTimeline: string;
    description: string;
    imageUrl: string;
}

const INVESTMENTS: AutomationInvestment[] = [
    {
        id: 1,
        name: 'Autonomous Tractor',
        category: 'Field Operations',
        estimatedCost: '$250,000 – $500,000',
        annualSavings: '$60,000 – $120,000',
        roiTimeline: '3–5 years',
        description: 'Self-driving tractor capable of plowing, seeding, and field preparation with minimal human oversight.',
        imageUrl: 'https://images.unsplash.com/photo-1605338198618-04031d6f1569?w=400&h=400&fit=crop'
    },
    {
        id: 2,
        name: 'GPS Auto-Steer System',
        category: 'Field Operations',
        estimatedCost: '$10,000 – $25,000',
        annualSavings: '$8,000 – $15,000',
        roiTimeline: '1–2 years',
        description: 'Retrofittable GPS guidance system that provides sub-inch accuracy for straight rows and reduced overlap.',
        imageUrl: 'https://images.unsplash.com/photo-1586771107445-b3e7eb5bb3d4?w=400&h=400&fit=crop'
    },
    {
        id: 3,
        name: 'Precision Planter with Variable Rate Technology',
        category: 'Planting',
        estimatedCost: '$50,000 – $150,000',
        annualSavings: '$20,000 – $45,000',
        roiTimeline: '2–4 years',
        description: 'Advanced planter that adjusts seed spacing, depth, and population rates based on real-time soil data.',
        imageUrl: 'https://images.unsplash.com/photo-1595508064774-5ff825a66592?w=400&h=400&fit=crop'
    },
    {
        id: 4,
        name: 'Agricultural Drones (Spraying & Scouting)',
        category: 'Crop Management',
        estimatedCost: '$15,000 – $75,000',
        annualSavings: '$12,000 – $35,000',
        roiTimeline: '1–3 years',
        description: 'Multi-purpose drones for aerial crop scouting, precision spraying, and field mapping with NDVI imaging.',
        imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&h=400&fit=crop'
    },
    {
        id: 5,
        name: 'Robotic Weeding System',
        category: 'Crop Management',
        estimatedCost: '$100,000 – $200,000',
        annualSavings: '$30,000 – $70,000',
        roiTimeline: '2–4 years',
        description: 'AI-powered robot that identifies and removes weeds mechanically or with targeted micro-sprays, reducing herbicide use.',
        imageUrl: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=400&h=400&fit=crop'
    },
    {
        id: 6,
        name: 'Smart Irrigation System with Soil Moisture Sensors',
        category: 'Water Management',
        estimatedCost: '$5,000 – $30,000',
        annualSavings: '$10,000 – $25,000',
        roiTimeline: '1–2 years',
        description: 'Sensor-driven irrigation that monitors soil moisture at multiple depths and automates watering schedules.',
        imageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400&h=400&fit=crop'
    },
    {
        id: 7,
        name: 'Combine Yield Monitoring System',
        category: 'Harvesting',
        estimatedCost: '$8,000 – $20,000',
        annualSavings: '$10,000 – $20,000',
        roiTimeline: '1–2 years',
        description: 'Real-time yield mapping system installed on combines to track bushels per acre across every pass.',
        imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=400&fit=crop'
    },
    {
        id: 8,
        name: 'Automated Grain Bin Monitoring',
        category: 'Storage',
        estimatedCost: '$3,000 – $10,000',
        annualSavings: '$5,000 – $15,000',
        roiTimeline: '< 1 year',
        description: 'Wireless sensors that track temperature, moisture, and CO₂ levels inside grain bins to prevent spoilage.',
        imageUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&h=400&fit=crop'
    },
    {
        id: 9,
        name: 'AI Crop Disease Detection (Computer Vision)',
        category: 'Crop Management',
        estimatedCost: '$10,000 – $50,000',
        annualSavings: '$15,000 – $40,000',
        roiTimeline: '1–2 years',
        description: 'Camera-based system using machine learning to identify crop diseases, nutrient deficiencies, and pest damage early.',
        imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=400&fit=crop'
    },
    {
        id: 10,
        name: 'Automated Variable-Rate Fertilizer Spreader',
        category: 'Nutrient Management',
        estimatedCost: '$30,000 – $80,000',
        annualSavings: '$15,000 – $35,000',
        roiTimeline: '2–3 years',
        description: 'GPS-linked spreader that adjusts fertilizer application rates zone-by-zone based on soil test maps.',
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop'
    },
    {
        id: 11,
        name: 'Livestock Monitoring Sensors',
        category: 'Livestock',
        estimatedCost: '$5,000 – $25,000',
        annualSavings: '$8,000 – $20,000',
        roiTimeline: '1–2 years',
        description: 'Wearable sensors tracking animal health, activity, feeding patterns, and estrus detection in real time.',
        imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=400&h=400&fit=crop'
    },
    {
        id: 12,
        name: 'Robotic Milking System',
        category: 'Livestock',
        estimatedCost: '$150,000 – $250,000',
        annualSavings: '$40,000 – $80,000',
        roiTimeline: '3–5 years',
        description: 'Fully automated milking parlor where cows voluntarily enter and are milked by robotic arms on their own schedule.',
        imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&h=400&fit=crop'
    },
    {
        id: 13,
        name: 'Autonomous Harvesting Robots',
        category: 'Harvesting',
        estimatedCost: '$200,000 – $400,000',
        annualSavings: '$50,000 – $100,000',
        roiTimeline: '3–5 years',
        description: 'Robotic harvesters for fruits and vegetables using computer vision to identify ripe produce and pick without damage.',
        imageUrl: 'https://images.unsplash.com/photo-1601000938259-9e92002320b2?w=400&h=400&fit=crop'
    },
    {
        id: 14,
        name: 'Farm Management Software (AI-Driven Optimization)',
        category: 'Software',
        estimatedCost: '$2,000 – $15,000/year',
        annualSavings: '$20,000 – $50,000',
        roiTimeline: '< 1 year',
        description: 'Centralized platform using AI to optimize planting schedules, input purchases, labor allocation, and market timing.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop'
    },
    {
        id: 15,
        name: 'On-Farm Weather Station with Predictive Analytics',
        category: 'Data & Analytics',
        estimatedCost: '$1,500 – $8,000',
        annualSavings: '$5,000 – $15,000',
        roiTimeline: '< 1 year',
        description: 'Hyperlocal weather station providing micro-climate data and AI-powered forecasts for spray windows and frost alerts.',
        imageUrl: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=400&h=400&fit=crop'
    }
];

@Component({
    selector: 'app-automation-investments',
    standalone: true,
    imports: [CommonModule, FormsModule, Listbox],
    template: `
        <div class="flex gap-6 h-full">
            <!-- Left: Selectable List -->
            <div class="w-5/12">
                <p-listbox
                    [options]="investments"
                    [(ngModel)]="selectedInvestment"
                    optionLabel="name"
                    [filter]="true"
                    filterPlaceHolder="Search investments..."
                    [listStyle]="{ 'max-height': '65vh' }"
                    class="w-full"
                >
                    <ng-template #option let-item>
                        <div class="flex items-center gap-3 py-1">
                            <span class="pi pi-box text-primary"></span>
                            <div>
                                <div class="font-medium">{{ item.name }}</div>
                                <div class="text-sm text-surface-500">{{ item.category }}</div>
                            </div>
                        </div>
                    </ng-template>
                </p-listbox>
            </div>

            <!-- Right: Details Panel -->
            <div class="w-7/12">
                @if (selected()) {
                    <div class="bg-surface-0 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                        <!-- Image Container -->
                        <div class="aspect-square w-full max-h-72 overflow-hidden bg-surface-100 dark:bg-surface-800">
                            <img
                                [src]="selected()!.imageUrl"
                                [alt]="selected()!.name"
                                class="w-full h-full object-cover"
                            />
                        </div>

                        <!-- Details -->
                        <div class="p-6">
                            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-1">
                                {{ selected()!.name }}
                            </h2>
                            <span class="inline-block text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
                                {{ selected()!.category }}
                            </span>
                            <p class="text-surface-600 dark:text-surface-400 mb-6 leading-relaxed">
                                {{ selected()!.description }}
                            </p>

                            <div class="grid grid-cols-3 gap-4">
                                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                                    <div class="text-sm text-surface-500 dark:text-surface-400 mb-1">Estimated Cost</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selected()!.estimatedCost }}</div>
                                </div>
                                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                                    <div class="text-sm text-surface-500 dark:text-surface-400 mb-1">Annual Savings</div>
                                    <div class="font-semibold text-green-600 dark:text-green-400">{{ selected()!.annualSavings }}</div>
                                </div>
                                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                                    <div class="text-sm text-surface-500 dark:text-surface-400 mb-1">ROI Timeline</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selected()!.roiTimeline }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                } @else {
                    <div class="flex flex-col items-center justify-center h-full text-surface-400 dark:text-surface-500">
                        <span class="pi pi-search text-5xl mb-4"></span>
                        <p class="text-lg">Select an investment to view details</p>
                    </div>
                }
            </div>
        </div>
    `
})
export class AutomationInvestments {
    investments = INVESTMENTS;
    selectedInvestment = signal<AutomationInvestment | null>(null);
    selected = computed(() => this.selectedInvestment());
}

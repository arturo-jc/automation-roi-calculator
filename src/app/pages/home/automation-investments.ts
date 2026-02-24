import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Listbox } from 'primeng/listbox';
import { InvestmentDetailPanel } from './investment-detail-panel';

export interface AutomationInvestment {
    id: number;
    name: string;
    category: string;
    equipmentCost: number;
    otherAnnualCosts: number;
    description: string;
    imageUrl: string;
}

const INVESTMENTS: AutomationInvestment[] = [
    {
        id: 1,
        name: 'Autonomous Tractor',
        category: 'Field Operations',
        equipmentCost: 250000,
        otherAnnualCosts: 25000,
        description: 'Self-driving tractor capable of plowing, seeding, and field preparation with minimal human oversight.',
        imageUrl: 'https://images.unsplash.com/photo-1605338198618-04031d6f1569?w=400&h=400&fit=crop'
    },
    {
        id: 2,
        name: 'GPS Auto-Steer System',
        category: 'Field Operations',
        equipmentCost: 10000,
        otherAnnualCosts: 1500,
        description: 'Retrofittable GPS guidance system that provides sub-inch accuracy for straight rows and reduced overlap.',
        imageUrl: 'https://images.unsplash.com/photo-1586771107445-b3e7eb5bb3d4?w=400&h=400&fit=crop'
    },
    {
        id: 3,
        name: 'Precision Planter with Variable Rate Technology',
        category: 'Planting',
        equipmentCost: 50000,
        otherAnnualCosts: 5000,
        description: 'Advanced planter that adjusts seed spacing, depth, and population rates based on real-time soil data.',
        imageUrl: 'https://images.unsplash.com/photo-1595508064774-5ff825a66592?w=400&h=400&fit=crop'
    },
    {
        id: 4,
        name: 'Agricultural Drones (Spraying & Scouting)',
        category: 'Crop Management',
        equipmentCost: 15000,
        otherAnnualCosts: 3000,
        description: 'Multi-purpose drones for aerial crop scouting, precision spraying, and field mapping with NDVI imaging.',
        imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&h=400&fit=crop'
    },
    {
        id: 5,
        name: 'Robotic Weeding System',
        category: 'Crop Management',
        equipmentCost: 100000,
        otherAnnualCosts: 12000,
        description: 'AI-powered robot that identifies and removes weeds mechanically or with targeted micro-sprays, reducing herbicide use.',
        imageUrl: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=400&h=400&fit=crop'
    },
    {
        id: 6,
        name: 'Smart Irrigation System with Soil Moisture Sensors',
        category: 'Water Management',
        equipmentCost: 5000,
        otherAnnualCosts: 800,
        description: 'Sensor-driven irrigation that monitors soil moisture at multiple depths and automates watering schedules.',
        imageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400&h=400&fit=crop'
    },
    {
        id: 7,
        name: 'Combine Yield Monitoring System',
        category: 'Harvesting',
        equipmentCost: 8000,
        otherAnnualCosts: 1200,
        description: 'Real-time yield mapping system installed on combines to track bushels per acre across every pass.',
        imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=400&fit=crop'
    },
    {
        id: 8,
        name: 'Automated Grain Bin Monitoring',
        category: 'Storage',
        equipmentCost: 3000,
        otherAnnualCosts: 500,
        description: 'Wireless sensors that track temperature, moisture, and CO₂ levels inside grain bins to prevent spoilage.',
        imageUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&h=400&fit=crop'
    },
    {
        id: 9,
        name: 'AI Crop Disease Detection (Computer Vision)',
        category: 'Crop Management',
        equipmentCost: 10000,
        otherAnnualCosts: 2000,
        description: 'Camera-based system using machine learning to identify crop diseases, nutrient deficiencies, and pest damage early.',
        imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=400&fit=crop'
    },
    {
        id: 10,
        name: 'Automated Variable-Rate Fertilizer Spreader',
        category: 'Nutrient Management',
        equipmentCost: 30000,
        otherAnnualCosts: 4000,
        description: 'GPS-linked spreader that adjusts fertilizer application rates zone-by-zone based on soil test maps.',
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop'
    },
    {
        id: 11,
        name: 'Livestock Monitoring Sensors',
        category: 'Livestock',
        equipmentCost: 5000,
        otherAnnualCosts: 1000,
        description: 'Wearable sensors tracking animal health, activity, feeding patterns, and estrus detection in real time.',
        imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=400&h=400&fit=crop'
    },
    {
        id: 12,
        name: 'Robotic Milking System',
        category: 'Livestock',
        equipmentCost: 150000,
        otherAnnualCosts: 15000,
        description: 'Fully automated milking parlor where cows voluntarily enter and are milked by robotic arms on their own schedule.',
        imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&h=400&fit=crop'
    },
    {
        id: 13,
        name: 'Autonomous Harvesting Robots',
        category: 'Harvesting',
        equipmentCost: 200000,
        otherAnnualCosts: 20000,
        description: 'Robotic harvesters for fruits and vegetables using computer vision to identify ripe produce and pick without damage.',
        imageUrl: 'https://images.unsplash.com/photo-1601000938259-9e92002320b2?w=400&h=400&fit=crop'
    },
    {
        id: 14,
        name: 'Farm Management Software (AI-Driven Optimization)',
        category: 'Software',
        equipmentCost: 2000,
        otherAnnualCosts: 2000,
        description: 'Centralized platform using AI to optimize planting schedules, input purchases, labor allocation, and market timing.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop'
    },
    {
        id: 15,
        name: 'On-Farm Weather Station with Predictive Analytics',
        category: 'Data & Analytics',
        equipmentCost: 1500,
        otherAnnualCosts: 500,
        description: 'Hyperlocal weather station providing micro-climate data and AI-powered forecasts for spray windows and frost alerts.',
        imageUrl: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=400&h=400&fit=crop'
    }
];

@Component({
    selector: 'app-automation-investments',
    standalone: true,
    imports: [CommonModule, FormsModule, Listbox, InvestmentDetailPanel],
    templateUrl: './automation-investments.html'
})
export class AutomationInvestments {
    investments = INVESTMENTS;
    selectedInvestment = signal<AutomationInvestment>(INVESTMENTS[0]);
    selected = computed(() => this.selectedInvestment());
}

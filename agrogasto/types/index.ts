export type Unit = 'kg' | 'ton' | 'liter' | 'unit';

export interface Terrain {
  id: string;
  name: string;
  location: string;
  sizeHectares: number;
}

export interface Season {
  id: string;
  name: string; // e.g., "Verano 2026"
  startDate: string; // ISO Date
  endDate?: string;
  isActive: boolean;
  terrainId: string;
}

export interface Crop {
  id: string;
  name: string; // e.g., "Maíz Blanco"
  variety?: string;
  plantingDate: string;
  harvestDateEstimated?: string;
  seasonId: string;
  status: 'planned' | 'growing' | 'harvesting' | 'completed';
}

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  date: string;
  category: string;
  description?: string;
  cropId: string;        // Linked to specific crop
  seasonId: string;      // Linked to season context
  status: 'pending' | 'completed' | 'voided';
  
  // Specific to Income
  quantitySold?: number;
  unitPrice?: number;
  unit?: Unit;
  isEstmated?: boolean; // For projecting income
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  projectedProfit: number;
}

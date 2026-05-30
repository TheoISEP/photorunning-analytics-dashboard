// Données mockées basées sur l'image Excel de référence
import { AggregatedEventData } from '@/types';

export const mockEvents: AggregatedEventData[] = [
  // Marathon Royan
  { id: '1', event: 'Marathon Royan Cote de Beaute', date: '2023-01-01', year: 2023, revenue: 7529, participants: 3707, buyers: 278, revenuePerParticipant: 2.03, buyerPercentage: 7.5, avgOrder: 27.08, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '2', event: 'Marathon Royan Cote de Beaute', date: '2024-01-01', year: 2024, revenue: 11029, participants: 4569, buyers: 394, revenuePerParticipant: 2.41, buyerPercentage: 8.6, avgOrder: 27.99, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '3', event: 'Marathon Royan Cote de Beaute', date: '2025-01-01', year: 2025, revenue: 16766, participants: 5854, buyers: 564, revenuePerParticipant: 2.86, buyerPercentage: 9.6, avgOrder: 29.73, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '4', event: 'Marathon Royan Cote de Beaute', date: '2026-01-01', year: 2026, revenue: 9986, participants: 7108, buyers: 349, revenuePerParticipant: 1.40, buyerPercentage: 4.9, avgOrder: 28.61, imagesPerParticipant: 0, images: 0, isTriathlon: false },

  // Autres événements (exemples)
  { id: '5', event: 'Semi-Marathon de Paris', date: '2023-01-01', year: 2023, revenue: 12500, participants: 5000, buyers: 450, revenuePerParticipant: 2.50, buyerPercentage: 9.0, avgOrder: 27.78, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '6', event: 'Semi-Marathon de Paris', date: '2024-01-01', year: 2024, revenue: 15000, participants: 5500, buyers: 520, revenuePerParticipant: 2.73, buyerPercentage: 9.5, avgOrder: 28.85, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '7', event: 'Semi-Marathon de Paris', date: '2025-01-01', year: 2025, revenue: 18000, participants: 6000, buyers: 600, revenuePerParticipant: 3.00, buyerPercentage: 10.0, avgOrder: 30.00, imagesPerParticipant: 0, images: 0, isTriathlon: false },

  // 10km Tour Eiffel
  { id: '8', event: '10km Tour Eiffel', date: '2023-01-01', year: 2023, revenue: 8500, participants: 3500, buyers: 320, revenuePerParticipant: 2.43, buyerPercentage: 9.1, avgOrder: 26.56, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '9', event: '10km Tour Eiffel', date: '2024-01-01', year: 2024, revenue: 9500, participants: 3800, buyers: 350, revenuePerParticipant: 2.50, buyerPercentage: 9.2, avgOrder: 27.14, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '10', event: '10km Tour Eiffel', date: '2025-01-01', year: 2025, revenue: 11000, participants: 4000, buyers: 380, revenuePerParticipant: 2.75, buyerPercentage: 9.5, avgOrder: 28.95, imagesPerParticipant: 0, images: 0, isTriathlon: false },

  // Triathlons
  { id: '11', event: 'Triathlon de Paris', date: '2020-01-01', year: 2020, revenue: 32680, participants: 6601, buyers: 1117, revenuePerParticipant: 4.95, buyerPercentage: 16.9, avgOrder: 29.26, imagesPerParticipant: 0, images: 0, isTriathlon: true },
  { id: '12', event: 'Triathlon de Paris', date: '2021-01-01', year: 2021, revenue: 44129, participants: 6754, buyers: 1277, revenuePerParticipant: 6.53, buyerPercentage: 18.9, avgOrder: 34.56, imagesPerParticipant: 0, images: 0, isTriathlon: true },
  { id: '13', event: 'Triathlon de Paris', date: '2022-01-01', year: 2022, revenue: 69697, participants: 11861, buyers: 1961, revenuePerParticipant: 5.88, buyerPercentage: 16.5, avgOrder: 35.54, imagesPerParticipant: 0, images: 0, isTriathlon: true },
  { id: '14', event: 'Triathlon de Paris', date: '2023-01-01', year: 2023, revenue: 59680, participants: 10096, buyers: 1767, revenuePerParticipant: 5.91, buyerPercentage: 17.5, avgOrder: 33.77, imagesPerParticipant: 0, images: 0, isTriathlon: true },
  { id: '15', event: 'Triathlon de Paris', date: '2024-01-01', year: 2024, revenue: 134164, participants: 18706, buyers: 3656, revenuePerParticipant: 7.17, buyerPercentage: 19.5, avgOrder: 36.70, imagesPerParticipant: 0, images: 0, isTriathlon: true },
  { id: '16', event: 'Triathlon de Paris', date: '2025-01-01', year: 2025, revenue: 179935, participants: 28276, buyers: 4811, revenuePerParticipant: 6.36, buyerPercentage: 17.0, avgOrder: 37.40, imagesPerParticipant: 0, images: 0, isTriathlon: true },
  { id: '17', event: 'Triathlon de Paris', date: '2026-01-01', year: 2026, revenue: 4487, participants: 1408, buyers: 133, revenuePerParticipant: 3.19, buyerPercentage: 9.4, avgOrder: 33.74, imagesPerParticipant: 0, images: 0, isTriathlon: true },

  { id: '18', event: 'Triathlon de Deauville', date: '2023-01-01', year: 2023, revenue: 25000, participants: 4000, buyers: 680, revenuePerParticipant: 6.25, buyerPercentage: 17.0, avgOrder: 36.76, imagesPerParticipant: 0, images: 0, isTriathlon: true },
  { id: '19', event: 'Triathlon de Deauville', date: '2024-01-01', year: 2024, revenue: 28500, participants: 4200, buyers: 750, revenuePerParticipant: 6.79, buyerPercentage: 17.9, avgOrder: 38.00, imagesPerParticipant: 0, images: 0, isTriathlon: true },
  { id: '20', event: 'Triathlon de Deauville', date: '2025-01-01', year: 2025, revenue: 32000, participants: 4500, buyers: 820, revenuePerParticipant: 7.11, buyerPercentage: 18.2, avgOrder: 39.02, imagesPerParticipant: 0, images: 0, isTriathlon: true },

  { id: '21', event: 'Swimrun Lac de Laffrey', date: '2023-01-01', year: 2023, revenue: 15000, participants: 2000, buyers: 340, revenuePerParticipant: 7.50, buyerPercentage: 17.0, avgOrder: 44.12, imagesPerParticipant: 0, images: 0, isTriathlon: true },
  { id: '22', event: 'Swimrun Lac de Laffrey', date: '2024-01-01', year: 2024, revenue: 18000, participants: 2200, buyers: 380, revenuePerParticipant: 8.18, buyerPercentage: 17.3, avgOrder: 47.37, imagesPerParticipant: 0, images: 0, isTriathlon: true },
  { id: '23', event: 'Swimrun Lac de Laffrey', date: '2025-01-01', year: 2025, revenue: 21000, participants: 2400, buyers: 420, revenuePerParticipant: 8.75, buyerPercentage: 17.5, avgOrder: 50.00, imagesPerParticipant: 0, images: 0, isTriathlon: true },

  // SAINTÉLYON
  { id: '24', event: 'SAINTÉLYON', date: '2023-01-01', year: 2023, revenue: 45000, participants: 8000, buyers: 850, revenuePerParticipant: 5.63, buyerPercentage: 10.6, avgOrder: 52.94, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '25', event: 'SAINTÉLYON', date: '2024-01-01', year: 2024, revenue: 52000, participants: 8500, buyers: 920, revenuePerParticipant: 6.12, buyerPercentage: 10.8, avgOrder: 56.52, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '26', event: 'SAINTÉLYON', date: '2025-01-01', year: 2025, revenue: 58000, participants: 9000, buyers: 1000, revenuePerParticipant: 6.44, buyerPercentage: 11.1, avgOrder: 58.00, imagesPerParticipant: 0, images: 0, isTriathlon: false },

  // Trail des Forts de Besançon
  { id: '27', event: 'Trail des Forts de Besançon', date: '2023-01-01', year: 2023, revenue: 12000, participants: 1800, buyers: 220, revenuePerParticipant: 6.67, buyerPercentage: 12.2, avgOrder: 54.55, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '28', event: 'Trail des Forts de Besançon', date: '2024-01-01', year: 2024, revenue: 14500, participants: 2000, buyers: 250, revenuePerParticipant: 7.25, buyerPercentage: 12.5, avgOrder: 58.00, imagesPerParticipant: 0, images: 0, isTriathlon: false },
  { id: '29', event: 'Trail des Forts de Besançon', date: '2025-01-01', year: 2025, revenue: 17000, participants: 2200, buyers: 280, revenuePerParticipant: 7.73, buyerPercentage: 12.7, avgOrder: 60.71, imagesPerParticipant: 0, images: 0, isTriathlon: false },
];

// Données pour le total annuel
export interface YearlyTotal {
  year: number;
  runners: number;
  revenue: number;
  buyers: number;
  revenuePerRunner: number;
  buyerPercentage: number;
  avgOrder: number;
}

export const yearlyTotals: YearlyTotal[] = [
  { year: 2019, runners: 2680, revenue: 2085, buyers: 110, revenuePerRunner: 0.78, buyerPercentage: 4.1, avgOrder: 18.95 },
  { year: 2020, runners: 39468, revenue: 87017, buyers: 3397, revenuePerRunner: 2.20, buyerPercentage: 8.6, avgOrder: 25.62 },
  { year: 2021, runners: 87498, revenue: 292018, buyers: 10026, revenuePerRunner: 3.34, buyerPercentage: 11.5, avgOrder: 29.13 },
  { year: 2022, runners: 189883, revenue: 566075, buyers: 20955, revenuePerRunner: 2.98, buyerPercentage: 11.0, avgOrder: 27.01 },
  { year: 2023, runners: 329567, revenue: 759950, buyers: 29080, revenuePerRunner: 2.31, buyerPercentage: 8.8, avgOrder: 26.13 },
  { year: 2024, runners: 504763, revenue: 1455615, buyers: 47064, revenuePerRunner: 2.88, buyerPercentage: 9.3, avgOrder: 30.93 },
  { year: 2025, runners: 615548, revenue: 1669640, buyers: 55697, revenuePerRunner: 2.71, buyerPercentage: 9.0, avgOrder: 29.98 },
  { year: 2026, runners: 247190, revenue: 699090, buyers: 25629, revenuePerRunner: 2.83, buyerPercentage: 10.4, avgOrder: 27.28 },
];

// Types pour les données du dashboard

export interface PastEventData {
  id: string;
  date: string;
  event: string;
  revenue: number;
  participants: number;
  buyers: number;
  revenuePerParticipant: number;
  buyerPercentage: number;
  avgOrder: number;
  imagesPerParticipant: number;
  images: number;
}

export interface CurrentOrderData {
  articleNumber: string;
  date: string;
  time: string;
  email: string;
  eventName: string;
  articleName: string;
  quantity: number;
  paymentAmount: number;
  paymentCurrency: string;
  transferAmount: number;
  transferCurrency: string;
  refund: number;
  bib: string;
  taxRate: number;
}

export interface NowEventData {
  event: string;
  date: string;
  totalRevenue: number;
  revenuePerParticipant: number;
  buyerPercentage: number;
  participants: number;
  orders: number;
  avgOrder: number;
  photos: number;
}

export interface AliasData {
  variant: string;
  canonical: string;
}

export interface AggregatedEventData extends PastEventData {
  year: number;
  isTriathlon: boolean;
}

export interface EventEvolution {
  eventName: string;
  yearlyData: {
    year: number;
    revenue: number;
    buyers: number;
    participants: number;
    avgOrder: number;
    buyerPercentage: number;
  }[];
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalEvents: number;
  totalBuyers: number;
  avgOrderValue: number;
  avgBuyerRate: number;
  topEvents: AggregatedEventData[];
  recentEvents: AggregatedEventData[];
}

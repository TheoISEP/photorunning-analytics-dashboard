'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface YearlyStats {
  year: string;
  participants: number;
  revenue: number;
  buyers: number;
  revenuePerParticipant: number;
  buyerPercentage: number;
  avgOrder: number;
}

interface YearlyComparisonProps {
  allCoursesData: YearlyStats[];
  triatlonData: YearlyStats[];
}

export default function YearlyComparison({ allCoursesData, triatlonData }: YearlyComparisonProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculateEvolution = (current: number, previous: number | undefined) => {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  };

  const renderTable = (data: YearlyStats[], title: string, bgColor: string) => {
    // Trier par année décroissante
    const sortedData = [...data].sort((a, b) => b.year.localeCompare(a.year));

    // Calculer les totaux
    const totals = sortedData.reduce((acc, year) => ({
      participants: acc.participants + year.participants,
      revenue: acc.revenue + year.revenue,
      buyers: acc.buyers + year.buyers,
      revenuePerParticipant: 0,
      buyerPercentage: 0,
      avgOrder: 0
    }), { participants: 0, revenue: 0, buyers: 0, revenuePerParticipant: 0, buyerPercentage: 0, avgOrder: 0 });

    totals.revenuePerParticipant = totals.participants > 0 ? totals.revenue / totals.participants : 0;
    totals.buyerPercentage = totals.participants > 0 ? (totals.buyers / totals.participants) * 100 : 0;
    totals.avgOrder = totals.buyers > 0 ? totals.revenue / totals.buyers : 0;

    return (
      <Card className="border-none shadow-lg">
        <CardHeader className={`${bgColor} text-white`}>
          <CardTitle className="text-base sm:text-lg font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${bgColor} text-white`}>
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-semibold uppercase tracking-wider">
                    Année
                  </th>
                  <th className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-semibold uppercase tracking-wider">
                    Coureurs
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-semibold uppercase tracking-wider">
                    CA
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-semibold uppercase tracking-wider">
                    Acheteurs
                  </th>
                  <th className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-semibold uppercase tracking-wider">
                    CA/coureur
                  </th>
                  <th className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-semibold uppercase tracking-wider">
                    % ach.
                  </th>
                  <th className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-semibold uppercase tracking-wider">
                    Panier moy.
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((yearData, index) => {
                  const previousYear = sortedData[index + 1];
                  const caEvolution = calculateEvolution(yearData.revenue, previousYear?.revenue);

                  return (
                    <tr key={yearData.year} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm font-bold text-gray-900">
                        {yearData.year}
                      </td>
                      <td className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-gray-900 text-right">
                        {yearData.participants.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-gray-900 text-right font-semibold">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <span className="truncate">{yearData.revenue.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })}</span>
                          {caEvolution !== null && (
                            <span className={`text-[8px] sm:text-xs flex-shrink-0 ${caEvolution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {caEvolution >= 0 ? <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 inline" /> : <TrendingDown className="w-2 h-2 sm:w-3 sm:h-3 inline" />}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-gray-900 text-right">
                        {yearData.buyers.toLocaleString('fr-FR')}
                      </td>
                      <td className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-gray-600 text-right">
                        {Math.round(yearData.revenuePerParticipant).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </td>
                      <td className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-right">
                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-xs font-medium bg-blue-100 text-blue-800">
                          {yearData.buyerPercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-gray-600 text-right">
                        {Math.round(yearData.avgOrder).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </td>
                    </tr>
                  );
                })}
                {/* Ligne Total */}
                <tr className={`${bgColor} text-white font-bold`}>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm">Total</td>
                  <td className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-right">
                    {totals.participants.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-right">
                    {totals.revenue.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-right">
                    {totals.buyers.toLocaleString('fr-FR')}
                  </td>
                  <td className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-right">
                    {Math.round(totals.revenuePerParticipant).toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </td>
                  <td className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-right">
                    {totals.buyerPercentage.toFixed(1)}%
                  </td>
                  <td className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-sm text-right">
                    {Math.round(totals.avgOrder).toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {allCoursesData.length > 0 && renderTable(
        allCoursesData,
        'Total Toutes Courses Confondues',
        'bg-gradient-to-r from-red-600 to-red-700'
      )}

      {triatlonData.length > 0 && renderTable(
        triatlonData,
        'Total Triathlons / Swimrun / T24 / Ventouxman / Bayman',
        'bg-gradient-to-r from-yellow-500 to-yellow-600'
      )}
    </div>
  );
}

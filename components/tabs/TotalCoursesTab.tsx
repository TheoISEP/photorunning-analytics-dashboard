'use client';

import { useMemo } from 'react';
import { AggregatedEventData } from '@/types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TotalCoursesTabProps {
  events: AggregatedEventData[];
}

export default function TotalCoursesTab({ events }: TotalCoursesTabProps) {
  // Calculer les totaux par année
  const yearlyTotals = useMemo(() => {
    const yearMap = new Map<number, {
      runners: number;
      revenue: number;
      buyers: number;
    }>();

    events.forEach(event => {
      if (!yearMap.has(event.year)) {
        yearMap.set(event.year, { runners: 0, revenue: 0, buyers: 0 });
      }
      const yearData = yearMap.get(event.year)!;
      yearData.runners += event.participants;
      yearData.revenue += event.revenue;
      yearData.buyers += event.buyers;
    });

    const totals = Array.from(yearMap.entries()).map(([year, data]) => ({
      year,
      runners: data.runners,
      revenue: Math.round(data.revenue),
      buyers: data.buyers,
      revenuePerRunner: data.runners > 0 ? data.revenue / data.runners : 0,
      buyerPercentage: data.runners > 0 ? (data.buyers / data.runners) * 100 : 0,
      avgOrder: data.buyers > 0 ? data.revenue / data.buyers : 0,
    })).sort((a, b) => a.year - b.year);

    // Calculer le total général
    const grandTotal = {
      runners: totals.reduce((sum, y) => sum + y.runners, 0),
      revenue: totals.reduce((sum, y) => sum + y.revenue, 0),
      buyers: totals.reduce((sum, y) => sum + y.buyers, 0),
      revenuePerRunner: 0,
      buyerPercentage: 0,
      avgOrder: 0,
    };

    grandTotal.revenuePerRunner = grandTotal.runners > 0 ? grandTotal.revenue / grandTotal.runners : 0;
    grandTotal.buyerPercentage = grandTotal.runners > 0 ? (grandTotal.buyers / grandTotal.runners) * 100 : 0;
    grandTotal.avgOrder = grandTotal.buyers > 0 ? grandTotal.revenue / grandTotal.buyers : 0;

    return { totals, grandTotal };
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Total Toutes Courses Confondues</h2>
        <p className="text-gray-600 mt-1">Vue d'ensemble de toutes les courses par année</p>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution du CA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du CA</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={yearlyTotals.totals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => `€${value.toLocaleString('fr-FR')}`}
              />
              <Line type="monotone" dataKey="revenue" name="CA" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Évolution des acheteurs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des acheteurs</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={yearlyTotals.totals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value: any) => Number(value).toLocaleString('fr-FR')} />
              <Bar dataKey="buyers" name="Acheteurs" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header avec titre */}
        <div className="bg-red-600 px-6 py-4 text-center">
          <h3 className="text-xl font-bold text-white">Total Toutes Courses Confondues</h3>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-4 py-3 text-center font-semibold">Année</th>
                <th className="px-4 py-3 text-center font-semibold">Nb de coureurs</th>
                <th className="px-4 py-3 text-center font-semibold">CA</th>
                <th className="px-4 py-3 text-center font-semibold">Nb d'acheteurs</th>
                <th className="px-4 py-3 text-center font-semibold">CA/coureur</th>
                <th className="px-4 py-3 text-center font-semibold">% acheteurs</th>
                <th className="px-4 py-3 text-center font-semibold">Panier moyen</th>
              </tr>
            </thead>
            <tbody>
              {yearlyTotals.totals.map((yearData, index) => (
                <tr
                  key={yearData.year}
                  className={`border-b border-gray-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-center font-medium">{yearData.year}</td>
                  <td className="px-4 py-3 text-center">
                    {yearData.runners.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    €{yearData.revenue.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {yearData.buyers.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    €{yearData.revenuePerRunner.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {yearData.buyerPercentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    €{yearData.avgOrder.toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Ligne Total */}
              <tr className="bg-red-600 text-white font-bold">
                <td className="px-4 py-3 text-center">Total</td>
                <td className="px-4 py-3 text-center">
                  {yearlyTotals.grandTotal.runners.toLocaleString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-center">
                  €{yearlyTotals.grandTotal.revenue.toLocaleString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-center">
                  {yearlyTotals.grandTotal.buyers.toLocaleString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-center">
                  €{yearlyTotals.grandTotal.revenuePerRunner.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  {yearlyTotals.grandTotal.buyerPercentage.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-center">
                  €{yearlyTotals.grandTotal.avgOrder.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

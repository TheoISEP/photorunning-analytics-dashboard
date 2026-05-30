'use client';

import { useState, useMemo } from 'react';
import { AggregatedEventData } from '@/types';
import { Search, Download, Filter } from 'lucide-react';

interface EventsTabProps {
  events: AggregatedEventData[];
}

export default function EventsTab({ events }: EventsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'buyers' | 'year'>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtrer et trier les événements
  const filteredEvents = useMemo(() => {
    let filtered = events.filter(event =>
      event.event.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Trier
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.event.localeCompare(b.event);
          break;
        case 'revenue':
          comparison = a.revenue - b.revenue;
          break;
        case 'buyers':
          comparison = a.buyers - b.buyers;
          break;
        case 'year':
          comparison = a.year - b.year;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [events, searchQuery, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Événement',
      'Année',
      'CA (€)',
      'Participants',
      'Acheteurs',
      'Taux d\'achat (%)',
      'Panier moyen (€)',
      'CA/Participant (€)',
      'Images',
      'Images/Participant'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredEvents.map(event => [
        `"${event.event}"`,
        event.year,
        event.revenue.toFixed(2),
        event.participants,
        event.buyers,
        event.buyerPercentage.toFixed(2),
        event.avgOrder.toFixed(2),
        event.revenuePerParticipant.toFixed(2),
        event.images,
        event.imagesPerParticipant.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'photorunning-events.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Titre et actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Événements</h2>
          <p className="text-gray-600 mt-1">
            {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Tri */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="revenue">CA</option>
              <option value="buyers">Acheteurs</option>
              <option value="name">Nom</option>
              <option value="year">Année</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des événements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Événement {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('year')}
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Année {sortBy === 'year' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('revenue')}
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  CA (€) {sortBy === 'revenue' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th
                  onClick={() => handleSort('buyers')}
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Acheteurs {sortBy === 'buyers' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux d'achat (%)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Panier moyen (€)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CA/Part. (€)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event, index) => (
                <tr key={index} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {event.event}
                      {event.isTriathlon && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                          Triathlon
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {event.year}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {event.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {event.participants.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {event.buyers.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {event.buyerPercentage.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {event.avgOrder.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {event.revenuePerParticipant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

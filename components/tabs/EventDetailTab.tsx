'use client';

import { useState, useMemo } from 'react';
import { AggregatedEventData } from '@/types';
import { Search, Calculator } from 'lucide-react';

interface EventDetailTabProps {
  events: AggregatedEventData[];
}

export default function EventDetailTab({ events }: EventDetailTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Liste unique des noms d'événements
  const uniqueEvents = useMemo(() => {
    const eventNames = new Set(events.map(e => e.event));
    return Array.from(eventNames).sort();
  }, [events]);

  // Événements filtrés par recherche
  const filteredEventNames = useMemo(() => {
    return uniqueEvents.filter(name =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueEvents, searchQuery]);

  // Données de l'événement sélectionné groupées par année
  const selectedEventData = useMemo(() => {
    if (!selectedEvent) return null;

    const eventData = events
      .filter(e => e.event === selectedEvent)
      .sort((a, b) => a.year - b.year);

    if (eventData.length === 0) return null;

    // Calculer les totaux
    const total = {
      runners: eventData.reduce((sum, e) => sum + e.participants, 0),
      revenue: eventData.reduce((sum, e) => sum + e.revenue, 0),
      buyers: eventData.reduce((sum, e) => sum + e.buyers, 0),
      avgRevenuePerRunner: 0,
      avgBuyerPercentage: 0,
      avgOrder: 0,
    };

    total.avgRevenuePerRunner = total.runners > 0 ? total.revenue / total.runners : 0;
    total.avgBuyerPercentage = total.runners > 0 ? (total.buyers / total.runners) * 100 : 0;
    total.avgOrder = total.buyers > 0 ? total.revenue / total.buyers : 0;

    return {
      name: selectedEvent,
      years: eventData,
      total,
    };
  }, [selectedEvent, events]);

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Recherche par événement</h2>
        <p className="text-gray-600 mt-1">Consultez l'évolution d'un événement année par année</p>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
          />
        </div>

        {/* Liste des événements */}
        {searchQuery && (
          <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredEventNames.map((eventName) => (
              <button
                key={eventName}
                onClick={() => {
                  setSelectedEvent(eventName);
                  setSearchQuery('');
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{eventName}</span>
                  <span className="text-sm text-gray-500">
                    {events.filter(e => e.event === eventName).length} année(s)
                  </span>
                </div>
              </button>
            ))}
            {filteredEventNames.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                Aucun événement trouvé
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tableau de l'événement sélectionné */}
      {selectedEventData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header avec titre de l'événement */}
          <div className="bg-blue-600 px-6 py-4 text-center">
            <h3 className="text-xl font-bold text-white">{selectedEventData.name}</h3>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
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
                {selectedEventData.years.map((yearData, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-center font-medium">{yearData.year}</td>
                    <td className="px-4 py-3 text-center">
                      {yearData.participants > 0 ? yearData.participants.toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {yearData.revenue > 0 ? `€${Math.round(yearData.revenue).toLocaleString('fr-FR')}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {yearData.buyers > 0 ? yearData.buyers.toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {yearData.revenuePerParticipant > 0 ? `€${yearData.revenuePerParticipant.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {yearData.buyerPercentage > 0 ? `${yearData.buyerPercentage.toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {yearData.avgOrder > 0 ? `€${yearData.avgOrder.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}

                {/* Ligne Total */}
                <tr className="bg-blue-600 text-white font-bold">
                  <td className="px-4 py-3 text-center">Total</td>
                  <td className="px-4 py-3 text-center">
                    {selectedEventData.total.runners.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    €{Math.round(selectedEventData.total.revenue).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {selectedEventData.total.buyers.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    €{selectedEventData.total.avgRevenuePerRunner.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {selectedEventData.total.avgBuyerPercentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    €{selectedEventData.total.avgOrder.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message si aucun événement sélectionné */}
      {!selectedEventData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sélectionnez un événement
          </h3>
          <p className="text-gray-600">
            Recherchez et sélectionnez un événement pour voir son évolution détaillée
          </p>
        </div>
      )}
    </div>
  );
}

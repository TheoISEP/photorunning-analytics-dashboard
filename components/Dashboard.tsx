'use client';

import { useState, useEffect } from 'react';
import { clearAuthSession } from '@/lib/auth';
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { AggregatedEventData } from '@/types';
import {
  fetchPastData,
  fetchCurrentData,
  fetchAliaseData
} from '@/lib/googleSheets';
import {
  mergeEventData,
  aggregateCurrentData,
  calculateEventEvolution,
  calculateYearlyEvolution,
  filterTriathlons
} from '@/lib/dataProcessing';
import OverviewTab from './tabs/OverviewTab';
import EventDetailTab from './tabs/EventDetailTab';
import TotalCoursesTab from './tabs/TotalCoursesTab';
import TotalTriathlonsTab from './tabs/TotalTriathlonsTab';

type TabId = 'overview' | 'event-detail' | 'total-courses' | 'total-triathlons';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'event-detail', label: 'Par événement', icon: <Calendar className="w-5 h-5" /> },
  { id: 'total-courses', label: 'Total Courses', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'total-triathlons', label: 'Total Triathlons', icon: <TrendingUp className="w-5 h-5" /> },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<AggregatedEventData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TEMPORAIRE : Utiliser les données mockées
      // Une fois les GIDs corrects trouvés, décommenter le code ci-dessous

      // Charger toutes les données en parallèle
      // const [pastData, currentData, aliasMap] = await Promise.all([
      //   fetchPastData(),
      //   fetchCurrentData(),
      //   fetchAliaseData(),
      // ]);

      // Agréger les données Current
      // const aggregatedCurrent = aggregateCurrentData(currentData, aliasMap);

      // Fusionner les données
      // const mergedEvents = mergeEventData(pastData, aggregatedCurrent, aliasMap);

      // UTILISER LES DONNÉES MOCKÉES
      const { mockEvents } = await import('@/lib/mockData');
      setEvents(mockEvents);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    window.location.reload();
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewTab events={events} />;
      case 'event-detail':
        return <EventDetailTab events={events} />;
      case 'total-courses':
        return <TotalCoursesTab events={events} />;
      case 'total-triathlons':
        return <TotalTriathlonsTab events={events} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                PhotoRunning Analytics
              </h1>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200
            transition-transform duration-300 z-30
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition
                  ${activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderTabContent()}
        </main>
      </div>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { clearAuthSession } from '@/lib/auth';
import { fetchPastData, fetchCurrentData, fetchAliaseData, normalizeEventName } from '@/lib/googleSheets';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  ShoppingCart,
  Euro,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EventStats {
  name: string;
  ca: number;
  buyers: number;
  orders: number;
  avgOrder: number;
}

export default function RealDataDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCA: 0,
    totalBuyers: 0,
    totalOrders: 0,
    nombreEvenements: 0,
    panierMoyen: 0,
    topEvents: [] as EventStats[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger les données depuis Google Sheets
      const [pastData, currentData, aliasMap] = await Promise.all([
        fetchPastData(),
        fetchCurrentData(),
        fetchAliaseData(),
      ]);

      // Créer un map pour agréger les données par événement
      const eventMap = new Map<string, {
        ca: number;
        buyers: Set<string>;
        orders: number;
      }>();

      // Agréger les données Current
      currentData.forEach((order) => {
        const normalizedName = normalizeEventName(order.eventName, aliasMap);
        // Compter tous les transferAmount (positifs et négatifs)
        // Ignorer seulement les lignes avec transferAmount = 0 (remboursements sans vente initiale)
        if (order.transferAmount !== 0) {
          if (!eventMap.has(normalizedName)) {
            eventMap.set(normalizedName, {
              ca: 0,
              buyers: new Set(),
              orders: 0
            });
          }

          const eventData = eventMap.get(normalizedName)!;
          eventData.ca += order.transferAmount;
          eventData.orders++;
          if (order.email) {
            eventData.buyers.add(order.email.toLowerCase());
          }
        }
      });

      // Calculer les statistiques
      let totalCA = 0;
      const allBuyers = new Set<string>();
      let totalOrders = 0;

      const topEvents: EventStats[] = [];

      eventMap.forEach((data, name) => {
        totalCA += data.ca;
        totalOrders += data.orders;
        data.buyers.forEach(buyer => allBuyers.add(buyer));

        topEvents.push({
          name,
          ca: Math.round(data.ca * 100) / 100,
          buyers: data.buyers.size,
          orders: data.orders,
          avgOrder: data.buyers.size > 0 ? Math.round((data.ca / data.buyers.size) * 100) / 100 : 0
        });
      });

      // Trier par CA décroissant
      topEvents.sort((a, b) => b.ca - a.ca);

      setStats({
        totalCA: Math.round(totalCA * 100) / 100,
        totalBuyers: allBuyers.size,
        totalOrders,
        nombreEvenements: eventMap.size,
        panierMoyen: allBuyers.size > 0 ? Math.round((totalCA / allBuyers.size) * 100) / 100 : 0,
        topEvents: topEvents.slice(0, 10)
      });

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    window.location.reload();
  };

  const sidebarWidth = sidebarCollapsed ? 'w-[80px]' : 'w-80';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Chargement des données...</p>
          <p className="text-sm text-gray-500 mt-2">Récupération depuis Google Sheets</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadData} variant="default">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ${sidebarWidth} z-50`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          {!sidebarCollapsed && (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              PhotoRunning
            </h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition bg-gradient-to-r from-red-500 to-rose-500 text-white"
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-gray-700 hover:bg-gray-100"
          >
            <Calendar className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Événements</span>}
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Déconnexion</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[80px]' : 'ml-80'} p-8`}>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Analytics</h2>
          <p className="text-gray-600 mt-1">Données en temps réel depuis Google Sheets</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Chiffre d'affaires</CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <Euro className="w-5 h-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalCA.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
              <p className="text-xs text-gray-500 mt-2">{stats.totalOrders.toLocaleString('fr-FR')} commandes</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Acheteurs</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalBuyers.toLocaleString('fr-FR')}
              </div>
              <p className="text-xs text-gray-500 mt-2">Acheteurs uniques</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Panier moyen</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.panierMoyen.toFixed(2)} €
              </div>
              <p className="text-xs text-gray-500 mt-2">Par commande</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Événements</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.nombreEvenements}
              </div>
              <p className="text-xs text-gray-500 mt-2">Événements couverts</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Top 10 Événements par CA</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.topEvents}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={150}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="ca" fill="#DC2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Acheteurs par Événement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stats.topEvents}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={150}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString('fr-FR')}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="buyers" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Détail des Événements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Événement
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CA (€)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acheteurs
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commandes
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Panier moyen (€)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topEvents.map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4 text-sm text-gray-900">{event.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                        {event.ca.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 text-right">
                        {event.buyers.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 text-right">
                        {event.orders.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 text-right">
                        {event.avgOrder.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

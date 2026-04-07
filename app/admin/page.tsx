'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Users, Car, DollarSign, TrendingUp, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const { profile, logOut } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalRides: 0,
    activeDrivers: 0,
    totalUsers: 0
  });

  const [recentRides, setRecentRides] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) {
      router.push('/');
      return;
    }
    if (profile.role !== 'admin') {
      router.push(`/${profile.role}`);
      return;
    }

    // Listen to users for stats
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      let activeDrivers = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.role === 'driver' && data.status === 'online') activeDrivers++;
      });
      setStats(prev => ({ ...prev, totalUsers: snapshot.size, activeDrivers }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    // Listen to rides for stats and list
    const qRides = query(collection(db, 'rides'), orderBy('createdAt', 'desc'));
    const unsubRides = onSnapshot(qRides, (snapshot) => {
      let revenue = 0;
      const rides: any[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        rides.push({ id: doc.id, ...data });
        if (data.status === 'completed' && data.platformFee) {
          revenue += data.platformFee;
        }
      });
      
      setStats(prev => ({ ...prev, totalRides: snapshot.size, totalRevenue: revenue }));
      setRecentRides(rides.slice(0, 10)); // Show last 10
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rides');
    });

    return () => {
      unsubUsers();
      unsubRides();
    };
  }, [profile, router]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-black text-white p-4 flex justify-between items-center shadow-md">
        <div className="font-bold text-xl flex items-center gap-2">
          <span className="text-orange-500">🐺</span> Coyote Admin
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-300">{profile.name}</span>
          <button onClick={logOut} className="text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Visão geral da plataforma</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-100 p-3 rounded-xl text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Receita (Taxas)</p>
                <h3 className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</h3>
              </div>
            </div>
            <div className="text-sm text-green-600 flex items-center gap-1 font-medium">
              <TrendingUp className="w-4 h-4" /> +12% hoje
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Corridas Totais</p>
                <h3 className="text-2xl font-bold">{stats.totalRides}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Motoristas Online</p>
                <h3 className="text-2xl font-bold">{stats.activeDrivers}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total de Usuários</p>
                <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Rides Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold">Corridas Recentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Tipo</th>
                  <th className="px-6 py-4 font-medium">Origem</th>
                  <th className="px-6 py-4 font-medium">Destino</th>
                  <th className="px-6 py-4 font-medium">Valor Total</th>
                  <th className="px-6 py-4 font-medium">Taxa Plat.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRides.map(ride => (
                  <tr key={ride.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{ride.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${ride.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          ride.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          'bg-blue-100 text-blue-700'}`}
                      >
                        {ride.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize">{ride.vehicleType}</td>
                    <td className="px-6 py-4 truncate max-w-[150px]">{ride.origin.address}</td>
                    <td className="px-6 py-4 truncate max-w-[150px]">{ride.destination.address}</td>
                    <td className="px-6 py-4 font-medium">R$ {ride.price?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">
                      {ride.platformFee ? `R$ ${ride.platformFee.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
                {recentRides.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Nenhuma corrida registrada ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

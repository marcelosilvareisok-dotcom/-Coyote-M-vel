'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { collection, doc, updateDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { MapPin, Navigation, DollarSign, LogOut, Power, CheckCircle } from 'lucide-react';

export default function DriverDashboard() {
  const { profile, logOut } = useAuth();
  const router = useRouter();
  
  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [activeRide, setActiveRide] = useState<any>(null);

  useEffect(() => {
    if (!profile) {
      router.push('/');
      return;
    }
    if (profile.role !== 'driver') {
      router.push(`/${profile.role}`);
      return;
    }

    setIsOnline(profile.status === 'online');

    // Listen to available rides
    const qAvailable = query(
      collection(db, 'rides'),
      where('status', '==', 'requested'),
      where('vehicleType', '==', profile.vehicleType || 'car'),
      orderBy('createdAt', 'desc')
    );

    const unsubAvailable = onSnapshot(qAvailable, (snapshot) => {
      setAvailableRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rides');
    });

    // Listen to my active ride
    const qActive = query(
      collection(db, 'rides'),
      where('driverId', '==', profile.uid),
      where('status', 'in', ['accepted', 'in_progress'])
    );

    const unsubActive = onSnapshot(qActive, (snapshot) => {
      if (!snapshot.empty) {
        setActiveRide({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActiveRide(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rides');
    });

    return () => {
      unsubAvailable();
      unsubActive();
    };
  }, [profile, router]);

  const toggleStatus = async () => {
    if (!profile) return;
    const newStatus = isOnline ? 'offline' : 'online';
    try {
      await updateDoc(doc(db, 'users', profile.uid), { status: newStatus });
      setIsOnline(!isOnline);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const acceptRide = async (rideId: string, price: number) => {
    if (!profile) return;
    try {
      // Calculate commissions
      const commissionRate = profile.vehicleType === 'car' ? 0.20 : 0.25;
      const platformFee = price * commissionRate;
      const driverEarnings = price - platformFee;

      await updateDoc(doc(db, 'rides', rideId), {
        status: 'accepted',
        driverId: profile.uid,
        driverEarnings,
        platformFee
      });
      
      await updateDoc(doc(db, 'users', profile.uid), { status: 'busy' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rides/${rideId}`);
    }
  };

  const updateRideStatus = async (status: 'in_progress' | 'completed') => {
    if (!activeRide || !profile) return;
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completedAt = new Date();
        // Here we would also update driver balance in a real app (using a transaction)
      }
      
      await updateDoc(doc(db, 'rides', activeRide.id), updateData);
      
      if (status === 'completed') {
        await updateDoc(doc(db, 'users', profile.uid), { status: 'online' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rides/${activeRide.id}`);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-black text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="font-bold text-xl flex items-center gap-2">
          <span className="text-orange-500">🐺</span> Motorista
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 px-3 py-1 rounded-full flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="font-bold">R$ {(profile.balance || 0).toFixed(2)}</span>
          </div>
          <button onClick={logOut} className="text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full flex flex-col gap-6">
        
        {/* Status Toggle */}
        {!activeRide && (
          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{isOnline ? 'Você está Online' : 'Você está Offline'}</h2>
              <p className="text-gray-500 text-sm">
                {isOnline ? 'Aguardando chamadas...' : 'Fique online para receber corridas'}
              </p>
            </div>
            <button 
              onClick={toggleStatus}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-colors ${isOnline ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              <Power className="w-8 h-8" />
            </button>
          </div>
        )}

        {/* Active Ride */}
        {activeRide && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-orange-500">
            <div className="bg-orange-500 text-white p-4 text-center font-bold text-lg">
              {activeRide.status === 'accepted' ? 'Indo buscar passageiro' : 'Em viagem'}
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Origem</p>
                    <p className="font-medium text-lg">{activeRide.origin.address}</p>
                  </div>
                </div>
                <div className="border-l-2 border-dashed border-gray-300 ml-2.5 h-4"></div>
                <div className="flex items-start gap-3">
                  <Navigation className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Destino</p>
                    <p className="font-medium text-lg">{activeRide.destination.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium">Seu ganho:</span>
                <span className="font-bold text-2xl text-green-600">R$ {activeRide.driverEarnings?.toFixed(2)}</span>
              </div>

              {activeRide.status === 'accepted' ? (
                <button 
                  onClick={() => updateRideStatus('in_progress')}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
                >
                  Iniciar Viagem
                </button>
              ) : (
                <button 
                  onClick={() => updateRideStatus('completed')}
                  className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-6 h-6" /> Finalizar Viagem
                </button>
              )}
            </div>
          </div>
        )}

        {/* Available Rides List */}
        {isOnline && !activeRide && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-500 uppercase text-sm tracking-wider">Corridas Disponíveis</h3>
            
            {availableRides.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
                <div className="animate-pulse flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
                Buscando passageiros próximos...
              </div>
            ) : (
              availableRides.map(ride => (
                <div key={ride.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded mb-2">
                        {ride.distance} km • {ride.duration} min
                      </span>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MapPin className="w-4 h-4" /> {ride.origin.address}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Navigation className="w-4 h-4 text-orange-500" /> {ride.destination.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Ganho estimado</p>
                      <p className="text-xl font-bold text-green-600">
                        R$ {(ride.price * (profile.vehicleType === 'car' ? 0.8 : 0.75)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => acceptRide(ride.id, ride.price)}
                    className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
                  >
                    Aceitar Corrida
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </main>
    </div>
  );
}

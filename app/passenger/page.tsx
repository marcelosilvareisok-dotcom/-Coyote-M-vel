'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { MapPin, Navigation, Clock, CreditCard, LogOut, Car, Bike } from 'lucide-react';

export default function PassengerDashboard() {
  const { profile, logOut } = useAuth();
  const router = useRouter();
  
  const [destination, setDestination] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) {
      router.push('/');
      return;
    }
    if (profile.role !== 'passenger') {
      router.push(`/${profile.role}`);
      return;
    }

    // Listen to active rides
    const q = query(
      collection(db, 'rides'),
      where('passengerId', '==', profile.uid),
      where('status', 'in', ['requested', 'accepted', 'in_progress']),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setCurrentRide({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setCurrentRide(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rides');
    });

    return () => unsubscribe();
  }, [profile, router]);

  const requestRide = async () => {
    if (!destination || !profile) return;
    setLoading(true);

    try {
      // Simulate distance and price calculation
      const distance = Math.floor(Math.random() * 10) + 2; // 2-12 km
      const basePrice = vehicleType === 'car' ? 5 : 3;
      const pricePerKm = vehicleType === 'car' ? 2 : 1.2;
      const price = basePrice + (distance * pricePerKm);

      await addDoc(collection(db, 'rides'), {
        passengerId: profile.uid,
        status: 'requested',
        origin: { address: 'Localização Atual', lat: -23.5505, lng: -46.6333 }, // Mock
        destination: { address: destination, lat: -23.5605, lng: -46.6433 }, // Mock
        vehicleType,
        distance,
        duration: distance * 3, // Mock 3 mins per km
        price: Number(price.toFixed(2)),
        createdAt: serverTimestamp()
      });
      
      setDestination('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rides');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
        <div className="font-bold text-xl flex items-center gap-2">
          <span className="text-orange-500">🐺</span> Coyote
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{profile.name}</span>
          <button onClick={logOut} className="text-gray-500 hover:text-black">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col md:flex-row">
        
        {/* Map Area (Simulated) */}
        <div className="flex-1 bg-gray-200 relative overflow-hidden min-h-[50vh]">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/1000/1000')] bg-cover bg-center opacity-50 mix-blend-multiply" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black text-white px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              Você está aqui
            </div>
          </div>
        </div>

        {/* Panel */}
        <div className="w-full md:w-96 bg-white shadow-xl flex flex-col z-10 rounded-t-3xl md:rounded-none -mt-6 md:mt-0 relative">
          <div className="p-6 flex-1">
            
            {currentRide ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-full mb-4">
                    {currentRide.status === 'requested' && <Clock className="w-8 h-8 animate-pulse" />}
                    {currentRide.status === 'accepted' && <Car className="w-8 h-8" />}
                    {currentRide.status === 'in_progress' && <Navigation className="w-8 h-8" />}
                  </div>
                  <h2 className="text-xl font-bold">
                    {currentRide.status === 'requested' && 'Procurando motorista...'}
                    {currentRide.status === 'accepted' && 'Motorista a caminho!'}
                    {currentRide.status === 'in_progress' && 'Em viagem'}
                  </h2>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase">Origem</p>
                      <p className="font-medium">{currentRide.origin.address}</p>
                    </div>
                  </div>
                  <div className="border-l-2 border-dashed border-gray-300 ml-2.5 h-4"></div>
                  <div className="flex items-start gap-3">
                    <Navigation className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase">Destino</p>
                      <p className="font-medium">{currentRide.destination.address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Preço</span>
                  </div>
                  <span className="font-bold text-lg">R$ {currentRide.price.toFixed(2)}</span>
                </div>

              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Para onde vamos?</h2>
                
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-3.5 text-gray-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      value="Localização Atual"
                      disabled
                      className="w-full bg-gray-100 border-none rounded-xl py-3 pl-12 pr-4 font-medium text-gray-600"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-3.5 text-orange-500">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Digite o destino"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setVehicleType('car')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${vehicleType === 'car' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <Car className="w-8 h-8" />
                    <span className="font-semibold">Carro</span>
                  </button>
                  <button 
                    onClick={() => setVehicleType('motorcycle')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${vehicleType === 'motorcycle' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <Bike className="w-8 h-8" />
                    <span className="font-semibold">Moto</span>
                  </button>
                </div>

                <button 
                  onClick={requestRide}
                  disabled={!destination || loading}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Calculando...' : 'Solicitar Coyote'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

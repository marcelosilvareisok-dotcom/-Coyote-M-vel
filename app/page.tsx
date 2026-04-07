'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Car, MapPin, ShieldCheck, Wallet } from 'lucide-react';

export default function Home() {
  const { user, profile, loading, signIn, setRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'passenger') {
        router.push('/passenger');
      } else if (profile.role === 'driver') {
        router.push('/driver');
      } else if (profile.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [profile, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando...</div>;
  }

  if (user && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo ao Coyote</h1>
          <p className="text-gray-500 mb-8">Como você deseja usar o aplicativo?</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => setRole('passenger')}
              className="w-full flex items-center justify-center gap-3 bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              Quero ser Passageiro
            </button>
            <button 
              onClick={() => setRole('driver')}
              className="w-full flex items-center justify-center gap-3 bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              <Car className="w-5 h-5" />
              Quero ser Motorista
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/city/1920/1080')] bg-cover bg-center" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="flex justify-between items-center mb-16">
            <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
              <span className="text-orange-500">🐺</span> Coyote Móvel
            </div>
            <button 
              onClick={signIn}
              className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              Entrar
            </button>
          </div>
          
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              Vá para qualquer lugar, <br/>
              <span className="text-orange-500">mais rápido e barato.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10">
              Carros e motos à sua disposição. O aplicativo de mobilidade focado na sua cidade.
            </p>
            <button 
              onClick={signIn}
              className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              Começar agora <MapPin className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-600">
                <Car className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Carros e Motos</h3>
              <p className="text-gray-600">Escolha a opção que melhor se adapta à sua pressa e ao seu bolso.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-600">
                <Wallet className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Preço Justo</h3>
              <p className="text-gray-600">Corridas mais baratas para você e maiores ganhos para os motoristas.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-600">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Segurança</h3>
              <p className="text-gray-600">Motoristas verificados e corridas monitoradas em tempo real.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

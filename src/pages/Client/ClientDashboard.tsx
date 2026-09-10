import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  X,
  Car,
  User,
  LogOut,
  Search,
  MapPin,
  Clock,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Plus,
  Compass,
} from 'lucide-react';
import { MapView } from '../../components/Parking/MapView';
import { VehicleSelectModal } from '../../components/Parking/VehicleSelectModal';
import { getParking } from '../../services/Parking';
import type { Parking } from '../../types/Parking';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const DEFAULT_PARKING_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  const [parkings, setParkings] = useState<Parking[]>([]);
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar cocheras
  useEffect(() => {
    setLoading(true);
    getParking()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setParkings(list);
        // Si hay cocheras, seleccionar la primera por defecto o ninguna
        if (list.length > 0 && !selectedParkingId) {
          setSelectedParkingId(list[0].id);
        }
      })
      .catch((err) => console.error('Error al cargar estacionamientos:', err))
      .finally(() => setLoading(false));
  }, []);

  // Cocheras filtradas por buscador
  const filteredParkings = useMemo(() => {
    if (!searchQuery.trim()) return parkings;
    const q = searchQuery.toLowerCase();
    return parkings.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.locality?.toLowerCase().includes(q)
    );
  }, [parkings, searchQuery]);

  // Cochera activa seleccionada
  const selectedParking = useMemo(() => {
    return parkings.find((p) => p.id === selectedParkingId) || null;
  }, [parkings, selectedParkingId]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('parkflow_user_id');
    navigate('/login');
  };

  const handleOpenReservation = (parking: Parking) => {
    setSelectedParkingId(parking.id);
    setIsModalOpen(true);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-950 font-sans">
      {/* 1. MAPA EN PANTALLA COMPLETA */}
      <div className="absolute inset-0 z-0">
        <MapView
          spots={filteredParkings}
          selectedId={selectedParkingId}
          onSelect={(id) => {
            setSelectedParkingId(id);
          }}
          prices={{}}
        />
      </div>

      {/* 2. BARRA DE CONTROL SUPERIOR FLOTANTE */}
      <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-3">
        {/* Botón Menú Hamburguesa & Buscador */}
        <div className="flex items-center gap-3 pointer-events-auto w-full max-w-md">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-800 shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            title="Abrir menú de opciones"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Buscador de Cocheras */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar cochera o zona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900/90 text-sm text-white placeholder-zinc-400 border border-zinc-800 shadow-xl backdrop-blur-md focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Botón Flotante para ver Lista / Perfil */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsListDrawerOpen(!isListDrawerOpen)}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-800 shadow-xl backdrop-blur-md text-xs font-semibold transition-all cursor-pointer"
          >
            <Layers className="h-4 w-4 text-blue-400" />
            <span>{isListDrawerOpen ? 'Ocultar Lista' : `Ver Lista (${filteredParkings.length})`}</span>
          </button>

          <Link
            to="/profile"
            className="flex items-center gap-2 p-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-800 shadow-xl backdrop-blur-md text-xs font-semibold transition-all"
            title="Mi Perfil"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
            </div>
            <span className="hidden sm:inline">{user?.name || 'Mi Perfil'}</span>
          </Link>
        </div>
      </header>

      {/* 3. MENÚ LATERAL DESPLEGABLE (DRAWER IZQUIERDO) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 bg-zinc-900/95 border-r border-zinc-800 shadow-2xl backdrop-blur-xl flex flex-col transition-transform duration-300 ease-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del Sidebar */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block">
                Servicio<span className="text-blue-500">Cocheras</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">Panel de Cliente</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tarjeta de Usuario en Sidebar */}
        <div className="p-5 border-b border-zinc-800/60 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">
                {user?.name} {user?.last_name || ''}
              </h4>
              <p className="text-xs text-zinc-400 truncate">{user?.email || 'Cliente'}</p>
            </div>
          </div>
        </div>

        {/* Lista de Navegación y CRUDs */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Gestión y Servicios
          </div>

          {/* Mis Vehículos */}
          <Link
            to="/vehicles"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-blue-600/20 text-zinc-400 group-hover:text-blue-400 transition-colors">
                <Car className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm font-semibold block">Mis Vehículos</span>
                <span className="text-[11px] text-zinc-400">Ver, registrar y modificar</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Registrar Vehículo Directo */}
          <Link
            to="/vehicles/new"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-blue-600/20 text-zinc-400 group-hover:text-blue-400 transition-colors">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm font-semibold block">+ Registrar Vehículo</span>
                <span className="text-[11px] text-zinc-400">Agregar nuevo auto o moto</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Mi Perfil */}
          <Link
            to="/profile"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-blue-600/20 text-zinc-400 group-hover:text-blue-400 transition-colors">
                <User className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm font-semibold block">Mi Perfil y Cuenta</span>
                <span className="text-[11px] text-zinc-400">Datos personales y clave</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <div className="pt-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Exploración
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setIsListDrawerOpen(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-blue-600/20 text-zinc-400 group-hover:text-blue-400 transition-colors">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm font-semibold block">Todas las Cocheras</span>
                <span className="text-[11px] text-zinc-400">Explorar en listado</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </nav>

        {/* Footer Sidebar - Cerrar Sesión */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 4. LISTADO LATERAL DE COCHERAS (SLIDE-OVER DERECHO / DESKTOP) */}
      {isListDrawerOpen && (
        <aside className="absolute top-20 right-4 bottom-6 z-20 w-96 bg-zinc-900/95 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Estacionamientos ({filteredParkings.length})</h3>
              <p className="text-[11px] text-zinc-400">Seleccioná uno para ver en el mapa</p>
            </div>
            <button
              type="button"
              onClick={() => setIsListDrawerOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredParkings.map((p) => {
              const isSelected = p.id === selectedParkingId;
              const imgUrl = p.imageUrl || p.image || DEFAULT_PARKING_IMAGE;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedParkingId(p.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                    isSelected
                      ? 'bg-zinc-800 border-blue-500 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover bg-zinc-900 shrink-0 border border-zinc-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
                    }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                      <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-blue-400 shrink-0" />
                        {p.address}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-zinc-500">{p.openingTime} - {p.closingTime} hs</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReservation(p);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors"
                      >
                        Reservar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* 5. TARJETA FLOTANTE INFERIOR DE COCHERA SELECCIONADA */}
      {selectedParking && (
        <div className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[440px] z-30 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5">
            <div className="flex gap-3.5">
              {/* Foto de la cochera */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-950 border border-zinc-800">
                <img
                  src={selectedParking.imageUrl || selectedParking.image || DEFAULT_PARKING_IMAGE}
                  alt={selectedParking.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
                  }}
                />
              </div>

              {/* Información */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white truncate leading-tight">
                      {selectedParking.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedParkingId(null)}
                      className="text-zinc-500 hover:text-white p-0.5 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1 truncate">
                    <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    {selectedParking.address}, {selectedParking.locality}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-medium text-zinc-300 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-zinc-400" />
                    {selectedParking.openingTime} - {selectedParking.closingTime} hs
                  </span>
                  {selectedParking.carCapacity !== undefined && selectedParking.carCapacity > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-medium text-blue-400 flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {selectedParking.carCapacity} plazas
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de Acción Principal: Reservar Lugar */}
            <button
              type="button"
              onClick={() => handleOpenReservation(selectedParking)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 active:scale-98 transition-all cursor-pointer"
            >
              <span>Reservar en esta Cochera</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL SELECTOR DE VEHÍCULO */}
      <VehicleSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parking={selectedParking}
      />
    </div>
  );
}

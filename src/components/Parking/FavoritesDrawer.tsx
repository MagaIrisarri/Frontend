import { Star, MapPin, Clock, ChevronRight } from 'lucide-react';
import { VICON } from '../Owner/ui/vehicles';
import type { Parking } from '../../types/parking.types';
import { Drawer } from '../Owner/ui/Layer';
import OwnerShell from '../Owner/ui/OwnerShell';
import { Presence } from '../Owner/ui/Presence';
import { Empty } from '../Owner/ui/Page';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteParkings: Parking[];
  onRemoveFavorite: (id: string) => void;
  onSelectParking: (id: string) => void;
  onOpenReservation: (parking: Parking) => void;
}

const DEFAULT_PARKING_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80';

// Panel lateral con el formato del rol dueño (.owner); reemplaza al modal Tailwind.
export function FavoritesDrawer({
  isOpen,
  onClose,
  favoriteParkings,
  onRemoveFavorite,
  onSelectParking,
  onOpenReservation,
}: FavoritesDrawerProps) {
  return (
    <Presence open={isOpen}>
    <OwnerShell bare>
      <Drawer title="Cocheras favoritas" sub="Tus estacionamientos guardados" onClose={onClose}>
        <div className="dbody stack">
          {favoriteParkings.length === 0 ? (
            <Empty
              icon={<Star className="i" />}
              title="Aún no tenés favoritos guardados"
              action={<button type="button" className="btn" data-first onClick={onClose}>Explorar cocheras</button>}
            >
              Tocá la estrella en cualquier cochera para tenerla a mano cuando necesites estacionar.
            </Empty>
          ) : (
            favoriteParkings.map((p) => (
              <article key={p.id} className="pcard nc">
                <img
                  src={p.imageUrl || p.image || DEFAULT_PARKING_IMAGE}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
                  }}
                />
                <div className="pb">
                  <div className="row top">
                    <div className="nmb">
                      <span className="nm">{p.name}</span>
                      <span className="ad">
                        <MapPin className="i sm" aria-hidden="true" />
                        <span>{[p.address, p.neighborhood, p.locality].filter(Boolean).join(', ')}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="icon-btn fav"
                      aria-pressed="true"
                      aria-label={`Quitar ${p.name} de favoritos`}
                      onClick={() => onRemoveFavorite(p.id)}
                    >
                      <Star className="i" />
                    </button>
                  </div>

                  <div className="tags">
                    <span className="tag mute">
                      <Clock className="i sm" aria-hidden="true" />
                      {p.openingTime} - {p.closingTime} hs
                    </span>
                    {!!p.totalCapacity && (
                      <span className="tag mute">
                        <VICON.AUTO className="i sm" aria-hidden="true" />
                        {p.totalCapacity} plazas
                      </span>
                    )}
                  </div>

                  <div className="acts">
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => {
                        onSelectParking(p.id);
                        onClose();
                      }}
                    >
                      Ver en el mapa
                    </button>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => {
                        onClose();
                        onOpenReservation(p);
                      }}
                    >
                      Reservar
                      <ChevronRight className="i sm" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </Drawer>
    </OwnerShell>
    </Presence>
  );
}

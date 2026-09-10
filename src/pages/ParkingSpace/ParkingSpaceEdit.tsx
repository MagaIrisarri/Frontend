import { useParams } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getParkingSpace, updateParkingSpace, removeParkingSpace } from '../../services/ParkingSpace.js';
import { getOneParking } from '../../services/Parking.js';
import type { Parking } from '../../types/Parking.js';
import type { ParkingSpace } from '@/types/ParkingSpace.js';
import { cn } from '@/lib/utils.js';






export function ParkingSpaceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parking, setParking] = useState<Parking | null>(null);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [spacesWithAvailability, setSpacesWithAvailability] = useState<(ParkingSpace & { available: boolean })[] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);



  useEffect(() => {
    if (!id) return;

    Promise.all([
      getOneParking(id),
      getParkingSpace(id),
    ]).then(([parkingRes, spacesRes]) => {
      setParking(parkingRes.data);
      setSpaces(spacesRes.data);
    });
  }, [id]);



  const displaySpaces = spaces.map((space) => {
    const availability = spacesWithAvailability?.find((s) => s.id === space.id);
    return {
      ...space,
      available: availability ? availability.available : false,
    };
  });

  const selectedSpace = spaces.find(s => s.id === selectedSpaceId);

  const handleToggleState = async () => {
    if (!id || !selectedSpace) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const newState = selectedSpace.state === 'LIBRE' ? 'MANTENIMIENTO' : 'LIBRE';
      await updateParkingSpace(selectedSpace.id, { state: newState });
      const res = await getParkingSpace(id);
      setSpaces(res.data);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error ?? 'No se pudo actualizar el estado de la plaza. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !selectedSpace) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await removeParkingSpace(selectedSpace.id);
      const res = await getParkingSpace(id);
      setSpaces(res.data);
      setSelectedSpaceId(null);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error ?? 'No se pudo dar de baja la plaza. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };
  


  const columns = displaySpaces.reduce<Record<string, typeof displaySpaces>>((acc, space) => {
    const prefix = space.spaceCode.split('-')[0];
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(space);
    return acc;
  }, {});


  return (
    <div className="flex flex-col md:flex-row gap-8 h-full min-h-0">
      <aside className="w-full md:w-1/3 flex flex-col gap-3">
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Plaza seleccionada</h2>
          {selectedSpace ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{selectedSpace.spaceCode}</span> — Estado actual: {selectedSpace.state}
              </p>
              {submitError && (
                <p className="text-xs text-destructive">{submitError}</p>
              )}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleToggleState}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Actualizando...' : selectedSpace.state === 'LIBRE' ? 'Pasar a mantenimiento' : 'Pasar a libre'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="w-full bg-destructive hover:bg-destructive/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Procesando...' : 'Dar de baja'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Seleccioná una plaza para ver sus acciones.</p>
          )}
        </div>
      </aside>

      <section className="w-full md:w-2/3 bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col overflow-y-auto min-h-0">
        <div className="grid grid-cols-6 gap-x-4 gap-y-6">
          {Object.entries(columns).map(([prefix, columnSpaces]) => (
            <div key={prefix} className="flex flex-col gap-2">
              <div className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{prefix}</div>
              {columnSpaces.map((space) => {
              
                return (
                  <button
                    key={space.id}
                    onClick={() => setSelectedSpaceId(space.id) }
                    className={cn(
                      'w-12 h-16 rounded-md border flex items-center justify-center text-xs transition-colors',
                        space.state ==='LIBRE'
                        ?'bg-green-100 border-green-400 text-green-800 hover:bg-green-200 cursor-pointer dark:bg-green-900 dark:border-green-700 dark:text-green-100 dark:hover:bg-green-800'
                        :space.state ==='MANTENIMIENTO' 
                        ?'bg-red-100 border-red-400 text-red-800 hover:bg-red-200 cursor-pointer dark:bg-red-900 dark:border-red-700 dark:text-red-100 dark:hover:bg-red-800'
                        : 'bg-muted border-border text-muted-foreground/50 cursor-not-allowed'
                      )}
              >
                    {space.spaceCode}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

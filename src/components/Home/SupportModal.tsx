import React from 'react';
import { Drawer } from '../Owner/ui/Layer';
import OwnerShell from '../Owner/ui/OwnerShell';
import { Presence } from '../Owner/ui/Presence';

interface SupportModalProps {
  isSupportOpen: boolean;
  setIsSupportOpen: (v: boolean) => void;
}

// Se monta en su propio scope .owner porque los modales de Home siguen siendo Tailwind (ver ProfileContext).
export const SupportModal: React.FC<SupportModalProps> = ({ isSupportOpen, setIsSupportOpen }) => {
  const close = () => setIsSupportOpen(false);

  return (
    <Presence open={isSupportOpen}>
    <OwnerShell bare>
      <Drawer
        title="Centro de ayuda y soporte"
        sub="¿Tenés dudas o necesitás asistencia?"
        onClose={close}
      >
        <div className="dbody">
          <section className="sup">
            <h3>¿Cómo reservo un lugar?</h3>
            <p>
              Seleccioná cualquier cochera en el mapa o listado, hacé click en "Reservar en esta cochera", elegí tu
              vehículo y confirmá la fecha y hora de tu estadía.
            </p>
          </section>
          <section className="sup">
            <h3>¿Cómo puedo ofrecer mi estacionamiento?</h3>
            <p>
              Abrí el menú principal y, en la sección "Paneles", hacé click en "Ofrecé tu estacionamiento". Podrás dar de
              alta tu espacio, definir tus tarifas por hora y comenzar a recibir clientes de inmediato.
            </p>
          </section>
          <section className="sup">
            <h3>Canales de contacto directo</h3>
            <dl className="dl">
              <dt>Email</dt>
              <dd>soporte@cocheras.com</dd>
              <dt>WhatsApp</dt>
              <dd>+54 9 555 555-0000</dd>
              <dt>Atención</dt>
              <dd>Lunes a sábados de 8:00 a 13:00 hs</dd>
            </dl>
          </section>
        </div>
      </Drawer>
    </OwnerShell>
    </Presence>
  );
};

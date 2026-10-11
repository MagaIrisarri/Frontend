import { ConfirmModal } from '../../Owner/ui/Layer';
import OwnerShell from '../../Owner/ui/OwnerShell';
import { Presence } from '../../Owner/ui/Presence';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Confirmación destructiva del estándar (ConfirmModal). Se mantiene para las pantallas que aún no están migradas:
// ellas heredan el formato sin tocar su código.
const ConfirmDialog = ({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: ConfirmDialogProps) => {
  return (
    <Presence open={open}>
      <OwnerShell bare>
        <ConfirmModal title={title} body={message} ok={confirmLabel} back={cancelLabel} danger onConfirm={onConfirm} onClose={onCancel} />
      </OwnerShell>
    </Presence>
  );
};

export default ConfirmDialog;

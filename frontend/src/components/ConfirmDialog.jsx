import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  tone = 'danger',
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? () => {} : onCancel}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-dialog">
        <span className={`confirm-dialog__icon confirm-dialog__icon--${tone}`}>
          <AlertTriangle size={22} />
        </span>
        <p className="confirm-dialog__message">{message}</p>
      </div>
    </Modal>
  );
}

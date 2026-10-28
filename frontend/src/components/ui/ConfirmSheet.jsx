import Sheet from './Sheet';
import Button from './Button';

export default function ConfirmSheet({ open, onOpenChange, title, description, confirmLabel = 'Delete', onConfirm, loading, children }) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="danger" className="flex-1" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      {children}
    </Sheet>
  );
}

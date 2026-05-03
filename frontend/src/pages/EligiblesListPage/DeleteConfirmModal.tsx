import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { EligibleListItem } from '@/types/eligibles';
import styles from './EligiblesListPage.module.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  eligible: EligibleListItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  eligible,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!eligible) return null;

  const fullName = `${eligible.firstName} ${eligible.lastName}`.trim() || eligible.idNumber;

  return (
    <Modal
      isOpen={isOpen}
      title="מחיקת זכאי"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isDeleting}>
            ביטול
          </Button>
          <Button type="button" onClick={onConfirm} isLoading={isDeleting}>
            מחיקה
          </Button>
        </>
      }
    >
      <div className={styles.deleteBody}>
        <p>האם אתה בטוח?</p>
        <p className={styles.deleteSubText}>
          המחיקה של <strong>{fullName}</strong> (ת"ז {eligible.idNumber}) הינה פעולה בלתי הפיכה.
        </p>
      </div>
    </Modal>
  );
}

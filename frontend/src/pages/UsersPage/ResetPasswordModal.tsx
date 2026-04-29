import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { UserListItem } from '@/types/users';
import styles from './UsersPage.module.css';

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: UserListItem | null;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
}

export function ResetPasswordModal({ isOpen, user, onClose, onSubmit }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setSubmitError(null);
    }
  }, [isOpen]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password) {
      setError('יש להזין סיסמה חדשה');
      return;
    }
    if (password.length < 4) {
      setError('סיסמה קצרה מדי');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(password);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'אירעה שגיאה באיפוס הסיסמה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="איפוס סיסמה"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button type="submit" form="reset-password-form" isLoading={isSubmitting}>
            איפוס
          </Button>
        </>
      }
    >
      <form id="reset-password-form" className={styles.form} onSubmit={handleSubmit} noValidate>
        {user && (
          <p className={styles.formInfo}>
            איפוס סיסמה למשתמש: <strong>{user.fullName}</strong>
          </p>
        )}
        <div className={styles.formField}>
          <label htmlFor="newPassword" className={styles.formLabel}>
            סיסמה חדשה
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="text"
            dir="ltr"
            className={`${styles.formInput} ${error ? styles.formInputError : ''}`}
            value={password}
            onChange={handleChange}
            disabled={isSubmitting}
            autoFocus
            style={{ width: '240px' }}
          />
          {error && <span className={styles.formFieldError}>{error}</span>}
        </div>
        {submitError && <div className={styles.formError}>{submitError}</div>}
      </form>
    </Modal>
  );
}

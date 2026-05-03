import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type {
  CreateEligiblePayload,
  EligibleListItem,
  UpdateEligiblePayload,
} from '@/types/eligibles';
import { ApiError } from '@/types/api';
import styles from './EligiblesListPage.module.css';

export type EligibleFormMode = 'create' | 'edit';

interface EligibleFormModalProps {
  isOpen: boolean;
  mode: EligibleFormMode;
  initial?: EligibleListItem | null;
  onClose: () => void;
  onSubmit: (payload: CreateEligiblePayload | UpdateEligiblePayload) => Promise<void>;
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  idNumber: string;
  address: string;
  numberOfPersons: string;
  cardNumber: string;
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  idNumber: '',
  address: '',
  numberOfPersons: '',
  cardNumber: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EligibleFormModal({
  isOpen,
  mode,
  initial,
  onClose,
  onSubmit,
}: EligibleFormModalProps) {
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCardCancelConfirm, setShowCardCancelConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initial) {
      setFormData({
        firstName: initial.firstName ?? '',
        lastName: initial.lastName ?? '',
        phone: initial.phone ?? '',
        email: initial.email ?? '',
        idNumber: initial.idNumber,
        address: initial.address ?? '',
        numberOfPersons: String(initial.numberOfPersons),
        cardNumber: initial.cardNumber ?? '',
      });
    } else {
      setFormData(emptyForm);
    }
    setFieldErrors({});
    setSubmitError(null);
    setShowCardCancelConfirm(false);
  }, [isOpen, mode, initial]);

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'idNumber': {
        const trimmed = value.trim();
        if (!trimmed) return 'שדה חובה';
        if (!/^\d+$/.test(trimmed)) return 'תעודת זהות חייבת להכיל ספרות בלבד';
        if (trimmed.length !== 9) return 'תעודת זהות חייבת להכיל 9 ספרות';
        return null;
      }
      case 'numberOfPersons':
        if (!value.trim()) return 'שדה חובה';
        if (!/^\d+$/.test(value.trim()) || Number(value) <= 0) {
          return 'מספר נפשות חייב להיות מספר חיובי';
        }
        return null;
      case 'email':
        if (!value.trim()) return null;
        if (!emailRegex.test(value.trim())) return 'כתובת מייל אינה תקינה';
        return null;
      case 'phone':
        if (!value.trim()) return null;
        if (!/^[\d\-+\s()]{6,20}$/.test(value)) return 'מספר טלפון אינו תקין';
        return null;
      case 'cardNumber':
        if (!value.trim()) return null;
        if (!/^\d+$/.test(value.trim())) return 'מספר כרטיס חייב להכיל ספרות בלבד';
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    if (submitError) setSubmitError(null);
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    if (err) setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const confirmCancelCard = () => {
    setShowCardCancelConfirm(false);
    setFormData((prev) => ({ ...prev, cardNumber: '' }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const fieldsToValidate = ['idNumber', 'numberOfPersons', 'email', 'phone', 'cardNumber'] as const;
    fieldsToValidate.forEach((name) => {
      const err = validateField(name, formData[name]);
      if (err) errors[name] = err;
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const basePayload = {
      firstName: formData.firstName.trim() || null,
      lastName: formData.lastName.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      idNumber: formData.idNumber.trim(),
      address: formData.address.trim() || null,
      numberOfPersons: Number(formData.numberOfPersons),
    };

    const payload: CreateEligiblePayload | UpdateEligiblePayload =
      mode === 'create'
        ? basePayload
        : { ...basePayload, cardNumber: formData.cardNumber.trim() || null };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFieldErrors((prev) => ({ ...prev, idNumber: err.message }));
      } else {
        setSubmitError(err instanceof Error ? err.message : 'אירעה שגיאה בשמירה');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'create' ? 'הוספת זכאי חדש' : 'עריכת זכאי';
  const formId = 'eligible-form';

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button type="submit" form={formId} isLoading={isSubmitting}>
            {mode === 'create' ? 'הוספה' : 'שמירה'}
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label htmlFor="firstName" className={styles.formLabel}>שם פרטי</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              className={styles.formInput}
              value={formData.firstName}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="lastName" className={styles.formLabel}>שם משפחה</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              className={styles.formInput}
              value={formData.lastName}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formFieldId}>
            <label htmlFor="idNumber" className={styles.formLabel}>
              תעודת זהות <span className={styles.required}>*</span>
            </label>
            <input
              id="idNumber"
              name="idNumber"
              type="text"
              dir="ltr"
              inputMode="numeric"
              maxLength={9}
              className={`${styles.formInput} ${fieldErrors.idNumber ? styles.formInputError : ''}`}
              value={formData.idNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              placeholder="9 ספרות"
            />
            {fieldErrors.idNumber && (
              <span className={styles.formFieldError}>{fieldErrors.idNumber}</span>
            )}
          </div>
          <div className={styles.formFieldPersons}>
            <label htmlFor="numberOfPersons" className={styles.formLabel}>
              מספר נפשות <span className={styles.required}>*</span>
            </label>
            <input
              id="numberOfPersons"
              name="numberOfPersons"
              type="number"
              min={1}
              className={`${styles.formInput} ${fieldErrors.numberOfPersons ? styles.formInputError : ''}`}
              value={formData.numberOfPersons}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
            />
            {fieldErrors.numberOfPersons && (
              <span className={styles.formFieldError}>{fieldErrors.numberOfPersons}</span>
            )}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formFieldPhone}>
            <label htmlFor="phone" className={styles.formLabel}>טלפון</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              dir="ltr"
              className={`${styles.formInput} ${fieldErrors.phone ? styles.formInputError : ''}`}
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
            />
            {fieldErrors.phone && (
              <span className={styles.formFieldError}>{fieldErrors.phone}</span>
            )}
          </div>
          <div className={styles.formFieldEmail}>
            <label htmlFor="email" className={styles.formLabel}>אימייל</label>
            <input
              id="email"
              name="email"
              type="email"
              className={`${styles.formInput} ${fieldErrors.email ? styles.formInputError : ''}`}
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
            />
            {fieldErrors.email && (
              <span className={styles.formFieldError}>{fieldErrors.email}</span>
            )}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formFieldFull}>
            <label htmlFor="address" className={styles.formLabel}>כתובת</label>
            <input
              id="address"
              name="address"
              type="text"
              className={styles.formInput}
              value={formData.address}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {mode === 'edit' && (
          <div className={styles.cardSection}>
            <div className={styles.cardSectionHeader}>
              <span className={styles.cardSectionTitle}>ניהול כרטיס</span>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formFieldCard}>
                <label htmlFor="cardNumber" className={styles.formLabel}>מספר כרטיס</label>
                <input
                  id="cardNumber"
                  name="cardNumber"
                  type="text"
                  dir="ltr"
                  inputMode="numeric"
                  className={`${styles.formInput} ${fieldErrors.cardNumber ? styles.formInputError : ''}`}
                  value={formData.cardNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  placeholder="ללא כרטיס"
                />
                {fieldErrors.cardNumber && (
                  <span className={styles.formFieldError}>{fieldErrors.cardNumber}</span>
                )}
              </div>
              {formData.cardNumber.trim() && (
                <button
                  type="button"
                  className={styles.cardCancelButton}
                  onClick={() => setShowCardCancelConfirm(true)}
                  disabled={isSubmitting}
                >
                  ביטול הכרטיס
                </button>
              )}
            </div>
            {showCardCancelConfirm && (
              <div className={styles.cardConfirmBox}>
                <span>האם אתה בטוח שברצונך לבטל את הכרטיס?</span>
                <div className={styles.cardConfirmActions}>
                  <button
                    type="button"
                    className={styles.cardConfirmYes}
                    onClick={confirmCancelCard}
                  >
                    כן, בטל
                  </button>
                  <button
                    type="button"
                    className={styles.cardConfirmNo}
                    onClick={() => setShowCardCancelConfirm(false)}
                  >
                    חזרה
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {submitError && <div className={styles.formError}>{submitError}</div>}
      </form>
    </Modal>
  );
}

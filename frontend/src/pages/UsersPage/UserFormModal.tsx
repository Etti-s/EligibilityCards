import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { UserRole, UserRoleLabels, type UserRoleValue } from '@/types/auth';
import type { CreateUserPayload, UpdateUserPayload, UserListItem } from '@/types/users';
import { useAuth } from '@/contexts/AuthContext';
import styles from './UsersPage.module.css';

export type UserFormMode = 'create' | 'edit';

interface UserFormModalProps {
  isOpen: boolean;
  mode: UserFormMode;
  initial?: UserListItem | null;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void>;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRoleValue;
}

function emptyForm(role: UserRoleValue): FormState {
  return { fullName: '', email: '', phone: '', password: '', role };
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UserFormModal({ isOpen, mode, initial, onClose, onSubmit }: UserFormModalProps) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === UserRole.Admin;
  const isBranchManager = currentUser?.role === UserRole.BranchManager;
  const isSelfEdit = mode === 'edit' && initial?.id === currentUser?.userId;

  const allowedRoles: UserRoleValue[] = isAdmin
    ? [UserRole.Admin, UserRole.BranchManager, UserRole.Clerk]
    : isBranchManager && isSelfEdit
      ? [UserRole.BranchManager]
      : [UserRole.Clerk];

  const defaultRole: UserRoleValue = allowedRoles[0];

  const [formData, setFormData] = useState<FormState>(emptyForm(defaultRole));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initial) {
      setFormData({
        fullName: initial.fullName,
        email: initial.email,
        phone: initial.phone ?? '',
        password: '',
        role: initial.role,
      });
    } else {
      setFormData(emptyForm(defaultRole));
    }
    setFieldErrors({});
    setSubmitError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, initial?.id]);

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'שדה חובה';
        if (value.trim().length < 2) return 'שם קצר מדי';
        return null;
      case 'email':
        if (!value.trim()) return 'שדה חובה';
        if (!emailRegex.test(value.trim())) return 'כתובת מייל אינה תקינה';
        return null;
      case 'password':
        if (!value) return 'שדה חובה';
        if (value.length < 4) return 'סיסמה קצרה מדי';
        return null;
      case 'phone':
        if (!value) return null;
        if (!/^[\d\-+\s()]{6,20}$/.test(value)) return 'מספר טלפון אינו תקין';
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'role' ? (Number(value) as UserRoleValue) : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    if (submitError) setSubmitError(null);
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const err = validateField(name, String(value));
    if (err) setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const fieldsToValidate = mode === 'create'
      ? (['fullName', 'email', 'password', 'phone'] as const)
      : (['fullName', 'email', 'phone'] as const);

    fieldsToValidate.forEach((name) => {
      const err = validateField(name, String(formData[name] ?? ''));
      if (err) errors[name] = err;
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload: CreateUserPayload | UpdateUserPayload = mode === 'create'
      ? {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          password: formData.password,
          role: formData.role,
        }
      : {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          role: formData.role,
        };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(payload);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'אירעה שגיאה בשמירה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'create' ? 'הוספת משתמש חדש' : 'עריכת משתמש';

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button type="submit" form="user-form" isLoading={isSubmitting}>
            {mode === 'create' ? 'הוספה' : 'שמירה'}
          </Button>
        </>
      }
    >
      <form id="user-form" className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label htmlFor="fullName" className={styles.formLabel}>
              שם מלא
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className={`${styles.formInput} ${fieldErrors.fullName ? styles.formInputError : ''}`}
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              style={{ width: '100%' }}
            />
            {fieldErrors.fullName && (
              <span className={styles.formFieldError}>{fieldErrors.fullName}</span>
            )}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label htmlFor="email" className={styles.formLabel}>
              כתובת מייל
            </label>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
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

          <div className={styles.formField}>
            <label htmlFor="phone" className={styles.formLabel}>
              טלפון
            </label>
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
              style={{ width: '170px' }}
            />
            {fieldErrors.phone && (
              <span className={styles.formFieldError}>{fieldErrors.phone}</span>
            )}
          </div>
        </div>

        <div className={styles.formRow}>
          {mode === 'create' && (
            <div className={styles.formField}>
              <label htmlFor="password" className={styles.formLabel}>
                סיסמה
              </label>
              <input
                id="password"
                name="password"
                type="text"
                dir="ltr"
                className={`${styles.formInput} ${fieldErrors.password ? styles.formInputError : ''}`}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                style={{ width: '220px' }}
              />
              {fieldErrors.password && (
                <span className={styles.formFieldError}>{fieldErrors.password}</span>
              )}
            </div>
          )}

          <div className={styles.formField}>
            <label htmlFor="role" className={styles.formLabel}>
              תפקיד
            </label>
            <select
              id="role"
              name="role"
              className={styles.formSelect}
              value={formData.role}
              onChange={handleChange}
              disabled={isSubmitting || allowedRoles.length === 1}
              style={{ width: '180px' }}
            >
              {allowedRoles.map((roleValue) => (
                <option key={roleValue} value={roleValue}>
                  {UserRoleLabels[roleValue]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {submitError && <div className={styles.formError}>{submitError}</div>}
      </form>
    </Modal>
  );
}

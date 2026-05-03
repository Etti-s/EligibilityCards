import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast } from '@/contexts/ToastContext';
import { eligibilityCheckApi } from '@/api/eligibilityCheckApi';
import { ApiError } from '@/types/api';
import { EligibilityStatus } from '@/types/eligibilityCheck';
import styles from './EligibilityCheckPage.module.css';

type Step = 'check' | 'issue';

const ID_PARAM = 'id';

export function EligibilityCheckPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const idFromUrl = (searchParams.get(ID_PARAM) ?? '').trim();
  const initialStep: Step = idFromUrl ? 'issue' : 'check';

  const [step, setStep] = useState<Step>(initialStep);
  const [idNumber, setIdNumber] = useState(idFromUrl);
  const [cardNumber, setCardNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  const focusIdInput = useCallback(() => {
    requestAnimationFrame(() => idInputRef.current?.focus());
  }, []);

  const focusCardInput = useCallback(() => {
    requestAnimationFrame(() => cardInputRef.current?.focus());
  }, []);

  const goToCheckStep = useCallback(
    (clearUrl: boolean = true) => {
      setStep('check');
      setIdNumber('');
      setCardNumber('');
      if (clearUrl) {
        setSearchParams({}, { replace: true });
      }
      focusIdInput();
    },
    [setSearchParams, focusIdInput],
  );

  const goToIssueStep = useCallback(
    (id: string) => {
      setStep('issue');
      setIdNumber(id);
      setCardNumber('');
      setSearchParams({ [ID_PARAM]: id }, { replace: true });
      focusCardInput();
    },
    [setSearchParams, focusCardInput],
  );

  useEffect(() => {
    if (step === 'check') {
      focusIdInput();
    } else {
      focusCardInput();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = idNumber.trim();
    if (!trimmed) {
      toast.showError('יש להזין תעודת זהות');
      focusIdInput();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await eligibilityCheckApi.check({ idNumber: trimmed });
      switch (response.status) {
        case EligibilityStatus.Eligible:
          toast.showSuccess('זכאי');
          goToIssueStep(trimmed);
          break;
        case EligibilityStatus.NotEligible:
          toast.showError('לא זכאי');
          setIdNumber('');
          focusIdInput();
          break;
        case EligibilityStatus.CardAlreadyIssued:
          toast.showWarning('כרטיס כבר הונפק');
          setIdNumber('');
          focusIdInput();
          break;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'אירעה שגיאה בבדיקה';
      toast.showError(message);
      focusIdInput();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedCard = cardNumber.trim();
    const trimmedId = idNumber.trim();

    if (!trimmedId) {
      toast.showError('תעודת זהות חסרה - חוזר לבדיקה חדשה');
      goToCheckStep();
      return;
    }
    if (!trimmedCard) {
      toast.showError('יש להזין מספר כרטיס');
      focusCardInput();
      return;
    }

    setIsSubmitting(true);
    try {
      await eligibilityCheckApi.issueCard({
        idNumber: trimmedId,
        cardNumber: trimmedCard,
      });
      toast.showSuccess('הכרטיס הונפק בהצלחה');
      goToCheckStep();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'אירעה שגיאה בהנפקת הכרטיס';
      toast.showError(message);
      setCardNumber('');
      focusCardInput();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIdNumber(e.target.value);
  };

  const handleCardChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCardNumber(e.target.value);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>בדיקת זכאות והנפקת כרטיס</h1>
        <p className={styles.subtitle}>
          {step === 'check'
            ? 'הזן תעודת זהות לבדיקת זכאות'
            : 'הזכאי אומת — הזן את מספר הכרטיס להנפקה'}
        </p>
      </div>

      <Card className={styles.card}>
        <div className={styles.steps}>
          <div className={`${styles.stepBadge} ${step === 'check' ? styles.stepBadgeActive : styles.stepBadgeDone}`}>
            <span className={styles.stepNumber}>1</span>
            <span>בדיקת זכאות</span>
          </div>
          <div className={styles.stepDivider} />
          <div className={`${styles.stepBadge} ${step === 'issue' ? styles.stepBadgeActive : ''}`}>
            <span className={styles.stepNumber}>2</span>
            <span>הנפקת כרטיס</span>
          </div>
        </div>

        {step === 'check' ? (
          <form className={styles.form} onSubmit={handleCheckSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="idNumber" className={styles.label}>
                תעודת זהות
              </label>
              <input
                id="idNumber"
                ref={idInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={styles.input}
                value={idNumber}
                onChange={handleIdChange}
                disabled={isSubmitting}
                placeholder="הזן מספר תעודת זהות"
                maxLength={20}
              />
            </div>
            <div className={styles.actions}>
              <Button type="submit" isLoading={isSubmitting} className={styles.primaryButton}>
                בדיקה
              </Button>
            </div>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleIssueSubmit} noValidate>
            <div className={styles.idDisplay}>
              <span className={styles.idDisplayLabel}>תעודת זהות:</span>
              <span className={styles.idDisplayValue}>{idNumber}</span>
            </div>
            <div className={styles.field}>
              <label htmlFor="cardNumber" className={styles.label}>
                מספר כרטיס
              </label>
              <input
                id="cardNumber"
                ref={cardInputRef}
                type="text"
                autoComplete="off"
                className={styles.input}
                value={cardNumber}
                onChange={handleCardChange}
                disabled={isSubmitting}
                placeholder="הזן מספר כרטיס"
                maxLength={50}
              />
            </div>
            <div className={styles.actions}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => goToCheckStep()}
                disabled={isSubmitting}
              >
                בדיקה חדשה
              </Button>
              <Button type="submit" isLoading={isSubmitting} className={styles.primaryButton}>
                אישור
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

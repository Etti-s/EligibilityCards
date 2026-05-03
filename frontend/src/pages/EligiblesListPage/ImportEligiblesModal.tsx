import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { eligiblesApi } from '@/api/eligiblesApi';
import { ApiError } from '@/types/api';
import type { ImportResult } from '@/types/eligibles';
import styles from './EligiblesListPage.module.css';

interface ImportEligiblesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}

export function ImportEligiblesModal({ isOpen, onClose, onImported }: ImportEligiblesModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<ImportResult['errors']>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setIsUploading(false);
      setErrors([]);
      setErrorMessage(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [isOpen]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setErrors([]);
    setErrorMessage(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('יש לבחור קובץ Excel');
      return;
    }

    setIsUploading(true);
    setErrors([]);
    setErrorMessage(null);
    try {
      const result = await eligiblesApi.import(file);
      onImported(result.importedCount);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        const data = err.data as ImportResult | undefined;
        if (data && Array.isArray(data.errors)) {
          setErrors(data.errors);
        }
      } else {
        setErrorMessage('אירעה שגיאה בייבוא הקובץ');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="ייבוא זכאים מ-Excel"
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
            סגירה
          </Button>
          <Button type="button" onClick={handleUpload} isLoading={isUploading} disabled={!file}>
            ייבוא
          </Button>
        </>
      }
    >
      <div className={styles.importBody}>
        <p className={styles.importHint}>
          העלאת קובץ Excel עם רשימת זכאים. ניתן להוריד את התבנית הריקה
          ולמלא אותה לפי מבנה העמודות הנדרש.
        </p>

        <div className={styles.fileInputRow}>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isUploading}
            className={styles.fileInput}
          />
        </div>

        {errorMessage && <div className={styles.formError}>{errorMessage}</div>}

        {errors.length > 0 && (
          <div className={styles.importErrorList}>
            <div className={styles.importErrorTitle}>
              נמצאו {errors.length} שגיאות בקובץ. שום נתון לא נשמר.
            </div>
            <ul>
              {errors.map((e, idx) => (
                <li key={`${e.rowNumber}-${idx}`}>
                  {e.rowNumber > 0 ? `שורה ${e.rowNumber}: ` : ''}
                  {e.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

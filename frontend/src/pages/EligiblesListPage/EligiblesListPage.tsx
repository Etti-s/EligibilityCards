import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { eligiblesApi } from '@/api/eligiblesApi';
import { ApiError } from '@/types/api';
import { UserRole } from '@/types/auth';
import {
  CardStatusFilter,
  type CardStatusFilterValue,
  type CreateEligiblePayload,
  type EligibleFilter,
  type EligibleListItem,
  type UpdateEligiblePayload,
} from '@/types/eligibles';
import { EligibleFormModal, type EligibleFormMode } from './EligibleFormModal';
import { ImportEligiblesModal } from './ImportEligiblesModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import styles from './EligiblesListPage.module.css';

const SEARCH_DEBOUNCE_MS = 300;

function readFilterFromParams(params: URLSearchParams): EligibleFilter {
  const search = params.get('search') ?? undefined;
  const cardSearch = params.get('cardSearch') ?? undefined;
  const personsRaw = params.get('persons');
  const cardStatusRaw = params.get('cardStatus');

  let cardStatus: CardStatusFilterValue = CardStatusFilter.All;
  if (cardStatusRaw === 'assigned') cardStatus = CardStatusFilter.Assigned;
  else if (cardStatusRaw === 'unassigned') cardStatus = CardStatusFilter.NotAssigned;

  let numberOfPersons: number | undefined;
  if (personsRaw && /^\d+$/.test(personsRaw)) {
    numberOfPersons = Number(personsRaw);
  }

  return {
    search: search || undefined,
    cardSearch: cardSearch || undefined,
    numberOfPersons,
    cardStatus,
  };
}

interface FilterFieldsProps {
  idPrefix: string;
  searchInput: string;
  cardSearchInput: string;
  filter: EligibleFilter;
  cardStatusValue: string;
  personsOptions: number[];
  setSearchInput: (value: string) => void;
  setCardSearchInput: (value: string) => void;
  handlePersonsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleCardStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  styles: Record<string, string>;
}

function renderFilterFields(props: FilterFieldsProps) {
  const {
    idPrefix,
    searchInput,
    cardSearchInput,
    filter,
    cardStatusValue,
    personsOptions,
    setSearchInput,
    setCardSearchInput,
    handlePersonsChange,
    handleCardStatusChange,
    styles,
  } = props;

  return (
    <>
      <div className={styles.filterField}>
        <label className={styles.filterLabel} htmlFor={`${idPrefix}-search-input`}>חיפוש כללי</label>
        <input
          id={`${idPrefix}-search-input`}
          type="search"
          className={styles.filterInput}
          placeholder="שם, ת״ז, מייל, טלפון או כתובת"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      <div className={styles.filterField}>
        <label className={styles.filterLabel} htmlFor={`${idPrefix}-card-search-input`}>חיפוש לפי מספר כרטיס</label>
        <input
          id={`${idPrefix}-card-search-input`}
          type="search"
          dir="ltr"
          className={styles.filterInputCard}
          placeholder="מספר כרטיס"
          value={cardSearchInput}
          onChange={(e) => setCardSearchInput(e.target.value)}
        />
      </div>
      <div className={styles.filterField}>
        <label className={styles.filterLabel} htmlFor={`${idPrefix}-persons-select`}>מספר נפשות</label>
        <select
          id={`${idPrefix}-persons-select`}
          className={styles.filterSelect}
          value={filter.numberOfPersons ?? ''}
          onChange={handlePersonsChange}
        >
          <option value="">הכל</option>
          {personsOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className={styles.filterField}>
        <label className={styles.filterLabel} htmlFor={`${idPrefix}-card-status-select`}>סטטוס כרטיס</label>
        <select
          id={`${idPrefix}-card-status-select`}
          className={styles.filterSelect}
          value={cardStatusValue}
          onChange={handleCardStatusChange}
        >
          <option value="">הכל</option>
          <option value="assigned">הוקצה כרטיס</option>
          <option value="unassigned">לא הוקצה כרטיס</option>
        </select>
      </div>
    </>
  );
}

function writeFilterToParams(filter: EligibleFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.search && filter.search.trim()) params.set('search', filter.search.trim());
  if (filter.cardSearch && filter.cardSearch.trim()) params.set('cardSearch', filter.cardSearch.trim());
  if (typeof filter.numberOfPersons === 'number') params.set('persons', String(filter.numberOfPersons));
  if (filter.cardStatus === CardStatusFilter.Assigned) params.set('cardStatus', 'assigned');
  if (filter.cardStatus === CardStatusFilter.NotAssigned) params.set('cardStatus', 'unassigned');
  return params;
}

export function EligiblesListPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdmin = user?.role === UserRole.Admin;

  const [filter, setFilter] = useState<EligibleFilter>(() => readFilterFromParams(searchParams));
  const [searchInput, setSearchInput] = useState(() => readFilterFromParams(searchParams).search ?? '');
  const [cardSearchInput, setCardSearchInput] = useState(
    () => readFilterFromParams(searchParams).cardSearch ?? '',
  );

  const [items, setItems] = useState<EligibleListItem[]>([]);
  const [personsOptions, setPersonsOptions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<EligibleFormMode>('create');
  const [editing, setEditing] = useState<EligibleListItem | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EligibleListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filtersSidebarOpen, setFiltersSidebarOpen] = useState(false);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!filtersSidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersSidebarOpen(false);
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [filtersSidebarOpen]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.search && filter.search.trim()) count++;
    if (filter.cardSearch && filter.cardSearch.trim()) count++;
    if (typeof filter.numberOfPersons === 'number') count++;
    if (filter.cardStatus !== undefined && filter.cardStatus !== CardStatusFilter.All) count++;
    return count;
  }, [filter]);

  const clearFilters = () => {
    setSearchInput('');
    setCardSearchInput('');
    setFilter({
      search: undefined,
      cardSearch: undefined,
      numberOfPersons: undefined,
      cardStatus: CardStatusFilter.All,
    });
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const params = writeFilterToParams(filter);
    setSearchParams(params, { replace: true });
  }, [filter, setSearchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setFilter((prev) =>
        prev.search === (searchInput.trim() || undefined)
          ? prev
          : { ...prev, search: searchInput.trim() || undefined },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setFilter((prev) =>
        prev.cardSearch === (cardSearchInput.trim() || undefined)
          ? prev
          : { ...prev, cardSearch: cardSearchInput.trim() || undefined },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [cardSearchInput]);

  const loadOptions = useCallback(async () => {
    try {
      const opts = await eligiblesApi.getNumberOfPersonsOptions();
      setPersonsOptions(opts);
    } catch {
      setPersonsOptions([]);
    }
  }, []);

  const loadList = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await eligiblesApi.getAll(filter);
      setItems(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'שגיאה בטעינת זכאים';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handlePersonsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setFilter((prev) => ({
      ...prev,
      numberOfPersons: v === '' ? undefined : Number(v),
    }));
  };

  const handleCardStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    let cardStatus: CardStatusFilterValue = CardStatusFilter.All;
    if (v === 'assigned') cardStatus = CardStatusFilter.Assigned;
    else if (v === 'unassigned') cardStatus = CardStatusFilter.NotAssigned;
    setFilter((prev) => ({ ...prev, cardStatus }));
  };

  const openCreate = () => {
    setEditing(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const openEdit = (item: EligibleListItem) => {
    setEditing(item);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleSubmitForm = async (payload: CreateEligiblePayload | UpdateEligiblePayload) => {
    if (formMode === 'create') {
      const created = await eligiblesApi.create(payload as CreateEligiblePayload);
      setItems((prev) => [created, ...prev]);
      toast.showSuccess('הזכאי נוסף בהצלחה');
      loadOptions();
    } else if (editing) {
      const updated = await eligiblesApi.update(editing.id, payload as UpdateEligiblePayload);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast.showSuccess('הזכאי עודכן בהצלחה');
      loadOptions();
    }
    setFormOpen(false);
    setEditing(null);
  };

  const openDelete = (item: EligibleListItem) => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await eligiblesApi.delete(deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.showSuccess('הזכאי נמחק בהצלחה');
      setDeleteOpen(false);
      setDeleteTarget(null);
      loadOptions();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'שגיאה במחיקת זכאי';
      toast.showError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await eligiblesApi.downloadTemplate();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'שגיאה בהורדת התבנית';
      toast.showError(message);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleImported = (count: number) => {
    setImportOpen(false);
    toast.showSuccess(`יובאו ${count} רשומות בהצלחה`);
    loadList();
    loadOptions();
  };

  const cardStatusValue = useMemo(() => {
    if (filter.cardStatus === CardStatusFilter.Assigned) return 'assigned';
    if (filter.cardStatus === CardStatusFilter.NotAssigned) return 'unassigned';
    return '';
  }, [filter.cardStatus]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>רשימת זכאים</h1>
          <p className={styles.pageSubtitle}>סך הכל {items.length} רשומות מוצגות</p>
        </div>
        {isAdmin && (
          <div className={styles.headerActions}>
            <Button type="button" variant="ghost" onClick={handleDownloadTemplate} isLoading={isDownloadingTemplate}>
              הורדת תבנית
            </Button>
            <Button type="button" variant="secondary" onClick={() => setImportOpen(true)}>
              ייבוא Excel
            </Button>
            <Button type="button" onClick={openCreate}>+ הוספת זכאי</Button>
          </div>
        )}
      </div>

      <div className={styles.filtersBar}>
        <button
          type="button"
          className={styles.filtersToggle}
          onClick={() => setFiltersSidebarOpen(true)}
          aria-label="פתיחת פאנל סינון"
        >
          <span>סינון</span>
          {activeFilterCount > 0 && (
            <span className={styles.filtersToggleCount}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      <div
        className={`${styles.filtersBackdrop} ${filtersSidebarOpen ? styles.filtersBackdropOpen : ''}`}
        onClick={() => setFiltersSidebarOpen(false)}
        role="presentation"
      />

      <div className={styles.filtersContainerCard}>
        <Card>
          <div className={styles.filtersRow}>
            {renderFilterFields({
              idPrefix: 'desktop',
              searchInput,
              cardSearchInput,
              filter,
              cardStatusValue,
              personsOptions,
              setSearchInput,
              setCardSearchInput,
              handlePersonsChange,
              handleCardStatusChange,
              styles,
            })}
            <div className={styles.filterClearWrapper}>
              <button
                type="button"
                className={styles.filterClearButton}
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
              >
                ניקוי סינון
                {activeFilterCount > 0 && (
                  <span className={styles.filterClearBadge}>{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>
        </Card>
      </div>

      <aside
        className={`${styles.filtersContainer} ${filtersSidebarOpen ? styles.filtersContainerOpen : ''}`}
        aria-hidden={!filtersSidebarOpen}
      >
        <div className={styles.filtersHeader}>
          <h2 className={styles.filtersHeaderTitle}>סינון</h2>
          <button
            type="button"
            className={styles.filtersHeaderClose}
            onClick={() => setFiltersSidebarOpen(false)}
            aria-label="סגירה"
          >
            ×
          </button>
        </div>
        <div className={styles.filtersRow}>
          {renderFilterFields({
            idPrefix: 'mobile',
            searchInput,
            cardSearchInput,
            filter,
            cardStatusValue,
            personsOptions,
            setSearchInput,
            setCardSearchInput,
            handlePersonsChange,
            handleCardStatusChange,
            styles,
          })}
        </div>
        <div className={styles.filtersFooter}>
          <Button type="button" variant="ghost" onClick={clearFilters}>
            ניקוי
          </Button>
          <Button type="button" onClick={() => setFiltersSidebarOpen(false)}>
            הצגת תוצאות
          </Button>
        </div>
      </aside>

      <Card className={styles.tableCard}>
        {loadError ? (
          <div className={styles.errorMessage}>{loadError}</div>
        ) : isLoading ? (
          <div className={styles.loading}>טוען נתונים...</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>לא נמצאו זכאים תואמים לסינון</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.colFirstName} />
                <col className={styles.colLastName} />
                <col className={styles.colPhone} />
                <col className={styles.colEmail} />
                <col className={styles.colId} />
                <col className={styles.colAddress} />
                <col className={styles.colPersons} />
                <col className={styles.colCard} />
                {isAdmin && <col className={styles.colActions} />}
              </colgroup>
              <thead>
                <tr>
                  <th>שם פרטי</th>
                  <th>שם משפחה</th>
                  <th>טלפון</th>
                  <th>אימייל</th>
                  <th>תעודת זהות</th>
                  <th>כתובת</th>
                  <th>נפשות</th>
                  <th>מספר כרטיס</th>
                  {isAdmin && <th className={styles.actionsHeader}>פעולות</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.cellName} data-label="שם פרטי">{item.firstName || '—'}</td>
                    <td className={styles.cellName} data-label="שם משפחה">{item.lastName || '—'}</td>
                    <td className={styles.cellPhone} data-label="טלפון">
                      {item.phone ? <span dir="ltr">{item.phone}</span> : '—'}
                    </td>
                    <td className={styles.cellEmail} data-label="אימייל">{item.email || '—'}</td>
                    <td className={styles.cellId} data-label="תעודת זהות">
                      <span dir="ltr">{item.idNumber}</span>
                    </td>
                    <td className={styles.cellAddress} data-label="כתובת">{item.address || '—'}</td>
                    <td className={styles.cellPersons} data-label="נפשות">{item.numberOfPersons}</td>
                    <td className={styles.cellCard} data-label="מספר כרטיס">
                      {item.cardNumber ? (
                        <span dir="ltr" className={styles.cardBadge}>{item.cardNumber}</span>
                      ) : (
                        <span className={styles.cardEmpty}>—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className={styles.cellActions} data-label="פעולות">
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.actionButton}
                            onClick={() => openEdit(item)}
                          >
                            עריכה
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionDanger}`}
                            onClick={() => openDelete(item)}
                          >
                            מחיקה
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <EligibleFormModal
        isOpen={formOpen}
        mode={formMode}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
      />

      <ImportEligiblesModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={handleImported}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        eligible={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

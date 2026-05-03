import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usersApi } from '@/api/usersApi';
import { ApiError } from '@/types/api';
import { UserRole, UserRoleLabels } from '@/types/auth';
import type { CreateUserPayload, UpdateUserPayload, UserListItem } from '@/types/users';
import { formatDate } from '@/utils/dateFormat';
import { UserFormModal, type UserFormMode } from './UserFormModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import styles from './UsersPage.module.css';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<UserFormMode>('create');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserListItem | null>(null);

  const isAdmin = currentUser?.role === UserRole.Admin;
  const canCreate = isAdmin || currentUser?.role === UserRole.BranchManager;

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'שגיאה בטעינת משתמשים';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const openEdit = (user: UserListItem) => {
    setEditingUser(user);
    setFormMode('edit');
    setFormOpen(true);
  };

  const openReset = (user: UserListItem) => {
    setResetUser(user);
    setResetOpen(true);
  };

  const handleSubmitForm = async (payload: CreateUserPayload | UpdateUserPayload) => {
    if (formMode === 'create') {
      const created = await usersApi.create(payload as CreateUserPayload);
      setUsers((prev) => [created, ...prev]);
      toast.showSuccess('המשתמש נוסף בהצלחה');
    } else if (editingUser) {
      const updated = await usersApi.update(editingUser.id, payload as UpdateUserPayload);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.showSuccess('המשתמש עודכן בהצלחה');
    }
    setFormOpen(false);
    setEditingUser(null);
  };

  const handleToggleStatus = async (user: UserListItem) => {
    try {
      const updated = await usersApi.toggleStatus(user.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.showSuccess(updated.isActive ? 'המשתמש הופעל' : 'המשתמש נחסם');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'שגיאה בעדכון הסטטוס';
      toast.showError(message);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetUser) return;
    await usersApi.resetPassword(resetUser.id, { newPassword });
    toast.showSuccess('הסיסמה אופסה בהצלחה');
    setResetOpen(false);
    setResetUser(null);
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.fullName.localeCompare(b.fullName, 'he');
    });
  }, [users]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>ניהול משתמשים</h1>
          <p className={styles.pageSubtitle}>
            סך הכל {users.length} משתמשים במערכת
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>+ הוספת משתמש</Button>
        )}
      </div>

      <Card className={styles.tableCard}>
        {loadError ? (
          <div className={styles.errorMessage}>{loadError}</div>
        ) : isLoading ? (
          <div className={styles.loading}>טוען נתונים...</div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>לא נמצאו משתמשים במערכת</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.colName} />
                <col className={styles.colEmail} />
                <col className={styles.colPhone} />
                <col className={styles.colRole} />
                <col className={styles.colDate} />
                <col className={styles.colStatus} />
                <col className={styles.colActions} />
              </colgroup>
              <thead>
                <tr>
                  <th>שם מלא</th>
                  <th>כתובת מייל</th>
                  <th>טלפון</th>
                  <th>תפקיד</th>
                  <th>תאריך יצירה</th>
                  <th>סטטוס</th>
                  <th className={styles.actionsHeader}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => {
                  const isSelf = u.id === currentUser?.userId;
                  return (
                    <tr key={u.id} className={!u.isActive ? styles.rowBlocked : ''}>
                      <td className={styles.cellName}>
                        {u.fullName}
                        {isSelf && <span className={styles.selfBadge}>אני</span>}
                      </td>
                      <td className={styles.cellEmail}>{u.email}</td>
                      <td className={styles.cellPhone}>
                        {u.phone ? <span dir="ltr">{u.phone}</span> : '—'}
                      </td>
                      <td className={styles.cellRole}>
                        <span className={`${styles.roleBadge} ${styles[`role${u.role}`]}`}>
                          {UserRoleLabels[u.role]}
                        </span>
                      </td>
                      <td className={styles.cellDate}>{formatDate(u.createdAt)}</td>
                      <td className={styles.cellStatus}>
                        <span
                          className={`${styles.statusBadge} ${
                            u.isActive ? styles.statusActive : styles.statusBlocked
                          }`}
                        >
                          {u.isActive ? 'פעיל' : 'חסום'}
                        </span>
                      </td>
                      <td className={styles.cellActions}>
                        <div className={styles.actions}>
                          {u.canEdit && (
                            <button
                              type="button"
                              className={styles.actionButton}
                              onClick={() => openEdit(u)}
                              title="עריכה"
                            >
                              עריכה
                            </button>
                          )}
                          {u.canResetPassword && (
                            <button
                              type="button"
                              className={styles.actionButton}
                              onClick={() => openReset(u)}
                              title="איפוס סיסמה"
                            >
                              איפוס סיסמה
                            </button>
                          )}
                          {u.canToggleStatus && (
                            <button
                              type="button"
                              className={`${styles.actionButton} ${
                                u.isActive ? styles.actionDanger : styles.actionSuccess
                              }`}
                              onClick={() => handleToggleStatus(u)}
                              title={u.isActive ? 'חסימה' : 'הפעלה'}
                            >
                              {u.isActive ? 'חסימה' : 'הפעלה'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <UserFormModal
        isOpen={formOpen}
        mode={formMode}
        initial={editingUser}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
      />

      <ResetPasswordModal
        isOpen={resetOpen}
        user={resetUser}
        onClose={() => setResetOpen(false)}
        onSubmit={handleResetPassword}
      />
    </div>
  );
}

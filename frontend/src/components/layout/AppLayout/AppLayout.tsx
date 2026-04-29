import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, UserRoleLabels } from '@/types/auth';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const showUsersLink = user?.role === UserRole.Admin || user?.role === UserRole.BranchManager;
  const showEligiblesLink = user?.role === UserRole.Admin || user?.role === UserRole.BranchManager;
  const showEligibilityCheckLink = user?.role === UserRole.Clerk;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true" />
            <div>
              <div className={styles.brandTitle}>מערכת כרטיסי זכאות</div>
              <div className={styles.brandSubtitle}>ניהול תושבים והנפקת כרטיסים</div>
            </div>
          </div>

          {isAuthenticated && user && (
            <nav className={styles.nav}>
              {showEligibilityCheckLink && (
                <NavLink
                  to="/eligibility-check"
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  בדיקת זכאות
                </NavLink>
              )}
              {showEligiblesLink && (
                <NavLink
                  to="/eligibles"
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  רשימת זכאים
                </NavLink>
              )}
              {showUsersLink && (
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  ניהול משתמשים
                </NavLink>
              )}
            </nav>
          )}

          {isAuthenticated && user && (
            <div className={styles.userArea}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.fullName}</div>
                <div className={styles.userRole}>{UserRoleLabels[user.role]}</div>
              </div>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                התנתקות
              </button>
            </div>
          )}
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.container}>{children}</div>
      </main>
    </div>
  );
}

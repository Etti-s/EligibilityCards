import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, UserRoleLabels } from '@/types/auth';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const showUsersLink = user?.role === UserRole.Admin || user?.role === UserRole.BranchManager;
  const showEligiblesLink = user?.role === UserRole.Admin || user?.role === UserRole.BranchManager;
  const showEligibilityCheckLink = isAuthenticated;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true" />
            <div className={styles.brandText}>
              <div className={styles.brandTitle}>מערכת כרטיסי זכאות</div>
              <div className={styles.brandSubtitle}>ניהול תושבים והנפקת כרטיסים</div>
            </div>
          </div>

          {isAuthenticated && user && (
            <>
              <nav className={`${styles.nav} ${styles.navDesktop}`}>
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

              <div className={`${styles.userArea} ${styles.userAreaDesktop}`}>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.fullName}</div>
                  <div className={styles.userRole}>{UserRoleLabels[user.role]}</div>
                </div>
                <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                  התנתקות
                </button>
              </div>

              <button
                type="button"
                className={styles.menuButton}
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label={isMenuOpen ? 'סגירת תפריט' : 'פתיחת תפריט'}
                aria-expanded={isMenuOpen}
              >
                <span className={styles.menuIcon}>
                  <span />
                  <span />
                  <span />
                </span>
              </button>
            </>
          )}
        </div>
      </header>

      {isAuthenticated && user && isMenuOpen && (
        <>
          <div
            className={styles.menuBackdrop}
            onClick={() => setIsMenuOpen(false)}
            role="presentation"
          />
          <div className={styles.mobileMenu}>
            <div className={styles.mobileUserInfo}>
              <div className={styles.userName}>{user.fullName}</div>
              <div className={styles.userRole}>{UserRoleLabels[user.role]}</div>
            </div>
            <nav className={styles.mobileNav}>
              {showEligibilityCheckLink && (
                <NavLink
                  to="/eligibility-check"
                  className={({ isActive }) =>
                    `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
                  }
                >
                  בדיקת זכאות
                </NavLink>
              )}
              {showEligiblesLink && (
                <NavLink
                  to="/eligibles"
                  className={({ isActive }) =>
                    `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
                  }
                >
                  רשימת זכאים
                </NavLink>
              )}
              {showUsersLink && (
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
                  }
                >
                  ניהול משתמשים
                </NavLink>
              )}
            </nav>
            <button type="button" className={styles.mobileLogoutButton} onClick={handleLogout}>
              התנתקות
            </button>
          </div>
        </>
      )}

      <main className={styles.main}>
        <div className={styles.container}>{children}</div>
      </main>
    </div>
  );
}

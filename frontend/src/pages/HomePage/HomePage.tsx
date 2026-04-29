import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>ברוכים הבאים למערכת כרטיסי זכאות</h1>
      <p className={styles.subtitle}>
        ניהול תושבים והנפקת כרטיסים — בקרוב.
      </p>
    </div>
  );
}

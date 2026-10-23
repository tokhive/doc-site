import type {ReactNode} from 'react';
import styles from './Lockup.module.css';

/**
 * Mark + wordmark, drawn inline so the wordmark uses the page's Sora font.
 * Colors come from CSS: graphite hex with volt stripes on light, volt hex with
 * page-background stripes (cut-outs) on dark.
 */
export default function Lockup(): ReactNode {
  return (
    <h1 className={styles.lockup} aria-label="TokHive">
      <svg className={styles.mark} viewBox="0 0 100 100" aria-hidden="true">
        <path className={styles.hex} d="M50,6 L88.1,28 L88.1,72 L50,94 L11.9,72 L11.9,28 Z" />
        <path className={styles.stripes} d="M11.9,36.5 h76.2 v9 h-76.2 Z M11.9,54.5 h76.2 v9 h-76.2 Z" />
      </svg>
      <span className={styles.wordmark} aria-hidden="true">
        <span className={styles.tok}>Tok</span>
        <span className={styles.hive}>Hive</span>
      </span>
    </h1>
  );
}

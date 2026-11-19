/**
 * The 404 page body, ejected from @docusaurus/theme-classic (NotFound is safe to eject).
 * Adds a search box and the main entry points so a stale link still lands somewhere useful.
 */
import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Heading from '@theme/Heading';
import type {Props} from '@theme/NotFound/Content';
import styles from './styles.module.css';

const entryPoints = [
  {to: '/quickstart/', label: 'QuickStart', hint: 'Your first call through TokHive'},
  {to: '/category/consumer/', label: 'Consumer guides', hint: 'Claude Code, Codex, deposits, FAQ'},
  {to: '/category/api/', label: 'API reference', hint: 'Responses, Chat Completions, Messages'},
  {to: '/provider/overview/', label: 'Provider guide', hint: 'Supply your subscription with Bee'},
  {to: '/trust/trust-model/', label: 'Trust model', hint: 'Who can see what, and what the TEE proves'},
  {to: '/blog/', label: 'Blog', hint: 'Updates and research'},
];

export default function NotFoundContent({className}: Props): ReactNode {
  const searchUrl = useBaseUrl('/search/');
  return (
    <main className={clsx('container margin-vert--xl', className)}>
      <div className="row">
        <div className="col col--8 col--offset-2">
          <Heading as="h1" className="hero__title">
            Page not found
          </Heading>
          <p>This page doesn't exist, or it has moved. Search the docs, or start from one of these pages.</p>

          <form action={searchUrl} method="get" role="search" className={styles.search}>
            <input
              type="search"
              name="q"
              placeholder="Search the docs"
              aria-label="Search the docs"
              className={styles.searchInput}
            />
            <button type="submit" className="button button--primary">
              Search
            </button>
          </form>

          <ul className={styles.links}>
            {entryPoints.map(({to, label, hint}) => (
              <li key={to}>
                <Link to={to} className={styles.link}>
                  <span className={styles.label}>{label}</span>
                  <span className={styles.hint}>{hint}</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className={styles.report}>
            Followed a broken link on this site?{' '}
            <Link href="https://github.com/tokhive/doc-site/issues/new?title=Broken%20link">
              Let us know on GitHub
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

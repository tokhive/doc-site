import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'TokHive',
  tagline: 'A decentralized marketplace for AI Inference',
  favicon: 'img/app-icon-dark.svg',

  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Sora:wght@300;400;500;600;700&display=swap',
      type: 'text/css',
    },
  ],
  headTags: [
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'}},
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'}},
  ],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: 'https://docs.tokhive.ai',
  baseUrl: '/',
  // GitHub Pages serves each page as <path>/index.html and 301-redirects <path> to <path>/,
  // so canonical URLs, the sitemap and internal links all use the trailing slash.
  trailingSlash: true,

  organizationName: 'tokhive',
  projectName: 'doc-site',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: {
          blogDescription:
            'Product updates, guides and research from TokHive, the decentralized marketplace for AI inference.',
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          // Listing pages with no content of their own.
          ignorePatterns: ['/search/', '/blog/archive/', '/blog/authors/**', '/blog/tags/**', '/blog/page/**'],
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        // Old URLs of pages that have moved, so links shared before the move still resolve.
        redirects: [
          {from: '/consumer-faq', to: '/consumer/faq'},
          {from: '/category/web-proof', to: '/category/trust--security'},
          {from: '/web-proof/web-proof', to: '/trust/web-proof'},
          {
            from: '/web-proof/tee-zktls-technical-principles',
            to: '/trust/tee-zktls-technical-principles',
          },
        ],
      },
    ],
    [
      // Writes /llms.txt (an index) and /llms-full.txt (every doc in one file) so AI
      // coding tools can read these docs. See https://llmstxt.org.
      'docusaurus-plugin-llms',
      {
        title: 'TokHive Docs',
        description:
          'TokHive is a decentralized marketplace for AI inference: consumers call OpenAI- and Anthropic-compatible APIs, providers supply idle AI subscriptions.',
        // The docs are served from the site root (routeBasePath '/'); the plugin assumes '/docs' otherwise.
        docsDir: [{path: 'docs', routeBasePath: '/'}],
        excludeImports: true,
        removeDuplicateHeadings: true,
        // Site-relative paths: a bare 'quickstart.mdx' also matches provider/quickstart.mdx.
        includeOrder: [
          'docs/intro.mdx',
          'docs/quickstart.mdx',
          'docs/consumer/**',
          'docs/api/**',
          'docs/provider/**',
          'docs/trust/**',
          'docs/glossary.mdx',
        ],
      },
    ],
    // Tap or click a doc image to see it full screen; options are under themeConfig.zoom.
    'docusaurus-plugin-image-zoom',
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        docsRouteBasePath: '/',
        indexBlog: true,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    // Link preview image (og:image / twitter:image), 1200×630. Source: scripts/social-card/.
    image: 'img/social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'TokHive',
      logo: {
        alt: 'TokHive Logo',
        src: 'img/mark-graphite-volt.svg',
        srcDark: 'img/mark-volt.svg',
        width: 28,
        height: 28,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/category/api', label: 'API', position: 'left'},
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://console.tokhive.ai',
          label: 'Console',
          position: 'right',
        },
        {
          // Icon only: the GitHub mark is drawn by .header-github-link in custom.css.
          href: 'https://github.com/tokhive',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'QuickStart', to: '/quickstart'},
            {label: 'API', to: '/category/api'},
            {label: 'Provider guide', to: '/provider/overview'},
            {label: 'Trust model', to: '/trust/trust-model'},
          ],
        },
        {
          title: 'Legal',
          items: [
            {label: 'Terms of Service', href: 'https://tokhive.ai/terms'},
            {label: 'Privacy Policy', href: 'https://tokhive.ai/privacy'},
          ],
        },
        {
          title: 'Contact',
          items: [
            {label: 'hello@tokhive.ai', href: 'mailto:hello@tokhive.ai'},
            {label: 'Telegram', href: 'https://t.me/tokhive'},
            {label: 'Discord', href: 'https://discord.gg/nrVU4vSShw'},
            {label: 'X', href: 'https://x.com/tokhive'},
            {
              label: 'Report a vulnerability',
              href: 'https://github.com/tokhive/tee/security/advisories/new',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Website', href: 'https://tokhive.ai'},
            {label: 'Console', href: 'https://console.tokhive.ai'},
            {label: 'Blog', to: '/blog'},
            {label: 'GitHub', href: 'https://github.com/tokhive'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} TokHive, Inc.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
    },
    // docusaurus-plugin-image-zoom (medium-zoom). Images inside links keep opening the link.
    zoom: {
      selector: '.markdown img:not(a img)',
      background: {
        light: 'rgb(251, 251, 248)',
        dark: 'rgb(10, 11, 12)',
      },
      config: {
        margin: 16,
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

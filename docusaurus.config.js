// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const codeBlock = require('./src/comment/codeBlock');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Decert.me',
  tagline: 'Solidity 教程',
  favicon: 'img/favicon.ico',

  scripts: [
    {
      src: "https://s9.cnzz.com/z_stat.php?id=1281242163&web_id=1281242163",
      async: true,
      defer: true
    },
  ],

  plugins: [
    require.resolve('./sitePlugin'),
    "docusaurus-plugin-sass", 
    "docusaurus-node-polyfills"
  ],

  url: 'https://decert.me',
  baseUrl: '/tutorial',
// tutorial/solidity/
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/decert-me/learnsolidity/tree/main/',
          remarkPlugins: [codeBlock]

        },
        blog: false,
        theme: {
          customCss: [
            require.resolve('./src/css/custom.css'),
            require.resolve('antd/dist/reset.css')
          ],
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        // title: 'Decert.me',
        // logo: {
        //   alt: 'Decert Logo',
        //   src: 'img/logo.png',
        // },
        items: [
          // {
          //   label: '区块链基础',
          //   position: 'left',
          //   href: 'https://decert.me/tutorial/block_basic/start/',
          // },
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: '学习 Solidity',
          },
          {
            href: 'https://github.com/decert-me/learnsolidity',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ["solidity"]   //  https://prismjs.com/#supported-languages
      },
    }),
};

module.exports = config;

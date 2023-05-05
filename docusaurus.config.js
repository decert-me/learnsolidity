// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

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
    "docusaurus-node-polyfills",
    [
      'docusaurus-plugin-dotenv',
      {
          path: "./.env", // The path to your environment variables.
          safe: false, // If false ignore safe-mode, if true load './.env.example', if a string load that file as the sample
          systemvars: false, // Set to true if you would rather load all system variables as well (useful for CI purposes)
          silent: false, //  If true, all warnings will be suppressed
          expand: false, // Allows your variables to be "expanded" for reusability within your .env file
          defaults: false, //  Adds support for dotenv-defaults. If set to true, uses ./.env.defaults
          ignoreStub: true
      }
    ]
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
            docId: 'block_basic/start',
            position: 'left',
            label: '区块链基础',
          },
          {
            type: 'doc',
            docId: 'solidity/intro',
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
      footer: {
        style: 'dark',
        links: [
          {
            title: '教程',
            items: [
              {
                label: '区块链基础',
                href: '/block_basic/start',
              },
              {
                label: 'Solidity 教程',
                to: '/solidity/intro',
                
              },
            ],
          },
          {
            title: '社区',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.com/invite/2Vg8EWpg2F',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/DecertMe',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                href: 'https://learnblockchain.cn/people/13917',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/decert-me',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Decert.me | <a style="text-decoration-line: none; color: #ebedf0" href="https://beian.miit.gov.cn/" target="_blank" rel="nofollow">粤ICP备17140514号-3</a>`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;

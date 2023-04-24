import React, { useEffect, useState } from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {
  splitNavbarItems,
  useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import NavbarItem from '@theme/NavbarItem';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import SearchBar from '@theme/SearchBar';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';
import NavbarSearch from '@theme/Navbar/Search';
import styles from './styles.module.css';
import NavbarMobileSidebarSecondaryMenu from '@theme/Navbar/MobileSidebar/SecondaryMenu';
import NavbarMobileSidebarPrimaryMenu from '@theme/Navbar/MobileSidebar/PrimaryMenu';
import {
  useSidebarBreadcrumbs,
  useHomePageRoute,
} from '@docusaurus/theme-common/internal';
import HomeBreadcrumbItem from '@theme/DocBreadcrumbs/Items/Home';
import clsx from 'clsx';
import Link from '@docusaurus/Link';


function useNavbarItems() {
  // TODO temporary casting until ThemeConfig type is improved
  return useThemeConfig().navbar.items;
}
function NavbarItems({items}) {
  return (
    <>
    {/* Custom: 隐藏github选项 */}
      {
          items.map((item, i) => (
            <NavbarItem className="custom-nav" {...item} key={i} />
          ))
      }
    {/* Custom: 隐藏github选项 */}
    </>
  );
}


function BreadcrumbsItem({children, active, index, addMicrodata, select, setSelect, toggleMenu}) {
  function isSelect(params) {
    if (index === 1) {
      toggleMenu(false)
      setSelect(!select)
    }
    if (index === 0) {
      toggleMenu(true)
      setSelect(!select)
    }
  }
  return (
    <li
      {...(addMicrodata && {
        itemScope: true,
        itemProp: 'itemListElement',
        itemType: 'https://schema.org/ListItem',
      })}
      onClick={() => isSelect()}
      className={clsx('breadcrumbs__item', {
        'breadcrumbs__item--active': active,
      })}>
      {children}
      <meta itemProp="position" content={String(index + 1)} />
    </li>
  );
}

function BreadcrumbsItemLink({children, href, isLast}) {
  const className = 'breadcrumbs__link';
  if (isLast) {
    return (
      <span className={className} itemProp="name">
        {children}
      </span>
    );
  }
  return href ? (
    <Link className={className} href={href} itemProp="item">
      <span itemProp="name">{children}</span>
    </Link>
  ) : (
    // TODO Google search console doesn't like breadcrumb items without href.
    // The schema doesn't seem to require `id` for each `item`, although Google
    // insist to infer one, even if it's invalid. Removing `itemProp="item
    // name"` for now, since I don't know how to properly fix it.
    // See https://github.com/facebook/docusaurus/issues/7241
    <span className={className}>{children}</span>
  );
}


function NavbarContentLayout(props) {
  const {left, right, setSelect, select, toggleMenu, leftItems} = props;
  const homePageRoute = useHomePageRoute();
  const breadcrumbs = useSidebarBreadcrumbs();

  return (
    <div className={`navbar__inner ${typeof window !== 'undefined' && window.screen.width <= 996 ? "custom-header" : ""}`}>
      {
        typeof window !== 'undefined' && window.screen.width > 996 ?
        <>
          <div className="navbar__items">{left}</div>
          <div className="navbar__items navbar__items--right">{right}</div>
        </>
        :
        <>
        <ul
          className="breadcrumbs"
          itemScope
          itemType="https://schema.org/BreadcrumbList">
          {
          homePageRoute && 
            <>
              <HomeBreadcrumbItem />
            </>
          }
          {leftItems.concat(breadcrumbs).map((item, idx) => {
            const isLast = idx === leftItems.concat(breadcrumbs).length - 1;
            return (
              <>
              <BreadcrumbsItem
                key={idx}
                active={isLast}
                index={idx}
                addMicrodata={!!item.href}
                select={select}
                setSelect={setSelect}
                toggleMenu={toggleMenu}
              >
                <BreadcrumbsItemLink href={item.href} isLast={isLast}>
                  {item.label}
                </BreadcrumbsItemLink>
              </BreadcrumbsItem>
              </>
            );
          })}
        </ul>
        </>
      }
    </div>
  );
}
export default function NavbarContent() {
  const mobileSidebar = useNavbarMobileSidebar();
  const items = useNavbarItems();
  const [leftItems, rightItems] = splitNavbarItems(items);
  const searchBarItem = items.find((item) => item.type === 'search');
  let [select, setSelect] = useState(false);
  const [isShow, setIsShow] = useState(false);
  let [primaryMenu, setPrimaryMenu] = useState([]);
  let [top, setTop] = useState(0);

  function toggleMenu(params) {
    setIsShow(params)
  }

  useEffect(() => {
    leftItems.map(e => {
      if (!e.href) {
        primaryMenu.push(e)
      }
    })
    setPrimaryMenu([...primaryMenu])
  },[])

  useEffect(() => {
    const box = document.querySelector(".navbar");
    const resizeObserver = new ResizeObserver(entries => {
      // 监听到元素大小变化后执行的回调函数
      const { height } = entries[0].contentRect;
      console.log(entries[0].contentRect);
      top = height;
      setTop(top);
    });

    resizeObserver.observe(box);

    return () => {
      resizeObserver.unobserve(box);
    };
  }, []);


  return (
    <>
      <NavbarContentLayout
        toggleMenu={toggleMenu}
        setSelect={setSelect}
        select={select}
        leftItems={primaryMenu}
        left={
          // TODO stop hardcoding items?
          <>
            {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
            <NavbarLogo />
            <NavbarItems items={leftItems} />
          </>
        }
        right={
          // TODO stop hardcoding items?
          // Ask the user to add the respective navbar items => more flexible
          <>
            <NavbarItems items={rightItems} />
            <NavbarColorModeToggle className={styles.colorModeToggle} />
            {!searchBarItem && (
              <NavbarSearch>
                <SearchBar />
              </NavbarSearch>
            )}
          </>
        }
      />
      {
        select &&
        <>
          <div className='custom-bread' style={{top: `${top + 16}px`}}>
            {
              isShow ?
              <NavbarMobileSidebarPrimaryMenu />
              :
              <>
              <NavbarMobileSidebarSecondaryMenu />
              </>
            }
          </div>
          <div className="custom-mask" onClick={() => setSelect(false)}></div>
        </>
      }
    </>
  );
}

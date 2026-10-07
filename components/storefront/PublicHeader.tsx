'use client';
import { useRef } from 'react';
import { ArrowUpRight, ChevronDown, Sprout } from 'lucide-react';
import AppMark from './AppMark';
import { appCatalog } from '@/products/catalog';

export default function PublicHeader({ current }: { current?: string }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (menu.current) menu.current.open = false;
  };
  const links = (
    <>
      {appCatalog.map((app) => (
        <a
          key={app.id}
          href={app.href}
          aria-current={current === app.id ? 'page' : undefined}
          onClick={close}
        >
          <AppMark product={app.id} small /><span translate="no">{app.name}</span>
          {app.id === 'typecut-pro' && <ArrowUpRight size={14} aria-hidden="true" />}
        </a>
      ))}
      <a href="/#about" onClick={close}>
        만드는 이야기
      </a>
    </>
  );
  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && menu.current?.open) {
          close();
          menu.current.querySelector('summary')?.focus();
        }
      }}
    >
      <div className="site-container site-header-inner">
        <a href="/" className="site-brand" aria-label="GroundRooted 홈" translate="no">
          <Sprout size={25} aria-hidden="true" />
          GroundRooted<span className="site-brand-dot">.</span>
        </a>
        <nav className="site-desktop-nav" aria-label="주 메뉴">
          {links}
        </nav>
        <a className="site-header-cta" href="/#apps">앱 둘러보기</a>
        <details
          ref={menu}
          className="site-mobile-menu"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) close();
          }}
        >
          <summary>
            메뉴 <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <nav aria-label="모바일 주 메뉴">
            {links}
            <a href="/#guide" onClick={close}>
              나에게 맞는 앱 찾기
            </a>
          </nav>
        </details>
      </div>
    </header>
  );
}

import type { ReactNode } from 'react';
import { PublicNav } from './PublicNav';

type AuthLayoutProps = {
  introEyebrow?: string;
  introTitle: string;
  introContent: ReactNode;
  children: ReactNode;
  wide?: boolean;
};

export function AuthLayout({
  introEyebrow,
  introTitle,
  introContent,
  children,
  wide = false,
}: AuthLayoutProps) {
  return (
    <div className="page-public">
      <PublicNav />
      <main className={`auth-shell${wide ? ' auth-shell--wide' : ''}`}>
        <div className="auth-panel auth-panel--intro">
          <div className="auth-intro__pattern" aria-hidden />
          {introEyebrow ? <p className="auth-intro__eyebrow">{introEyebrow}</p> : null}
          <h1 className="auth-panel__logo">{introTitle}</h1>
          <div className="auth-intro__content">{introContent}</div>
        </div>
        <div className={`auth-panel auth-panel--action${wide ? ' auth-panel--wide-form' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

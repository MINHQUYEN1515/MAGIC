import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { Ornament, SectionTitle } from '@/shared/ui/Ornament';
import { revealDelay, useScrollReveal } from '@/shared/ui/useScrollReveal';
import { about, commitments, hero, services } from './content';

export function HomePage() {
  const { hash } = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  useScrollReveal(rootRef);

  // React Router không tự cuộn tới #anchor khi bấm menu từ trang khác.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div ref={rootRef}>
      <section className="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow" data-reveal="up" style={revealDelay(0)}>
            {hero.eyebrow}
          </p>
          <h1 data-reveal="up" style={revealDelay(1)}>
            {hero.title}
          </h1>
          <p className="hero-subtitle" data-reveal="up" style={revealDelay(2)}>
            {hero.subtitle}
          </p>
          <div className="hero-actions" data-reveal="up" style={revealDelay(3)}>
            <a href="#dich-vu" className="btn btn-primary">
              Khám phá ›
            </a>
            <Link to="/register" className="btn btn-outline btn-outline--light">
              Đặt lịch hẹn
            </Link>
          </div>
        </div>
      </section>

      <section className="section about" id="gioi-thieu">
        <div className="section-inner about-grid">
          <div data-reveal="left">
            <div className="section-title section-title--left">
              <h2>{about.title}</h2>
              <Ornament />
            </div>
            <p className="about-lead">{about.lead}</p>
            {about.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <a href="#cam-ket" className="btn btn-outline">
              Xem thêm ›
            </a>
          </div>
          <div className="about-gallery" aria-hidden="true">
            <div className="tile tile-a" data-reveal="zoom" style={revealDelay(1, 150)} />
            <div className="tile tile-b" data-reveal="right" style={revealDelay(0)} />
            <div className="tile tile-c" data-reveal="zoom" style={revealDelay(2, 150)} />
          </div>
        </div>
      </section>

      <section className="section services" id="dich-vu">
        <div className="section-inner">
          <div data-reveal="up">
            <SectionTitle light>Dịch vụ của chúng tôi</SectionTitle>
          </div>
          <div className="service-grid">
            {services.map((s, i) => (
              <article key={s.name} className="service-card" data-reveal="up" style={revealDelay(i % 3)}>
                <div className="service-visual" style={{ background: s.tone }}>
                  <p>{s.description}</p>
                </div>
                <h3 className="service-name">{s.name}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section commitments" id="cam-ket">
        <div className="section-inner">
          <div data-reveal="up">
            <SectionTitle>Cam kết từ Magic</SectionTitle>
          </div>
          <div className="commit-grid">
            {commitments.map((c, i) => (
              <article key={c.title} className="commit-card" data-reveal="up" style={revealDelay(i)}>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="banner">
        <div className="banner-inner" data-reveal="zoom">
          <h2>Chốn bình yên khơi nguồn năng lượng mới</h2>
          <Link to="/register" className="btn btn-primary">
            Đặt lịch ngay
          </Link>
        </div>
      </section>
    </div>
  );
}

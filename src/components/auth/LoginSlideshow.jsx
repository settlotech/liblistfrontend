import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './LoginSlideshow.css';
import banner1 from '../../assets/login-slideshow/slide 1.png';
import banner2 from '../../assets/login-slideshow/slide 2.png';
import banner3 from '../../assets/login-slideshow/slide 3.png';
import banner4 from '../../assets/login-slideshow/slide 4.png';
import banner5 from '../../assets/login-slideshow/slide 5.png';
import banner7 from '../../assets/login-slideshow/slide 7.png';
import banner8 from '../../assets/login-slideshow/slide 8.png';
import banner9 from '../../assets/login-slideshow/slide 9.png';
import banner10 from '../../assets/login-slideshow/slide 10.png';

const BANNER_SLIDES = [
  { id: 1, title: 'Host Every Type of Library', image: banner1 },
  { id: 2, title: 'Organize Libraries', image: banner2 },
  { id: 3, title: 'Access Rights Aligned to Organizational Standards', image: banner3 },
  { id: 4, title: 'Communicate, Collaborate, Clarify', image: banner4 },
  { id: 5, title: 'Assign and Track Tasks', image: banner5 },
  { id: 6, title: 'Easy Modes for Library Creation', image: banner7 },
  { id: 7, title: 'Change Management Control', image: banner8 },
  { id: 8, title: 'X-Reference Libraries', image: banner9 },
  { id: 9, title: 'Multiple Level of Authorization', image: banner10 },
];

export default function LoginSlideshow({ autoPlayInterval = 5000 }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % BANNER_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  };

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(nextSlide, autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIdx, isPaused, autoPlayInterval]);

  const slide = BANNER_SLIDES[currentIdx];

  return (
    <div
      className="slideshow-root"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="slide-stage"
        aria-live="polite"
        style={{ '--slide-background': `url("${slide.image}")` }}
      >
        <img
          key={slide.id}
          className="slide-feature-screenshot"
          src={slide.image}
          alt={`${slide.title} feature banner`}
        />
      </div>

      {/* Bottom Controls: Navigation Arrows & Indicator Dots */}
      <div className="slideshow-controls">
        <button
          type="button"
          className="slideshow-nav-btn"
          onClick={prevSlide}
          title="Previous feature"
          aria-label="Previous slide"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="slideshow-dots">
          {BANNER_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`slideshow-dot ${idx === currentIdx ? 'active' : ''}`}
              onClick={() => setCurrentIdx(idx)}
              title={`Go to slide ${s.id}: ${s.title}`}
              aria-label={`Go to slide ${s.id}: ${s.title}`}
              aria-current={idx === currentIdx ? 'true' : undefined}
            />
          ))}
        </div>

        <button
          type="button"
          className="slideshow-nav-btn"
          onClick={nextSlide}
          title="Next feature"
          aria-label="Next slide"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

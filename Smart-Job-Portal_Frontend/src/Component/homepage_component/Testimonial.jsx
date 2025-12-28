import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Testimonial.module.css";

const testimonials = [
  { name: "Bessie Cooper", role: "Creative Director", img: "https://i.pravatar.cc/60?img=1",
    text: "I wanted to reach out to thank you for being a loyal customer. I noticed you achieved your goal of [Milestone] last month, and I wanted to reach out and congratulate you on your success!" },
  { name: "Rakesh Dey", role: "UI/UX Designer", img: "https://i.pravatar.cc/60?img=2",
    text: "I wanted to reach out to thank you for being a loyal customer. I noticed you achieved your goal of [Milestone] last month, and I wanted to reach out and congratulate you on your success!" },
  { name: "Priya Mehta", role: "Marketing Head", img: "https://i.pravatar.cc/60?img=3",
    text: "Working with your team was an absolute pleasure. The level of creativity and professionalism exceeded expectations." },
  { name: "John Carter", role: "Software Engineer", img: "https://i.pravatar.cc/60?img=4",
    text: "Amazing service! Communication and project management were seamless throughout the process." },
  { name: "Anita Roy", role: "Product Manager", img: "https://i.pravatar.cc/60?img=5",
    text: "The designs elevated our brand. Clear process, quick iterations, great outcomes." },
  { name: "Liam Park", role: "Founder, NXT", img: "https://i.pravatar.cc/60?img=6",
    text: "From UX strategy to micro-interactions, the attention to detail was outstanding." },
];

/** chunk into pairs => 2 cards per slide */
function chunkPairs(list) {
  const out = [];
  for (let i = 0; i < list.length; i += 2) {
    out.push(list.slice(i, i + 2));
  }
  return out;
}

export default function Testimonials() {
  const slides = useMemo(() => chunkPairs(testimonials), []);
  const total = slides.length;

  // Build extended slides for infinite loop: [last, ...slides, first]
  const extendedSlides = useMemo(
    () => [slides[total - 1], ...slides, slides[0]],
    [slides, total]
  );

  const [index, setIndex] = useState(1);         // start on the real first slide
  const [animating, setAnimating] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false); //new
  const trackRef = useRef(null);
  const hoverRef = useRef(false);

  // ---- autoplay every 3s, pause on hover
  useEffect(() => {
    const id = setInterval(() => {
      if (!hoverRef.current) {
        setIndex((i) => i + 1);
      }
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // handle seamless jump after transition ends
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleTransitionEnd = () => {
      setIsTransitioning(false);

      if (index === total + 1) {
        setAnimating(false);
        setIndex(1); // jump to real first
      } else if (index === 0) {
        setAnimating(false);
        setIndex(total); // jump to real last
      }
    };

    track.addEventListener("transitionend", handleTransitionEnd);
    return () => track.removeEventListener("transitionend", handleTransitionEnd);
  }, [index, total]);

  // re-enable transition after instant jump
  useEffect(() => {
    if (!animating) {
      const timeout = setTimeout(() => setAnimating(true), 50);
      return () => clearTimeout(timeout);
    }
  }, [animating]);

  //  handle next/prev safely
  const next = () => {
    if (isTransitioning) return; // ignore if already sliding
    setIsTransitioning(true);
    setIndex((i) => (i >= total + 1 ? 1 : i + 1));
  };

  const prev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIndex((i) => (i <= 0 ? total : i - 1));
  };

  const handleMouseEnter = () => (hoverRef.current = true);
  const handleMouseLeave = () => (hoverRef.current = false);

  const active = (index - 1 + total) % total;

  return (
    <section
      className={styles["testimonial-section"]}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles["testimonial-viewport"]}>
        <button
          className={[styles["arrow-btn"], styles["is-left"]].join(" ")}
          onClick={prev}
          aria-label="Previous testimonials"
          disabled={isTransitioning} // 🚫 disable while moving
        >
          <img src="../Images/Homepage/Assets/arrow-left.svg" alt="" />
        </button>

        <div className={styles["track-mask"]}>
          <div
            ref={trackRef}
            className={`${styles.track} ${animating ? styles["with-transition"] : ""}`}
            style={{
              transform: `translateX(-${index * 100}%)`,
            }}
          >
            {extendedSlides.map((pair, sIdx) => (
              <div className={styles.slide} key={`s-${sIdx}`}>
                {pair.map((item, i) => (
                  <article className={styles["testimonial-card"]} key={`${sIdx}-${i}`}>
                    <div className={styles.stars} aria-hidden>★★★★★</div>
                    <p className={styles["testimonial-text"]}>“{item.text}”</p>
                    <div className={styles["testimonial-footer"]}>
                      <img src={item.img} alt={item.name} className={styles.avatar} />
                      <div>
                        <h4>{item.name}</h4>
                        <p>{item.role}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          className={[styles["arrow-btn"], styles["is-right"]].join(" ")}
          onClick={next}
          aria-label="Next testimonials"
          disabled={isTransitioning}
        >
          <img src="../Images/Homepage/Assets/arrow-right2.svg" alt="" />
        </button>
      </div>

      {/*  Pagination Dots */}
      <div className={styles.pagination} role="tablist" aria-label="Testimonial pages">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              className={styles["dot-wrap"]}
              onClick={() => !isTransitioning && setIndex(i + 1)}
              aria-current={isActive ? "true" : "false"}
              aria-label={`Go to slide ${i + 1}`}
            >
              <span className={`${styles.dot} ${isActive ? styles.active : ""}`} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { ProductImagePlaceholder } from "../common/ProductImagePlaceholder";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream to-cream-dark">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-8 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
        <div className="text-center md:text-left">
          <div className="mb-3.5 text-[12.5px] font-bold uppercase tracking-[0.15em] text-sage">
            Handcrafted &middot; Sustainable &middot; Safe
          </div>
          <h1 className="text-[40px] font-normal leading-[1.12] sm:text-[52px]">
            Play.
            <br />
            Learn.
            <br />
            <span className="font-medium italic text-gold">Grow Together.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-ink-soft md:mx-0">
            Thoughtfully designed toys that inspire creativity, learning and endless joy — for every age and stage.
          </p>
          <Link
            to="/shop"
            className="mt-7 inline-flex items-center gap-2.5 rounded-md bg-gold px-6 py-3.5 text-[13.5px] font-bold uppercase tracking-wider text-white transition-all hover:-translate-y-0.5 hover:bg-gold-dark"
          >
            Shop Now
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="mx-auto h-[260px] w-full max-w-[420px] sm:h-[380px]">
          <ProductImagePlaceholder />
        </div>
      </div>
    </section>
  );
}

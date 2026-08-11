import { Link } from "react-router-dom";
import { Button } from "@yrs/ui";

export function AboutPage() {
  return (
    <div>
      <section className="bg-cream-dark py-16">
        <div className="mx-auto max-w-[760px] px-5 text-center sm:px-8">
          <div className="mb-3.5 text-[12.5px] font-bold uppercase tracking-[0.15em] text-sage">Our story</div>
          <h1 className="text-[32px] leading-tight sm:text-[42px]">
            Play. Learn. <span className="italic text-gold">Grow together.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
            YRS Toys began with a simple belief: the toys we hand our children should be as thoughtfully made as
            everything else in their world. Every piece in our catalog is chosen — or crafted — to be handcrafted,
            sustainable and safe from the very first touch.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-5 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <h2 className="font-display text-xl">Handcrafted</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
              We work with small workshops and independent makers who care about the details — smooth edges, sturdy
              joins, stitching that holds up to years of play.
            </p>
          </div>
          <div>
            <h2 className="font-display text-xl">Sustainable</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
              From responsibly sourced wood to recycled plush filling and water-based dyes, we choose materials that
              are gentle on little hands and on the planet they'll grow up on.
            </p>
          </div>
          <div>
            <h2 className="font-display text-xl">Safe</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
              Every product is tested against strict safety standards — non-toxic finishes, no small detachable
              parts below age guidelines, and rounded edges throughout.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="font-display text-2xl">Ready to explore?</h2>
          <p className="mt-2 text-sm text-ink-soft">Discover toys sorted by age, category, or what's new this season.</p>
          <Link to="/shop" className="mt-6 inline-block">
            <Button>Shop the collection</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

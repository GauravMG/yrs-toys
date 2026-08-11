import { Spinner } from "@yrs/ui";
import { useFeaturedProducts } from "../hooks/useProducts";
import { Hero } from "../components/home/Hero";
import { TrustBadges } from "../components/home/TrustBadges";
import { ShopByAge } from "../components/home/ShopByAge";
import { PerksRow } from "../components/home/PerksRow";
import { SectionHeading } from "../components/common/SectionHeading";
import { ProductGrid } from "../components/product/ProductGrid";

export function HomePage() {
  const { data, isLoading } = useFeaturedProducts(8);

  return (
    <div>
      <Hero />
      <TrustBadges />

      <section className="mx-auto max-w-[1240px] px-5 pb-6 pt-16 sm:px-8">
        <SectionHeading title="Featured Products" />
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <ProductGrid products={data?.items ?? []} />
        )}
      </section>

      <ShopByAge />
      <PerksRow />
    </div>
  );
}

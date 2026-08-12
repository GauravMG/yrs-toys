import path from "node:path";
import { config as loadEnv } from "dotenv";
import { PrismaClient, AgeGroup, Role, ReviewStatus, CouponType } from "@prisma/client";
import argon2 from "argon2";

// Run directly via `tsx prisma/seed.ts` (both by hand and via `prisma db
// seed`'s orchestration), this script bypasses prisma.config.ts entirely —
// that file's env loading only applies to Prisma CLI commands (generate,
// migrate). Load the monorepo root .env explicitly here too, the same way
// prisma.config.ts and apps/api/src/config/env.ts do, so this doesn't
// silently depend on @prisma/client's own narrower auto-loading (which
// only looks next to schema.prisma, not at the repo root).
loadEnv({ path: path.join(import.meta.dirname, "../../../.env") });

const prisma = new PrismaClient();

function img(seed: string, position: number, isPrimary: boolean) {
  return {
    url: `https://picsum.photos/seed/yrs-${seed}/900/900`,
    altText: seed.replace(/-/g, " "),
    position,
    isPrimary,
  };
}

const CATEGORIES = [
  { slug: "wooden-toys", name: "Wooden Toys", description: "Timeless, handcrafted wooden pieces built to last generations.", sortOrder: 1 },
  { slug: "soft-plush", name: "Soft & Plush", description: "Cuddly companions in child-safe, hypoallergenic fabrics.", sortOrder: 2 },
  { slug: "activity-learning", name: "Activity & Learning", description: "Toys chosen for what they teach, hidden inside the fun.", sortOrder: 3 },
  { slug: "ride-ons-outdoor", name: "Ride-ons & Outdoor", description: "Built for real hands-on, outdoor, energetic play.", sortOrder: 4 },
  { slug: "puzzles-games", name: "Puzzles & Games", description: "Focus, patience and problem-solving, one piece at a time.", sortOrder: 5 },
  { slug: "new-baby", name: "New Baby", description: "Gentle first toys for tiny, curious hands.", sortOrder: 6 },
] as const;

const PRODUCTS: Array<{
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  priceInPaise: number;
  compareAtPriceInPaise?: number;
  sku: string;
  stock: number;
  ageGroup: AgeGroup;
  category: (typeof CATEGORIES)[number]["slug"];
  material?: string;
  safetyInfo?: string;
  isFeatured?: boolean;
}> = [
  {
    slug: "panda-plush-toy",
    name: "Panda Plush Toy",
    shortDescription: "A cuddly companion with a soft, huggable body.",
    description:
      "A cuddly companion with a soft, huggable body and gentle stitched features — perfect for naptime snuggles. Filled with recycled, child-safe stuffing and finished with non-toxic dyes.",
    priceInPaise: 59900,
    sku: "YRS-PANDA-001",
    stock: 42,
    ageGroup: AgeGroup.AGE_0_1,
    category: "soft-plush",
    material: "Organic cotton, recycled polyester fill",
    safetyInfo: "Machine washable. Meets IS 9873 toy safety standard.",
    isFeatured: true,
  },
  {
    slug: "rainbow-ring-stacker",
    name: "Rainbow Ring Stacker",
    shortDescription: "Chunky wooden rings that build focus and colour recognition.",
    description:
      "Chunky wooden rings in warm painted tones help little hands practice balance, colour sorting and fine motor skills. Each ring is hand-sanded smooth and finished with water-based, food-safe paint.",
    priceInPaise: 49900,
    sku: "YRS-STACK-001",
    stock: 35,
    ageGroup: AgeGroup.AGE_1_3,
    category: "wooden-toys",
    material: "Sustainably sourced rubberwood",
    safetyInfo: "No small detachable parts. Water-based paint, lead-free.",
    isFeatured: true,
  },
  {
    slug: "six-sided-activity-cube",
    name: "Six-Sided Activity Cube",
    shortDescription: "Shape sorting, bead mazes and spinners in one cube.",
    description:
      "Six sides of shape sorting, bead mazes and spinners keep curious minds busy for hours of independent play. A bestseller for a reason — durable enough for daily use across siblings.",
    priceInPaise: 89900,
    compareAtPriceInPaise: 109900,
    sku: "YRS-CUBE-001",
    stock: 20,
    ageGroup: AgeGroup.AGE_1_3,
    category: "activity-learning",
    material: "Birch plywood, beechwood beads",
    safetyInfo: "Beads are fixed to wire and cannot be removed. IS 9873 certified.",
    isFeatured: true,
  },
  {
    slug: "dancing-cactus-plush",
    name: "Dancing Cactus Plush",
    shortDescription: "A cheerful plush cactus with a friendly stitched smile.",
    description:
      "A cheerful plush cactus with a friendly stitched smile — a quirky desk buddy for growing imaginations. No batteries, no noise, just a soft plush best friend.",
    priceInPaise: 39900,
    sku: "YRS-CACTUS-001",
    stock: 50,
    ageGroup: AgeGroup.AGE_3_6,
    category: "soft-plush",
    material: "Plush polyester, cotton fill",
    safetyInfo: "Surface washable only. Meets IS 9873 toy safety standard.",
  },
  {
    slug: "wooden-pull-along-elephant",
    name: "Wooden Pull-Along Elephant",
    shortDescription: "A friendly elephant on wheels for first steps and first walks.",
    description:
      "Wobbling ears and a gentle rattle inside make this pull-along elephant a favourite for first steps. The cord is short and looped for safety, and the wheels are weighted for a steady, satisfying roll.",
    priceInPaise: 74900,
    sku: "YRS-ELE-001",
    stock: 28,
    ageGroup: AgeGroup.AGE_1_3,
    category: "wooden-toys",
    material: "Rubberwood, cotton pull-cord",
    safetyInfo: "Pull-cord under 22cm per safety guidelines. IS 9873 certified.",
  },
  {
    slug: "stacking-ring-tower-classic",
    name: "Classic Ring Tower",
    shortDescription: "The original stacking toy, reimagined in warm tones.",
    description:
      "A timeless stacking toy that grows with your child — start with guided stacking, graduate to independent sorting by size. Rounded edges, no sharp corners, finished by hand.",
    priceInPaise: 44900,
    sku: "YRS-RING-001",
    stock: 60,
    ageGroup: AgeGroup.AGE_0_1,
    category: "new-baby",
    material: "Beechwood",
    safetyInfo: "Base weighted to prevent tipping. IS 9873 certified.",
  },
  {
    slug: "giraffe-teether-rattle",
    name: "Giraffe Teether Rattle",
    shortDescription: "A gentle first rattle with a soft, chewable neck.",
    description:
      "Soft silicone teething ears meet a smooth wooden rattle body — designed for tiny hands to grip and tiny gums to chew. Freezer-safe silicone parts for teething relief.",
    priceInPaise: 34900,
    sku: "YRS-GIRAFFE-001",
    stock: 65,
    ageGroup: AgeGroup.AGE_0_1,
    category: "new-baby",
    material: "Beechwood, food-grade silicone",
    safetyInfo: "BPA-free, dishwasher safe silicone parts. IS 9873 certified.",
    isFeatured: true,
  },
  {
    slug: "wooden-train-set-32pc",
    name: "32-Piece Wooden Train Set",
    shortDescription: "Curved and straight tracks with a working magnetic coupler train.",
    description:
      "Thirty-two interlocking track pieces plus a three-carriage magnetic train — build a new layout every afternoon. Compatible with most other wooden train brands.",
    priceInPaise: 129900,
    sku: "YRS-TRAIN-001",
    stock: 18,
    ageGroup: AgeGroup.AGE_3_6,
    category: "wooden-toys",
    material: "Beechwood, magnetic couplers",
    safetyInfo: "Magnets fully enclosed and impact-tested. IS 9873 certified.",
    isFeatured: true,
  },
  {
    slug: "shape-sorter-barn",
    name: "Shape Sorter Barn",
    shortDescription: "A painted wooden barn that teaches shapes through play.",
    description:
      "Ten chunky shapes find their home through matching cut-outs in this hand-painted barn. The roof lifts off for easy shape retrieval and quick tidy-up.",
    priceInPaise: 64900,
    sku: "YRS-BARN-001",
    stock: 30,
    ageGroup: AgeGroup.AGE_1_3,
    category: "activity-learning",
    material: "Pine, water-based paint",
    safetyInfo: "Shapes sized to prevent choking per IS 9873.",
  },
  {
    slug: "world-map-floor-puzzle",
    name: "World Map Floor Puzzle",
    shortDescription: "A 48-piece floor puzzle that doubles as a geography lesson.",
    description:
      "Extra-large, extra-thick pieces assemble into a colourful world map poster-sized for floor play. A gentle introduction to continents, oceans and country shapes.",
    priceInPaise: 54900,
    sku: "YRS-PUZZLE-001",
    stock: 40,
    ageGroup: AgeGroup.AGE_3_6,
    category: "puzzles-games",
    material: "Recycled cardboard, soy-based inks",
    safetyInfo: "Choking hazard for children under 3. IS 9873 certified.",
  },
  {
    slug: "balance-bike-birch",
    name: "Birch Balance Bike",
    shortDescription: "A pedal-free bike that builds confidence before the training wheels.",
    description:
      "A lightweight, pedal-free wooden balance bike that teaches steering and balance before a single pedal is pushed. Adjustable seat grows with your child across two years of riding.",
    priceInPaise: 349900,
    compareAtPriceInPaise: 399900,
    sku: "YRS-BIKE-001",
    stock: 12,
    ageGroup: AgeGroup.AGE_3_6,
    category: "ride-ons-outdoor",
    material: "Birch plywood frame, rubber tyres",
    safetyInfo: "Max rider weight 35kg. Adult assembly required.",
    isFeatured: true,
  },
  {
    slug: "magnetic-building-tiles-60pc",
    name: "60-Piece Magnetic Building Tiles",
    shortDescription: "Translucent magnetic tiles for towers, castles and everything between.",
    description:
      "Sixty vividly coloured, translucent magnetic tiles snap together into towers, castles and shapes limited only by imagination. Strong, rounded magnets are fully sealed inside each tile.",
    priceInPaise: 159900,
    sku: "YRS-TILES-001",
    stock: 25,
    ageGroup: AgeGroup.AGE_3_6,
    category: "activity-learning",
    material: "ABS plastic, sealed neodymium magnets",
    safetyInfo: "Magnets sealed and drop-tested. Not for children under 3.",
  },
  {
    slug: "wooden-kitchen-playset",
    name: "Wooden Kitchen Playset",
    shortDescription: "A mini kitchen with a working knob stove and play sink.",
    description:
      "A compact wooden kitchen with a clicking stove knob, a play sink with a spinning tap, and open shelving for pretend-cooking sets sold separately. Flat-packs for easy home assembly.",
    priceInPaise: 449900,
    sku: "YRS-KITCHEN-001",
    stock: 8,
    ageGroup: AgeGroup.AGE_3_6,
    category: "activity-learning",
    material: "MDF, non-toxic paint",
    safetyInfo: "Adult assembly required. Wall-anchor strap included.",
  },
  {
    slug: "soft-bunny-comforter",
    name: "Soft Bunny Comforter",
    shortDescription: "A flat, huggable bunny with a silky-edged security blanket.",
    description:
      "A flat, easy-to-grip bunny with a silky ribbon-edged blanket body — a favourite for sleep training and travel. Fits easily into a bag, stroller clip included.",
    priceInPaise: 44900,
    sku: "YRS-BUNNY-001",
    stock: 55,
    ageGroup: AgeGroup.AGE_0_1,
    category: "soft-plush",
    material: "Bamboo cotton blend, satin trim",
    safetyInfo: "Machine washable at 30°C. Meets IS 9873 toy safety standard.",
  },
  {
    slug: "dino-figures-set-8pc",
    name: "8-Piece Dinosaur Figures Set",
    shortDescription: "Hand-painted dinosaurs for prehistoric pretend play.",
    description:
      "Eight hand-painted dinosaur figures, from a gentle Brachiosaurus to a fierce T-Rex, each detailed enough for close inspection and sturdy enough for backyard digs.",
    priceInPaise: 59900,
    sku: "YRS-DINO-001",
    stock: 33,
    ageGroup: AgeGroup.AGE_3_6,
    category: "puzzles-games",
    material: "Solid rubber",
    safetyInfo: "Phthalate-free rubber. IS 9873 certified.",
  },
  {
    slug: "wooden-xylophone",
    name: "8-Note Wooden Xylophone",
    shortDescription: "A true-tuned first instrument in a rainbow of colours.",
    description:
      "Eight true-tuned bars in rainbow colours introduce rhythm and melody, with a chunky mallet sized for toddler grip. Solid beechwood frame for years of enthusiastic drumming.",
    priceInPaise: 54900,
    sku: "YRS-XYLO-001",
    stock: 38,
    ageGroup: AgeGroup.AGE_1_3,
    category: "activity-learning",
    material: "Beechwood, painted metal bars",
    safetyInfo: "Mallet sized to prevent choking. IS 9873 certified.",
  },
  {
    slug: "art-easel-double-sided",
    name: "Double-Sided Art Easel",
    shortDescription: "A chalkboard on one side, whiteboard-and-paper roll on the other.",
    description:
      "A sturdy, height-adjustable easel with a chalkboard on one side and a magnetic whiteboard with a paper roll holder on the other — a growing artist's whole studio in one frame.",
    priceInPaise: 249900,
    sku: "YRS-EASEL-001",
    stock: 15,
    ageGroup: AgeGroup.AGE_3_6,
    category: "activity-learning",
    material: "Pine frame, MDF panels",
    safetyInfo: "Adult assembly required. Stability-tested base.",
  },
  {
    slug: "outdoor-water-play-table",
    name: "Outdoor Water Play Table",
    shortDescription: "A splash-friendly table with a working hand-crank waterwheel.",
    description:
      "A weatherproof play table with a hand-crank waterwheel, two boat channels and a drain plug for easy end-of-day emptying — built for hours of backyard splashing.",
    priceInPaise: 399900,
    sku: "YRS-WATER-001",
    stock: 10,
    ageGroup: AgeGroup.AGE_3_6,
    category: "ride-ons-outdoor",
    material: "UV-stabilised polypropylene",
    safetyInfo: "Adult supervision recommended near water. Adult assembly required.",
  },
];

async function main() {
  console.log("Seeding YRS Toys database...");

  const adminPasswordHash = await argon2.hash("Admin@12345");
  const admin = await prisma.user.upsert({
    where: { email: "admin@yrstoys.in" },
    update: {},
    create: {
      email: "admin@yrstoys.in",
      passwordHash: adminPasswordHash,
      fullName: "YRS Admin",
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
    },
  });

  const customerPasswordHash = await argon2.hash("Customer@12345");
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      passwordHash: customerPasswordHash,
      fullName: "Asha Verma",
      phone: "9876543210",
      role: Role.CUSTOMER,
      emailVerifiedAt: new Date(),
      addresses: {
        create: [
          {
            label: "Home",
            fullName: "Asha Verma",
            phone: "9876543210",
            line1: "14 Lotus Enclave",
            line2: "Near Green Park",
            city: "New Delhi",
            state: "Delhi",
            postalCode: "110016",
            country: "India",
            isDefault: true,
          },
        ],
      },
    },
  });

  const categoryBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: c,
    });
    categoryBySlug.set(c.slug, category.id);
  }

  const productIdBySlug = new Map<string, string>();
  for (const p of PRODUCTS) {
    const categoryId = categoryBySlug.get(p.category);
    if (!categoryId) throw new Error(`Unknown category ${p.category}`);
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        priceInPaise: p.priceInPaise,
        compareAtPriceInPaise: p.compareAtPriceInPaise,
        sku: p.sku,
        stock: p.stock,
        ageGroup: p.ageGroup,
        categoryId,
        material: p.material,
        safetyInfo: p.safetyInfo,
        isFeatured: p.isFeatured ?? false,
        images: {
          create: [img(p.slug, 0, true), img(`${p.slug}-alt`, 1, false)],
        },
      },
    });
    productIdBySlug.set(p.slug, product.id);
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: CouponType.PERCENTAGE,
      value: 10,
      minOrderAmountInPaise: 99900,
      maxDiscountInPaise: 30000,
      usageLimitPerUser: 1,
      isActive: true,
    },
  });

  const reviewSeeds: Array<{ slug: string; rating: number; title: string; comment: string }> = [
    { slug: "panda-plush-toy", rating: 5, title: "Softest toy we own", comment: "My daughter sleeps with it every night. Great stitching quality." },
    { slug: "rainbow-ring-stacker", rating: 5, title: "Perfect first stacker", comment: "Sturdy wood, no splinters, colours are vivid but not gaudy." },
    { slug: "six-sided-activity-cube", rating: 4, title: "Keeps him busy", comment: "Great for long car rides. One side is trickier for younger toddlers." },
    { slug: "wooden-train-set-32pc", rating: 5, title: "Compatible with our other tracks", comment: "Works great with our existing wooden train collection." },
    { slug: "balance-bike-birch", rating: 5, title: "Confidence booster", comment: "My son went from balance bike to pedal bike in one summer." },
  ];
  for (const r of reviewSeeds) {
    const productId = productIdBySlug.get(r.slug);
    if (!productId) continue;
    await prisma.review.upsert({
      where: { productId_userId: { productId, userId: customer.id } },
      update: {},
      create: {
        productId,
        userId: customer.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isVerifiedPurchase: true,
        status: ReviewStatus.APPROVED,
      },
    });
  }

  for (const slug of reviewSeeds.map((r) => r.slug)) {
    const productId = productIdBySlug.get(slug);
    if (!productId) continue;
    const agg = await prisma.review.aggregate({
      where: { productId, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: agg._avg.rating ?? 0,
        reviewCount: agg._count.rating,
      },
    });
  }

  console.log(`Seeded: admin=${admin.email}, customer=${customer.email}, ${CATEGORIES.length} categories, ${PRODUCTS.length} products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

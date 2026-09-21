import { Router } from "express";
import Agency from "../models/Agency.js";

const router = Router();

// GET /api/portfolio
// Aggregates portfolio items across all agencies into a flat list.
// Supports ?service=, ?industry=, ?country=, ?agency=<slug>, ?limit=
router.get("/", async (req, res, next) => {
  try {
    const { service, industry, country, agency, limit = "120" } = req.query;

    const match = { verified: true };
    if (country) match.country = country;
    if (industry) match.industries = industry;
    if (agency) match.slug = agency;

    const pipeline = [
      { $match: match },
      { $unwind: "$portfolio" },
    ];

    if (service) {
      pipeline.push({ $match: { "portfolio.category": service } });
    }

    pipeline.push(
      {
        $project: {
          _id: 0,
          item: "$portfolio",
          agency: {
            slug: "$slug",
            name: "$name",
            tagline: "$tagline",
            city: "$city",
            country: "$country",
            countryCode: "$countryCode",
            logoSeed: "$logoSeed",
            rating: "$rating",
            reviewCount: "$reviewCount",
            verified: "$verified",
            featured: "$featured",
            services: "$services",
            industries: "$industries",
          },
          // Pick a representative industry for filtering & display
          industry: { $arrayElemAt: ["$industries", 0] },
        },
      },
      { $sort: { "agency.featured": -1, "agency.rating": -1 } },
      { $limit: Math.min(Number(limit) || 120, 500) }
    );

    const items = await Agency.aggregate(pipeline);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

// GET /api/portfolio/agency/:slug — portfolio for one agency
router.get("/agency/:slug", async (req, res, next) => {
  try {
    const agency = await Agency.findOne({ slug: req.params.slug }).select(
      "slug name portfolio"
    );
    if (!agency) return res.status(404).json({ error: "Agency not found" });
    res.json({
      agency: { slug: agency.slug, name: agency.name },
      items: agency.portfolio || [],
    });
  } catch (e) {
    next(e);
  }
});

function slugify(s = "") {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/portfolio/agency/:slug/item/:itemSlug — single portfolio item with full agency context
router.get("/agency/:slug/item/:itemSlug", async (req, res, next) => {
  try {
    const agency = await Agency.findOne({ slug: req.params.slug });
    if (!agency) return res.status(404).json({ error: "Agency not found" });
    const items = agency.portfolio || [];
    const item = items.find((p) => slugify(p.title) === req.params.itemSlug);
    if (!item) return res.status(404).json({ error: "Project not found" });
    res.json({
      item,
      agency: {
        slug: agency.slug,
        name: agency.name,
        tagline: agency.tagline,
        city: agency.city,
        country: agency.country,
        countryCode: agency.countryCode,
        logoSeed: agency.logoSeed,
        rating: agency.rating,
        reviewCount: agency.reviewCount,
        verified: agency.verified,
        featured: agency.featured,
        services: agency.services,
        industries: agency.industries,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
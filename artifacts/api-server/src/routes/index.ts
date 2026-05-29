import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import offersRouter from "./offers.js";
import categoriesRouter from "./categories.js";
import brandsRouter from "./brands.js";
import blogRouter from "./blog.js";
import searchRouter from "./search.js";
import seoRouter from "./seo.js";
import redirectRouter from "./redirect.js";
import adminStatsRouter from "./admin/stats.js";
import adminOffersRouter from "./admin/offers.js";
import adminCategoriesRouter from "./admin/categories.js";
import adminBrandsRouter from "./admin/brands.js";
import adminBlogRouter from "./admin/blog.js";
import adminIndexingRouter from "./admin/indexing.js";
import adminUsersRouter from "./admin/users.js";
import adminCouponsRouter from "./admin/coupons.js";
import { requireAdmin } from "../middleware/requireAuth.js";

const router: IRouter = Router();

// Public routes
router.use(healthRouter);
router.use(authRouter);
router.use(offersRouter);
router.use(categoriesRouter);
router.use(brandsRouter);
router.use(blogRouter);
router.use(searchRouter);
router.use(seoRouter);
router.use(redirectRouter);

// Admin routes (protected)
router.use(requireAdmin, adminStatsRouter);
router.use(requireAdmin, adminOffersRouter);
router.use(requireAdmin, adminCategoriesRouter);
router.use(requireAdmin, adminBrandsRouter);
router.use(requireAdmin, adminBlogRouter);
router.use(requireAdmin, adminIndexingRouter);
router.use(requireAdmin, adminCouponsRouter);
router.use(adminUsersRouter);

export default router;

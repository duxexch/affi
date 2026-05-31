import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";

import offersRouter from "./offers.js";
import categoriesRouter from "./categories.js";
import brandsRouter from "./brands.js";
import blogRouter from "./blog.js";
import searchRouter from "./search.js";
import seoRouter from "./seo.js";
import seoPagesRouter from "./seo-pages.js";
import redirectRouter from "./redirect.js";
import couponsAdminRouter from "./admin/coupons.js";
import uploadsAdminRouter from "./admin/uploads.js";
import footballRouter from "./football.js";

import adminOffersRouter from "./admin/offers.js";
import adminCategoriesRouter from "./admin/categories.js";
import adminBrandsRouter from "./admin/brands.js";
import adminBlogRouter from "./admin/blog.js";
import adminIndexingRouter from "./admin/indexing.js";
import adminUsersRouter from "./admin/users.js";

const router: IRouter = Router();

// Health + auth always
router.use(healthRouter);
router.use(authRouter);

// Public content APIs used by the React frontend
router.use(offersRouter);
router.use(categoriesRouter);
router.use(brandsRouter);
router.use(blogRouter);
router.use(searchRouter);
router.use(seoRouter);
router.use(seoPagesRouter);
router.use(redirectRouter);
router.use(footballRouter);

// Admin content CRUD endpoints (used by admin panel)
router.use(adminOffersRouter);
router.use(adminCategoriesRouter);
router.use(adminBrandsRouter);
router.use(adminBlogRouter);
router.use(adminIndexingRouter);
router.use(adminUsersRouter);

// Admin “public” endpoints (used by frontend offer details)
router.use(couponsAdminRouter);

// Admin uploads (used by admin panel to upload images/videos)
router.use(uploadsAdminRouter);

export default router;

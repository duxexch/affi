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
import couponsAdminRouter from "./admin/coupons.js";
import uploadsAdminRouter from "./admin/uploads.js";

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
router.use(redirectRouter);

// Admin “public” endpoints (used by frontend offer details)
router.use(couponsAdminRouter);

// Admin uploads (used by admin panel to upload images/videos)
router.use(uploadsAdminRouter);

export default router;

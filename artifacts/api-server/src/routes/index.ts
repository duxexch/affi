import { Router, type IRouter } from "express";
import healthRouter from "./health";
import offersRouter from "./offers";
import categoriesRouter from "./categories";
import brandsRouter from "./brands";
import blogRouter from "./blog";
import searchRouter from "./search";
import adminStatsRouter from "./admin/stats";
import adminOffersRouter from "./admin/offers";
import adminCategoriesRouter from "./admin/categories";
import adminBrandsRouter from "./admin/brands";
import adminBlogRouter from "./admin/blog";
import adminIndexingRouter from "./admin/indexing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(offersRouter);
router.use(categoriesRouter);
router.use(brandsRouter);
router.use(blogRouter);
router.use(searchRouter);
router.use(adminStatsRouter);
router.use(adminOffersRouter);
router.use(adminCategoriesRouter);
router.use(adminBrandsRouter);
router.use(adminBlogRouter);
router.use(adminIndexingRouter);

export default router;

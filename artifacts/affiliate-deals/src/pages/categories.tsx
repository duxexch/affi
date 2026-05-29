import { useListCategories } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { CategoryCard } from "@/components/category-card";
import { Seo } from "@/components/seo";
import { CategoryCardSkeleton } from "@/components/skeletons";

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <Layout>
      <Seo
        title="Browse by Category"
        description="Explore the best deals organized by category — electronics, fashion, food, travel, and more."
        url="/categories"
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground mt-2">Browse offers by category.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <CategoryCardSkeleton key={i} />)}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map(category => <CategoryCard key={category.id} category={category} />)}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
          No categories found.
        </div>
      )}
    </Layout>
  );
}

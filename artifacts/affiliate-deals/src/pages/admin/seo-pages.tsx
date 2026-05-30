import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const slugOptions = [
  "about",
  "contact",
  "privacy-policy",
  "terms-of-service",
  "faq",
  "how-it-works",
  "refund-policy",
  "advertising",
  "support",
  "careers",
] as const;

type SeoSlug = (typeof slugOptions)[number];

type SeoPageRow = {
  id: number;
  slug: SeoSlug | string;
  titleAr: string;
  titleEn: string;
  excerptAr: string | null;
  excerptEn: string | null;
  contentAr: string | null;
  contentEn: string | null;
  isPublished: boolean;
};

const seoPageFormSchema = z.object({
  slug: z.string(),
  titleAr: z.string().min(1, "Title AR is required"),
  titleEn: z.string().min(1, "Title EN is required"),
  excerptAr: z.string().optional().nullable(),
  excerptEn: z.string().optional().nullable(),
  contentAr: z.string().optional().nullable(),
  contentEn: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});

type SeoPageFormValues = z.infer<typeof seoPageFormSchema>;

export default function AdminSeoPages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const DefaultItems: SeoPageRow[] = useMemo(
    () =>
      slugOptions.map((slug) => ({
        id: 0,
        slug,
        titleAr: "",
        titleEn: "",
        excerptAr: "",
        excerptEn: "",
        contentAr: "",
        contentEn: "",
        isPublished: true,
      })),
    [],
  );

  const [items, setItems] = useState<SeoPageRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SeoPageRow | null>(null);

  const form = useForm<SeoPageFormValues>({
    resolver: zodResolver(seoPageFormSchema),
    defaultValues: {
      slug: "",
      titleAr: "",
      titleEn: "",
      excerptAr: "",
      excerptEn: "",
      contentAr: "",
      contentEn: "",
      isPublished: true,
    },
  });

  const editTitle = useMemo(() => {
    if (!editing) return "Edit SEO Page";
    return `Edit: ${editing.slug}`;
  }, [editing]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo-pages", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load SEO pages");
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to load SEO pages",
        variant: "destructive",
      });
      setItems(DefaultItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (row: SeoPageRow) => {
    setEditing(row);
    form.reset({
      slug: row.slug,
      titleAr: row.titleAr ?? "",
      titleEn: row.titleEn ?? "",
      excerptAr: row.excerptAr ?? "",
      excerptEn: row.excerptEn ?? "",
      contentAr: row.contentAr ?? "",
      contentEn: row.contentEn ?? "",
      isPublished: !!row.isPublished,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: SeoPageFormValues) => {
    if (!values.slug) return;

    try {
      const res = await fetch(`/api/admin/seo-pages/${encodeURIComponent(values.slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          titleAr: values.titleAr,
          titleEn: values.titleEn,
          excerptAr: values.excerptAr ?? null,
          excerptEn: values.excerptEn ?? null,
          contentAr: values.contentAr ?? null,
          contentEn: values.contentEn ?? null,
          isPublished: values.isPublished,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to update SEO page");
      }

      toast({ title: "Success", description: "SEO page updated" });
      setIsDialogOpen(false);
      setEditing(null);
      await load();
      queryClient.invalidateQueries();
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Failed to update SEO page",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Pages (AR/EN)</h1>
          <p className="text-muted-foreground mt-1">Edit content for fixed SEO pages.</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-48" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead>Title (AR)</TableHead>
                <TableHead>Title (EN)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items && items.length > 0 ? (
                items.map((row) => (
                  <TableRow key={row.slug}>
                    <TableCell className="font-mono">{row.slug}</TableCell>
                    <TableCell>{row.titleAr}</TableCell>
                    <TableCell>{row.titleEn}</TableCell>
                    <TableCell>
                      {row.isPublished ? (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                          Draft
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No SEO pages found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(o) => setIsDialogOpen(o)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTitle}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="opacity-70 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="titleAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (AR)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="titleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (EN)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="excerptAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt (AR)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Optional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="excerptEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt (EN)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Optional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contentAr"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Content (AR) - HTML</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} className="min-h-[240px] font-mono text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contentEn"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Content (EN) - HTML</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} className="min-h-[240px] font-mono text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Published</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

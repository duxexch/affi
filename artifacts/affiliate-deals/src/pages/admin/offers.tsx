import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { 
  useListOffers, 
  useCreateOffer, 
  useUpdateOffer, 
  useDeleteOffer,
  useListCategories,
  useListBrands,
  getListOffersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Offer } from "@workspace/api-client-react";
import { uploadMediaFile } from "@/lib/upload";

const offerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  discountPercent: z.coerce.number().optional(),
  originalPrice: z.coerce.number().optional(),
  currentPrice: z.coerce.number().optional(),
  currency: z.string().default("$"),
  // upload endpoint returns relative url like "/uploads/..."
  imageUrl: z.string().optional().or(z.literal("")),
  affiliateUrl: z.string().url("Must be a valid URL").min(1, "Affiliate URL is required"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  categoryId: z.coerce.number().optional(),
  brandId: z.coerce.number().optional(),
});

type OfferFormValues = z.infer<typeof offerSchema>;

export default function AdminOffers() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data, isLoading } = useListOffers({ page, limit: 20 });
  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const deleteMutation = useDeleteOffer();

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      description: "",
      discountPercent: undefined,
      originalPrice: undefined,
      currentPrice: undefined,
      currency: "$",
      imageUrl: "",
      affiliateUrl: "",
      isActive: true,
      isFeatured: false,
      categoryId: undefined,
      brandId: undefined,
    }
  });

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const imageUrlValue = form.watch("imageUrl");

  const handleUploadMedia = async (file: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploaded = await uploadMediaFile(file);
      form.setValue("imageUrl", uploaded.url, { shouldDirty: true });
      toast({
        title: "Upload success",
        description: uploaded.url,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingOffer(null);
    form.reset({
      title: "",
      slug: "",
      shortDescription: "",
      description: "",
      discountPercent: undefined,
      originalPrice: undefined,
      currentPrice: undefined,
      currency: "$",
      imageUrl: "",
      affiliateUrl: "",
      isActive: true,
      isFeatured: false,
      categoryId: undefined,
      brandId: undefined,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (offer: Offer) => {
    setEditingOffer(offer);
    form.reset({
      title: offer.title,
      slug: offer.slug,
      shortDescription: offer.shortDescription || "",
      description: (offer as any).description || "",
      discountPercent: offer.discountPercent || undefined,
      originalPrice: offer.originalPrice || undefined,
      currentPrice: offer.currentPrice || undefined,
      currency: offer.currency || "$",
      imageUrl: offer.imageUrl || "",
      affiliateUrl: offer.affiliateUrl,
      isActive: offer.isActive,
      isFeatured: offer.isFeatured,
      categoryId: offer.categoryId || undefined,
      brandId: offer.brandId || undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Offer deleted successfully" });
          queryClient.invalidateQueries({ queryKey: getListOffersQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to delete offer", variant: "destructive" });
        }
      });
    }
  };

  const onSubmit = (values: OfferFormValues) => {
    const data = {
      ...values,
      categoryId: values.categoryId || undefined,
      brandId: values.brandId || undefined,
    };
    
    if (editingOffer) {
      updateMutation.mutate({ id: editingOffer.id, data }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Offer updated successfully" });
          setIsDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListOffersQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to update offer", variant: "destructive" });
        }
      });
    } else {
      createMutation.mutate({ data: data as any }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Offer created successfully" });
          setIsDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListOffersQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to create offer", variant: "destructive" });
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offers</h1>
          <p className="text-muted-foreground mt-1">Manage your deal catalog.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" /> Add Offer</Button>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOffer ? 'Edit Offer' : 'Create Offer'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              if (!editingOffer && !form.formState.dirtyFields.slug) {
                                form.setValue('slug', generateSlug(e.target.value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="currentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="originalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount %</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="affiliateUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affiliate URL</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image (upload from device)</FormLabel>

                      <FormControl>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => handleUploadMedia(e.currentTarget.files?.[0] ?? null)}
                              disabled={uploadingImage}
                            />
                            {uploadingImage && <span className="text-sm text-muted-foreground">Uploading...</span>}
                          </div>

                          {imageUrlValue ? (
                            <div className="flex flex-col gap-2">
                              {/* Offer UI uses <img>, so image works; if video uploaded, at least URL still stored */}
                              <img
                                src={imageUrlValue}
                                alt="Preview"
                                className="w-full max-w-[180px] rounded border bg-muted"
                              />
                              <Input {...field} value={field.value ?? ""} disabled className="opacity-70" />
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No file selected yet.</div>
                          )}
                        </div>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(val ? Number(val) : undefined)} 
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(val ? Number(val) : undefined)} 
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brands?.map((brand) => (
                              <SelectItem key={brand.id} value={String(brand.id)}>{brand.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-8">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingOffer ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{offer.title}</TableCell>
                  <TableCell>{offer.categoryName || '-'}</TableCell>
                  <TableCell>{offer.brandName || '-'}</TableCell>
                  <TableCell>{offer.currentPrice ? `${offer.currency}${offer.currentPrice}` : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {offer.isActive ? (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">Active</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10">Inactive</span>
                      )}
                      {offer.isFeatured && (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">Featured</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(offer)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(offer.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No offers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {data && data.total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} items
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total}>
              Next
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

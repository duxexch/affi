import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { 
  useListBrands, 
  useCreateBrand, 
  useUpdateBrand, 
  useDeleteBrand,
  getListBrandsQueryKey
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Brand } from "@workspace/api-client-react";
import { uploadMediaFile } from "@/lib/upload";

const brandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  // Accept absolute URLs OR our local upload urls: "/uploads/..."
  logoUrl: z.string().optional().or(z.literal("")),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export default function AdminBrands() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const { data: brands, isLoading } = useListBrands();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logoUrl: "",
      websiteUrl: "",
      isActive: true,
    }
  });

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const logoUrlValue = form.watch("logoUrl");

  const handleUploadLogo = async (file: File | null) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const uploaded = await uploadMediaFile(file);
      form.setValue("logoUrl", uploaded.url, { shouldDirty: true });
      toast({
        title: "Upload success",
        description: uploaded.url,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBrand(null);
    form.reset({
      name: "",
      slug: "",
      description: "",
      logoUrl: "",
      websiteUrl: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    form.reset({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      logoUrl: brand.logoUrl || "",
      websiteUrl: brand.websiteUrl || "",
      isActive: brand.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this brand?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Brand deleted successfully" });
          queryClient.invalidateQueries({ queryKey: getListBrandsQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to delete brand", variant: "destructive" });
        }
      });
    }
  };

  const onSubmit = (values: BrandFormValues) => {
    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, data: values }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Brand updated successfully" });
          setIsDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListBrandsQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to update brand", variant: "destructive" });
        }
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Brand created successfully" });
          setIsDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListBrandsQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to create brand", variant: "destructive" });
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground mt-1">Manage partner brands.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" /> Add Brand</Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBrand ? 'Edit Brand' : 'Create Brand'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              if (!editingBrand && !form.formState.dirtyFields.slug) {
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo (upload from device)</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => handleUploadLogo(e.currentTarget.files?.[0] ?? null)}
                              disabled={uploadingLogo}
                            />
                            {uploadingLogo && <span className="text-sm text-muted-foreground">Uploading...</span>}
                          </div>

                          {logoUrlValue ? (
                            <div className="flex flex-col gap-2">
                              <img
                                src={logoUrlValue}
                                alt="Logo preview"
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

                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingBrand ? 'Update' : 'Create'}
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
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Offers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : brands && brands.length > 0 ? (
              brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>{brand.slug}</TableCell>
                  <TableCell>{brand.offerCount || 0}</TableCell>
                  <TableCell>
                    {brand.isActive ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(brand)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(brand.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No brands found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}

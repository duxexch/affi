export type UploadResponse = {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
};

export async function uploadMediaFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/admin/uploads", {
    method: "POST",
    body: formData,
    // ensure cookies (access_token) are sent for requireAdmin
    credentials: "include",
  });

  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const data: unknown = await res.json();
      if (data && typeof data === "object" && "error" in data && typeof (data as any).error === "string") {
        message = (data as any).error;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const data = (await res.json()) as UploadResponse;
  return data;
}

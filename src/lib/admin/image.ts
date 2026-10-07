"use client";

/** Reads an image file and returns a resized JPEG data URL (max 1000 px): vista previa y, en la demo, almacenamiento. */
export function fileToDataUrl(file: File, max = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

export interface UploadedImage {
  path: string;
  width: number;
  height: number;
}

/** Sube la imagen al servidor (/api/admin/media): se procesa con sharp y se guarda como WebP en /uploads/. */
export async function uploadImage(file: File, alt?: string): Promise<UploadedImage> {
  const form = new FormData();
  form.append("file", file);
  if (alt) form.append("alt", alt);
  const res = await fetch("/api/admin/media", { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; path?: string; width?: number; height?: number };
  if (!res.ok || !json.ok || !json.path) throw new Error(json.error ?? "No se pudo subir la imagen");
  return { path: json.path, width: json.width ?? 0, height: json.height ?? 0 };
}

/** En el VPS sube al servidor; en la demo estática devuelve un data: URL para localStorage. */
export async function pickImage(file: File, mode: "db" | "demo", alt?: string): Promise<string> {
  return mode === "db" ? (await uploadImage(file, alt)).path : fileToDataUrl(file);
}

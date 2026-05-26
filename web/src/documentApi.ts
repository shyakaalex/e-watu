import { authFetch, parseJson, serviceUrl } from './lib/http';

export type PresignResult = {
  uploadUrl: string;
  objectUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  key: string;
  bucket: string;
  expiresInSeconds: number;
};

export async function presignUpload(body: {
  objectKey: string;
  contentType: string;
  fileSize: number;
}): Promise<PresignResult> {
  const r = await authFetch(`${serviceUrl('document')}/api/v1/document/presign`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return parseJson<PresignResult>(r);
}

export async function uploadViaPresign(
  file: File,
  objectKey: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const presign = await presignUpload({
    objectKey,
    contentType: file.type,
    fileSize: file.size,
  });
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(presign.method, presign.uploadUrl);
    Object.entries(presign.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
  return presign.objectUrl;
}

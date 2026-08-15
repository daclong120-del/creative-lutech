import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Thực hiện chuyển hướng tự động sang trang KV khi truy cập route gốc /dash/storage
export default async function StoragePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const section = resolvedParams.section ? `?section=${resolvedParams.section}` : "";
  redirect(`/dash/storage/kv${section}`);
}

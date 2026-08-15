"use server";
/**
 * Server Actions — Data (Posts, Authors, Comments)
 * Wrapper cho data.service, bảo vệ bằng auth guard.
 */
import { requireUser, requireAdmin } from "@/lib/supabase/auth-helper";
import {
  getPosts as getPostsService,
  getAuthors as getAuthorsService,
  getComments as getCommentsService,
  getTags as getTagsService,
  deletePost as deletePostService,
  deletePosts as deletePostsService,
} from "@/lib/services/data.service";

export async function getPosts(...args: Parameters<typeof getPostsService>) {
  await requireUser();
  return getPostsService(...args);
}

export async function getAuthors(...args: Parameters<typeof getAuthorsService>) {
  await requireUser();
  return getAuthorsService(...args);
}

export async function getComments(...args: Parameters<typeof getCommentsService>) {
  await requireUser();
  return getCommentsService(...args);
}

export async function getTags(...args: Parameters<typeof getTagsService>) {
  await requireUser();
  return getTagsService(...args);
}

export async function deletePost(id: string) {
  await requireAdmin();
  return deletePostService(id);
}

export async function deletePosts(ids: string[]) {
  await requireAdmin();
  return deletePostsService(ids);
}

"use server";
/**
 * Server Actions — Creative Hub
 * Wrapper cho creative.service, bảo vệ bằng auth guard.
 */
import { requireUser } from "@/lib/supabase/auth-helper";
import {
  searchAds as searchAdsService,
  getAdById as getAdByIdService,
  getAdvertisers as getAdvertisersService,
  getAdvertiserById as getAdvertiserByIdService,
  getTrending as getTrendingService,
  getNew as getNewService,
  getGrowth as getGrowthService,
  getSimilar as getSimilarService,
} from "@/lib/services/creative.service";

export async function searchAds(...args: Parameters<typeof searchAdsService>) {
  await requireUser();
  return searchAdsService(...args);
}

export async function getAdById(...args: Parameters<typeof getAdByIdService>) {
  await requireUser();
  return getAdByIdService(...args);
}

export async function getAdvertisers(...args: Parameters<typeof getAdvertisersService>) {
  await requireUser();
  return getAdvertisersService(...args);
}

export async function getAdvertiserById(...args: Parameters<typeof getAdvertiserByIdService>) {
  await requireUser();
  return getAdvertiserByIdService(...args);
}

export async function getTrending(...args: Parameters<typeof getTrendingService>) {
  await requireUser();
  return getTrendingService(...args);
}

export async function getNew(...args: Parameters<typeof getNewService>) {
  await requireUser();
  return getNewService(...args);
}

export async function getGrowth(...args: Parameters<typeof getGrowthService>) {
  await requireUser();
  return getGrowthService(...args);
}

export async function getSimilar(...args: Parameters<typeof getSimilarService>) {
  await requireUser();
  return getSimilarService(...args);
}

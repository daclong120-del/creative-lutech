/**
 * # Enums và types đặc thù Kuaishou (快手)
 */

export enum KuaishouSearchSortType {
  DEFAULT = 0,
  NEWEST = 1,
  MOST_PLAYED = 2,
}

export interface KuaishouVideoInfo {
  photoId: string;
}

export interface KuaishouCreatorInfo {
  userId: string;
}

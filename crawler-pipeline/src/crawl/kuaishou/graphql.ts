/**
 * # Kuaishou GraphQL Queries
 */

export const GRAPHQL_QUERIES = {
  search_query: `fragment photoContent on PhotoEntity {
  __typename
  id
  duration
  caption
  originCaption
  likeCount
  viewCount
  commentCount
  realLikeCount
  coverUrl
  photoUrl
  photoH265Url
  manifest
  manifestH265
  videoResource
  coverUrls {
    url
    __typename
  }
  timestamp
  expTag
  animatedCoverUrl
  distance
  videoRatio
  liked
  stereoType
  profileUserTopPhoto
  musicBlocked
}

fragment recoPhotoFragment on recoPhotoEntity {
  __typename
  id
  duration
  caption
  originCaption
  likeCount
  viewCount
  commentCount
  realLikeCount
  coverUrl
  photoUrl
  photoH265Url
  manifest
  manifestH265
  videoResource
  coverUrls {
    url
    __typename
  }
  timestamp
  expTag
  animatedCoverUrl
  distance
  videoRatio
  liked
  stereoType
  profileUserTopPhoto
  musicBlocked
}

fragment feedContent on Feed {
  type
  author {
    id
    name
    headerUrl
    following
    headerUrls {
      url
      __typename
    }
    __typename
  }
  photo {
    ...photoContent
    ...recoPhotoFragment
    __typename
  }
  canAddComment
  llsid
  status
  currentPcursor
  tags {
    type
    name
    __typename
  }
  __typename
}

query visionSearchPhoto($keyword: String, $pcursor: String, $searchSessionId: String, $page: String, $webPageArea: String) {
  visionSearchPhoto(keyword: $keyword, pcursor: $pcursor, searchSessionId: $searchSessionId, page: $page, webPageArea: $webPageArea) {
    result
    llsid
    webPageArea
    feeds {
      ...feedContent
      __typename
    }
    searchSessionId
    pcursor
    aladdinBanner {
      imgUrl
      link
      __typename
    }
    __typename
  }
}`,

  video_detail: `query visionVideoDetail($photoId: String, $type: String, $page: String, $webPageArea: String) {
  visionVideoDetail(photoId: $photoId, type: $type, page: $page, webPageArea: $webPageArea) {
    status
    type
    author {
      id
      name
      following
      headerUrl
      __typename
    }
    photo {
      id
      duration
      caption
      likeCount
      realLikeCount
      coverUrl
      photoUrl
      liked
      timestamp
      expTag
      llsid
      viewCount
      videoRatio
      stereoType
      musicBlocked
      manifest {
        mediaType
        businessType
        version
        adaptationSet {
          id
          duration
          representation {
            id
            defaultSelect
            backupUrl
            codecs
            url
            height
            width
            avgBitrate
            maxBitrate
            m3u8Slice
            qualityType
            qualityLabel
            frameRate
            featureP2sp
            hidden
            disableAdaptive
            __typename
          }
          __typename
        }
        __typename
      }
      manifestH265
      photoH265Url
      coronaCropManifest
      coronaCropManifestH265
      croppedPhotoH265Url
      croppedPhotoUrl
      videoResource
      __typename
    }
    tags {
      type
      name
      __typename
    }
    commentLimit {
      canAddComment
      __typename
    }
    llsid
    danmakuSwitch
    __typename
  }
}`,

  comment_list: `query commentListQuery($photoId: String, $pcursor: String) {
  visionCommentList(photoId: $photoId, pcursor: $pcursor) {
    commentCount
    pcursor
    rootComments {
      commentId
      authorId
      authorName
      content
      headurl
      timestamp
      likedCount
      realLikedCount
      liked
      status
      authorLiked
      subCommentCount
      subCommentsPcursor
      subComments {
        commentId
        authorId
        authorName
        content
        headurl
        timestamp
        likedCount
        realLikedCount
        liked
        status
        authorLiked
        replyToUserName
        replyTo
        __typename
      }
      __typename
    }
    __typename
  }
}`,

  vision_profile: `query visionProfile($userId: String) {
  visionProfile(userId: $userId) {
    result
    hostName
    userProfile {
      ownerCount {
        fan
        photo
        follow
        photo_public
        __typename
      }
      profile {
        gender
        user_name
        user_id
        headurl
        user_text
        user_profile_bg_url
        __typename
      }
      isFollowing
      __typename
    }
    __typename
  }
}`,

  vision_profile_photo_list: `fragment photoContent on PhotoEntity {
  __typename
  id
  duration
  caption
  originCaption
  likeCount
  viewCount
  commentCount
  realLikeCount
  coverUrl
  photoUrl
  photoH265Url
  manifest
  manifestH265
  videoResource
  coverUrls {
    url
    __typename
  }
  timestamp
  expTag
  animatedCoverUrl
  distance
  videoRatio
  liked
  stereoType
  profileUserTopPhoto
  musicBlocked
  riskTagContent
  riskTagUrl
}

fragment recoPhotoFragment on recoPhotoEntity {
  __typename
  id
  duration
  caption
  originCaption
  likeCount
  viewCount
  commentCount
  realLikeCount
  coverUrl
  photoUrl
  photoH265Url
  manifest
  manifestH265
  videoResource
  coverUrls {
    url
    __typename
  }
  timestamp
  expTag
  animatedCoverUrl
  distance
  videoRatio
  liked
  stereoType
  profileUserTopPhoto
  musicBlocked
  riskTagContent
  riskTagUrl
}

fragment feedContent on Feed {
  type
  author {
    id
    name
    headerUrl
    following
    headerUrls {
      url
      __typename
    }
    __typename
  }
  photo {
    ...photoContent
    ...recoPhotoFragment
    __typename
  }
  canAddComment
  llsid
  status
  currentPcursor
  tags {
    type
    name
    __typename
  }
  __typename
}

query visionProfilePhotoList($pcursor: String, $userId: String, $page: String, $webPageArea: String) {
  visionProfilePhotoList(pcursor: $pcursor, userId: $userId, page: $page, webPageArea: $webPageArea) {
    result
    llsid
    webPageArea
    feeds {
      ...feedContent
      __typename
    }
    hostName
    pcursor
    __typename
  }
}`,

  vision_profile_user_list: `query visionProfileUserList($pcursor: String, $ftype: Int) {
  visionProfileUserList(pcursor: $pcursor, ftype: $ftype) {
    result
    fols {
      user_name
      headurl
      user_text
      isFollowing
      user_id
      __typename
    }
    hostName
    pcursor
    __typename
  }
}`,

  vision_sub_comment_list: `mutation visionSubCommentList($photoId: String, $rootCommentId: String, $pcursor: String) {
  visionSubCommentList(photoId: $photoId, rootCommentId: $rootCommentId, pcursor: $pcursor) {
    pcursor
    subComments {
      commentId
      authorId
      authorName
      content
      headurl
      timestamp
      likedCount
      realLikedCount
      liked
      status
      authorLiked
      replyToUserName
      replyTo
      __typename
    }
    __typename
  }
}`
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
          revoke_reason: string | null
          role_id: string | null
          scopes: string[]
          status: string
          token_hash: string
          token_prefix: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          revoke_reason?: string | null
          role_id?: string | null
          scopes?: string[]
          status?: string
          token_hash: string
          token_prefix: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          revoke_reason?: string | null
          role_id?: string | null
          scopes?: string[]
          status?: string
          token_hash?: string
          token_prefix?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_tokens_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "team_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          payload: Json
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          payload?: Json
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          payload?: Json
        }
        Relationships: []
      }
      author_metric_snapshots: {
        Row: {
          author_id: string
          fans_count: number
          follows_count: number
          id: string
          interaction_count: number
          observed_at: string
          platform: string
          platform_author_id: string
          raw: Json | null
          source: string | null
          videos_count: number
        }
        Insert: {
          author_id: string
          fans_count?: number
          follows_count?: number
          id?: string
          interaction_count?: number
          observed_at?: string
          platform: string
          platform_author_id: string
          raw?: Json | null
          source?: string | null
          videos_count?: number
        }
        Update: {
          author_id?: string
          fans_count?: number
          follows_count?: number
          id?: string
          interaction_count?: number
          observed_at?: string
          platform?: string
          platform_author_id?: string
          raw?: Json | null
          source?: string | null
          videos_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "author_metric_snapshots_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "crawled_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      bilibili_contact_info: {
        Row: {
          add_ts: number | null
          fan_avatar: string | null
          fan_id: number | null
          fan_name: string | null
          fan_sign: string | null
          id: number
          last_modify_ts: number | null
          up_avatar: string | null
          up_id: number | null
          up_name: string | null
          up_sign: string | null
        }
        Insert: {
          add_ts?: number | null
          fan_avatar?: string | null
          fan_id?: number | null
          fan_name?: string | null
          fan_sign?: string | null
          id?: number
          last_modify_ts?: number | null
          up_avatar?: string | null
          up_id?: number | null
          up_name?: string | null
          up_sign?: string | null
        }
        Update: {
          add_ts?: number | null
          fan_avatar?: string | null
          fan_id?: number | null
          fan_name?: string | null
          fan_sign?: string | null
          id?: number
          last_modify_ts?: number | null
          up_avatar?: string | null
          up_id?: number | null
          up_name?: string | null
          up_sign?: string | null
        }
        Relationships: []
      }
      bilibili_up_dynamic: {
        Row: {
          add_ts: number | null
          dynamic_id: number | null
          id: number
          last_modify_ts: number | null
          pub_ts: number | null
          text: string | null
          total_comments: number | null
          total_forwards: number | null
          total_liked: number | null
          type: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          add_ts?: number | null
          dynamic_id?: number | null
          id?: number
          last_modify_ts?: number | null
          pub_ts?: number | null
          text?: string | null
          total_comments?: number | null
          total_forwards?: number | null
          total_liked?: number | null
          type?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          add_ts?: number | null
          dynamic_id?: number | null
          id?: number
          last_modify_ts?: number | null
          pub_ts?: number | null
          text?: string | null
          total_comments?: number | null
          total_forwards?: number | null
          total_liked?: number | null
          type?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      bilibili_up_info: {
        Row: {
          add_ts: number | null
          avatar: string | null
          id: number
          is_official: number | null
          last_modify_ts: number | null
          nickname: string | null
          sex: string | null
          sign: string | null
          total_fans: number | null
          total_liked: number | null
          user_id: number | null
          user_rank: number | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          id?: number
          is_official?: number | null
          last_modify_ts?: number | null
          nickname?: string | null
          sex?: string | null
          sign?: string | null
          total_fans?: number | null
          total_liked?: number | null
          user_id?: number | null
          user_rank?: number | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          id?: number
          is_official?: number | null
          last_modify_ts?: number | null
          nickname?: string | null
          sex?: string | null
          sign?: string | null
          total_fans?: number | null
          total_liked?: number | null
          user_id?: number | null
          user_rank?: number | null
        }
        Relationships: []
      }
      bilibili_video: {
        Row: {
          add_ts: number | null
          avatar: string | null
          create_time: number | null
          desc: string | null
          disliked_count: string | null
          id: number
          last_modify_ts: number | null
          liked_count: number | null
          nickname: string | null
          source_keyword: string | null
          title: string | null
          user_id: number | null
          video_coin_count: string | null
          video_comment: string | null
          video_cover_url: string | null
          video_danmaku: string | null
          video_favorite_count: string | null
          video_id: number
          video_play_count: string | null
          video_share_count: string | null
          video_type: string | null
          video_url: string
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          create_time?: number | null
          desc?: string | null
          disliked_count?: string | null
          id?: number
          last_modify_ts?: number | null
          liked_count?: number | null
          nickname?: string | null
          source_keyword?: string | null
          title?: string | null
          user_id?: number | null
          video_coin_count?: string | null
          video_comment?: string | null
          video_cover_url?: string | null
          video_danmaku?: string | null
          video_favorite_count?: string | null
          video_id: number
          video_play_count?: string | null
          video_share_count?: string | null
          video_type?: string | null
          video_url: string
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          create_time?: number | null
          desc?: string | null
          disliked_count?: string | null
          id?: number
          last_modify_ts?: number | null
          liked_count?: number | null
          nickname?: string | null
          source_keyword?: string | null
          title?: string | null
          user_id?: number | null
          video_coin_count?: string | null
          video_comment?: string | null
          video_cover_url?: string | null
          video_danmaku?: string | null
          video_favorite_count?: string | null
          video_id?: number
          video_play_count?: string | null
          video_share_count?: string | null
          video_type?: string | null
          video_url?: string
        }
        Relationships: []
      }
      bilibili_video_comment: {
        Row: {
          add_ts: number | null
          avatar: string | null
          comment_id: number | null
          content: string | null
          create_time: number | null
          id: number
          last_modify_ts: number | null
          like_count: string | null
          nickname: string | null
          parent_comment_id: string | null
          sex: string | null
          sign: string | null
          sub_comment_count: string | null
          user_id: string | null
          video_id: number | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          comment_id?: number | null
          content?: string | null
          create_time?: number | null
          id?: number
          last_modify_ts?: number | null
          like_count?: string | null
          nickname?: string | null
          parent_comment_id?: string | null
          sex?: string | null
          sign?: string | null
          sub_comment_count?: string | null
          user_id?: string | null
          video_id?: number | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          comment_id?: number | null
          content?: string | null
          create_time?: number | null
          id?: number
          last_modify_ts?: number | null
          like_count?: string | null
          nickname?: string | null
          parent_comment_id?: string | null
          sex?: string | null
          sign?: string | null
          sub_comment_count?: string | null
          user_id?: string | null
          video_id?: number | null
        }
        Relationships: []
      }
      crawled_authors: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          fans_count: number | null
          follows_count: number | null
          gender: string | null
          id: string
          interaction_count: number | null
          ip_location: string | null
          nickname: string | null
          platform: string
          platform_uid: string | null
          raw: Json | null
          updated_at: string
          videos_count: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          fans_count?: number | null
          follows_count?: number | null
          gender?: string | null
          id: string
          interaction_count?: number | null
          ip_location?: string | null
          nickname?: string | null
          platform: string
          platform_uid?: string | null
          raw?: Json | null
          updated_at?: string
          videos_count?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          fans_count?: number | null
          follows_count?: number | null
          gender?: string | null
          id?: string
          interaction_count?: number | null
          ip_location?: string | null
          nickname?: string | null
          platform?: string
          platform_uid?: string | null
          raw?: Json | null
          updated_at?: string
          videos_count?: number | null
        }
        Relationships: []
      }
      crawled_comments: {
        Row: {
          author_nickname: string | null
          author_uid: string | null
          content: string | null
          crawled_at: string
          id: string
          like_count: number | null
          parent_cid: string | null
          platform: string
          platform_cid: string
          platform_post_id: string
          post_id: string | null
          published_at: string | null
          raw: Json | null
        }
        Insert: {
          author_nickname?: string | null
          author_uid?: string | null
          content?: string | null
          crawled_at?: string
          id?: string
          like_count?: number | null
          parent_cid?: string | null
          platform: string
          platform_cid: string
          platform_post_id: string
          post_id?: string | null
          published_at?: string | null
          raw?: Json | null
        }
        Update: {
          author_nickname?: string | null
          author_uid?: string | null
          content?: string | null
          crawled_at?: string
          id?: string
          like_count?: number | null
          parent_cid?: string | null
          platform?: string
          platform_cid?: string
          platform_post_id?: string
          post_id?: string | null
          published_at?: string | null
          raw?: Json | null
        }
        Relationships: []
      }
      crawled_posts: {
        Row: {
          author_id: string | null
          caption: string | null
          content_type: string | null
          cover_url: string | null
          crawled_at: string
          id: string
          language: string | null
          media_cached_at: string | null
          media_error: string | null
          media_source: string | null
          media_status: string | null
          media_type: string | null
          media_urls: string[] | null
          original_cover_url: string | null
          original_media_urls: string[] | null
          platform: string
          platform_id: string | null
          published_at: string | null
          raw: Json | null
          source_url: string | null
          stats: Json | null
          tags: string[]
          title: string | null
        }
        Insert: {
          author_id?: string | null
          caption?: string | null
          content_type?: string | null
          cover_url?: string | null
          crawled_at?: string
          id: string
          language?: string | null
          media_cached_at?: string | null
          media_error?: string | null
          media_source?: string | null
          media_status?: string | null
          media_type?: string | null
          media_urls?: string[] | null
          original_cover_url?: string | null
          original_media_urls?: string[] | null
          platform: string
          platform_id?: string | null
          published_at?: string | null
          raw?: Json | null
          source_url?: string | null
          stats?: Json | null
          tags?: string[]
          title?: string | null
        }
        Update: {
          author_id?: string | null
          caption?: string | null
          content_type?: string | null
          cover_url?: string | null
          crawled_at?: string
          id?: string
          language?: string | null
          media_cached_at?: string | null
          media_error?: string | null
          media_source?: string | null
          media_status?: string | null
          media_type?: string | null
          media_urls?: string[] | null
          original_cover_url?: string | null
          original_media_urls?: string[] | null
          platform?: string
          platform_id?: string | null
          published_at?: string | null
          raw?: Json | null
          source_url?: string | null
          stats?: Json | null
          tags?: string[]
          title?: string | null
        }
        Relationships: []
      }
      crawler_accounts: {
        Row: {
          cookie_data: string
          created_at: string | null
          failure_count: number | null
          id: string
          last_used_at: string | null
          platform: string
          status: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          cookie_data: string
          created_at?: string | null
          failure_count?: number | null
          id?: string
          last_used_at?: string | null
          platform: string
          status?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          cookie_data?: string
          created_at?: string | null
          failure_count?: number | null
          id?: string
          last_used_at?: string | null
          platform?: string
          status?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      crawler_logs: {
        Row: {
          created_at: string
          id: number
          level: string
          message: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          level: string
          message: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: number
          level?: string
          message?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawler_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crawler_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      crawler_proxies: {
        Row: {
          assigned_account_id: string | null
          created_at: string
          host: string
          id: string
          last_used_at: string | null
          password: string | null
          port: number
          protocol: string
          status: string
          username: string | null
        }
        Insert: {
          assigned_account_id?: string | null
          created_at?: string
          host: string
          id?: string
          last_used_at?: string | null
          password?: string | null
          port: number
          protocol?: string
          status?: string
          username?: string | null
        }
        Update: {
          assigned_account_id?: string | null
          created_at?: string
          host?: string
          id?: string
          last_used_at?: string | null
          password?: string | null
          port?: number
          protocol?: string
          status?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crawler_proxies_assigned_account_id_fkey"
            columns: ["assigned_account_id"]
            isOneToOne: false
            referencedRelation: "crawler_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      crawler_tasks: {
        Row: {
          command: string
          created_at: string
          error_message: string | null
          id: string
          max_count: number | null
          metadata: Json
          platform: string
          priority: string | null
          scheduled_at: string | null
          status: string
          target: string
          updated_at: string
        }
        Insert: {
          command: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_count?: number | null
          metadata?: Json
          platform: string
          priority?: string | null
          scheduled_at?: string | null
          status?: string
          target: string
          updated_at?: string
        }
        Update: {
          command?: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_count?: number | null
          metadata?: Json
          platform?: string
          priority?: string | null
          scheduled_at?: string | null
          status?: string
          target?: string
          updated_at?: string
        }
        Relationships: []
      }
      creative_ads: {
        Row: {
          author_id: string | null
          caption: string | null
          comment_count: number
          cover_url: string | null
          crawled_at: string
          growth_rate: number
          id: string
          is_ad: boolean
          like_count: number
          media_type: string
          media_urls: string[] | null
          platform: string
          platform_uid: string
          published_at: string
          share_count: number
          tags: string[] | null
          title: string | null
          view_count: number
          views_history: Json
        }
        Insert: {
          author_id?: string | null
          caption?: string | null
          comment_count?: number
          cover_url?: string | null
          crawled_at?: string
          growth_rate?: number
          id?: string
          is_ad?: boolean
          like_count?: number
          media_type?: string
          media_urls?: string[] | null
          platform: string
          platform_uid: string
          published_at: string
          share_count?: number
          tags?: string[] | null
          title?: string | null
          view_count?: number
          views_history?: Json
        }
        Update: {
          author_id?: string | null
          caption?: string | null
          comment_count?: number
          cover_url?: string | null
          crawled_at?: string
          growth_rate?: number
          id?: string
          is_ad?: boolean
          like_count?: number
          media_type?: string
          media_urls?: string[] | null
          platform?: string
          platform_uid?: string
          published_at?: string
          share_count?: number
          tags?: string[] | null
          title?: string | null
          view_count?: number
          views_history?: Json
        }
        Relationships: [
          {
            foreignKeyName: "creative_ads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "creative_advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_advertisers: {
        Row: {
          avatar_url: string | null
          crawled_at: string
          creative_count: number
          description: string | null
          fans_count: number
          follows_count: number
          id: string
          last_active_at: string
          nickname: string
          platform: string
          platform_uid: string
          total_likes: number
          total_views: number
        }
        Insert: {
          avatar_url?: string | null
          crawled_at?: string
          creative_count?: number
          description?: string | null
          fans_count?: number
          follows_count?: number
          id?: string
          last_active_at?: string
          nickname: string
          platform: string
          platform_uid: string
          total_likes?: number
          total_views?: number
        }
        Update: {
          avatar_url?: string | null
          crawled_at?: string
          creative_count?: number
          description?: string | null
          fans_count?: number
          follows_count?: number
          id?: string
          last_active_at?: string
          nickname?: string
          platform?: string
          platform_uid?: string
          total_likes?: number
          total_views?: number
        }
        Relationships: []
      }
      douyin_aweme: {
        Row: {
          add_ts: number | null
          avatar: string | null
          aweme_id: number | null
          aweme_type: string | null
          aweme_url: string | null
          collected_count: string | null
          comment_count: string | null
          cover_url: string | null
          create_time: number | null
          desc: string | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          liked_count: string | null
          music_download_url: string | null
          nickname: string | null
          note_download_url: string | null
          sec_uid: string | null
          share_count: string | null
          short_user_id: string | null
          source_keyword: string | null
          title: string | null
          user_id: string | null
          user_signature: string | null
          user_unique_id: string | null
          video_download_url: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          aweme_id?: number | null
          aweme_type?: string | null
          aweme_url?: string | null
          collected_count?: string | null
          comment_count?: string | null
          cover_url?: string | null
          create_time?: number | null
          desc?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          liked_count?: string | null
          music_download_url?: string | null
          nickname?: string | null
          note_download_url?: string | null
          sec_uid?: string | null
          share_count?: string | null
          short_user_id?: string | null
          source_keyword?: string | null
          title?: string | null
          user_id?: string | null
          user_signature?: string | null
          user_unique_id?: string | null
          video_download_url?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          aweme_id?: number | null
          aweme_type?: string | null
          aweme_url?: string | null
          collected_count?: string | null
          comment_count?: string | null
          cover_url?: string | null
          create_time?: number | null
          desc?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          liked_count?: string | null
          music_download_url?: string | null
          nickname?: string | null
          note_download_url?: string | null
          sec_uid?: string | null
          share_count?: string | null
          short_user_id?: string | null
          source_keyword?: string | null
          title?: string | null
          user_id?: string | null
          user_signature?: string | null
          user_unique_id?: string | null
          video_download_url?: string | null
        }
        Relationships: []
      }
      douyin_aweme_comment: {
        Row: {
          add_ts: number | null
          avatar: string | null
          aweme_id: number | null
          comment_id: number | null
          content: string | null
          create_time: number | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          like_count: string | null
          nickname: string | null
          parent_comment_id: string | null
          pictures: string | null
          sec_uid: string | null
          short_user_id: string | null
          sub_comment_count: string | null
          user_id: string | null
          user_signature: string | null
          user_unique_id: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          aweme_id?: number | null
          comment_id?: number | null
          content?: string | null
          create_time?: number | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          like_count?: string | null
          nickname?: string | null
          parent_comment_id?: string | null
          pictures?: string | null
          sec_uid?: string | null
          short_user_id?: string | null
          sub_comment_count?: string | null
          user_id?: string | null
          user_signature?: string | null
          user_unique_id?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          aweme_id?: number | null
          comment_id?: number | null
          content?: string | null
          create_time?: number | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          like_count?: string | null
          nickname?: string | null
          parent_comment_id?: string | null
          pictures?: string | null
          sec_uid?: string | null
          short_user_id?: string | null
          sub_comment_count?: string | null
          user_id?: string | null
          user_signature?: string | null
          user_unique_id?: string | null
        }
        Relationships: []
      }
      dy_creator: {
        Row: {
          add_ts: number | null
          avatar: string | null
          desc: string | null
          fans: string | null
          follows: string | null
          gender: string | null
          id: number
          interaction: string | null
          ip_location: string | null
          last_modify_ts: number | null
          nickname: string | null
          user_id: string | null
          videos_count: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          desc?: string | null
          fans?: string | null
          follows?: string | null
          gender?: string | null
          id?: number
          interaction?: string | null
          ip_location?: string | null
          last_modify_ts?: number | null
          nickname?: string | null
          user_id?: string | null
          videos_count?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          desc?: string | null
          fans?: string | null
          follows?: string | null
          gender?: string | null
          id?: number
          interaction?: string | null
          ip_location?: string | null
          last_modify_ts?: number | null
          nickname?: string | null
          user_id?: string | null
          videos_count?: string | null
        }
        Relationships: []
      }
      exported_files: {
        Row: {
          created_at: string
          created_by: string
          download_url: string
          filename: string
          filter_snapshot: Json
          id: string
          size_bytes: number
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          download_url: string
          filename: string
          filter_snapshot?: Json
          id?: string
          size_bytes?: number
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          download_url?: string
          filename?: string
          filter_snapshot?: Json
          id?: string
          size_bytes?: number
          type?: string
        }
        Relationships: []
      }
      kuaishou_video: {
        Row: {
          add_ts: number | null
          avatar: string | null
          create_time: number | null
          desc: string | null
          id: number
          last_modify_ts: number | null
          liked_count: string | null
          nickname: string | null
          source_keyword: string | null
          title: string | null
          user_id: string | null
          video_cover_url: string | null
          video_id: string | null
          video_play_url: string | null
          video_type: string | null
          video_url: string | null
          viewd_count: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          create_time?: number | null
          desc?: string | null
          id?: number
          last_modify_ts?: number | null
          liked_count?: string | null
          nickname?: string | null
          source_keyword?: string | null
          title?: string | null
          user_id?: string | null
          video_cover_url?: string | null
          video_id?: string | null
          video_play_url?: string | null
          video_type?: string | null
          video_url?: string | null
          viewd_count?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          create_time?: number | null
          desc?: string | null
          id?: number
          last_modify_ts?: number | null
          liked_count?: string | null
          nickname?: string | null
          source_keyword?: string | null
          title?: string | null
          user_id?: string | null
          video_cover_url?: string | null
          video_id?: string | null
          video_play_url?: string | null
          video_type?: string | null
          video_url?: string | null
          viewd_count?: string | null
        }
        Relationships: []
      }
      kuaishou_video_comment: {
        Row: {
          add_ts: number | null
          avatar: string | null
          comment_id: number | null
          content: string | null
          create_time: number | null
          id: number
          last_modify_ts: number | null
          nickname: string | null
          sub_comment_count: string | null
          user_id: string | null
          video_id: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          comment_id?: number | null
          content?: string | null
          create_time?: number | null
          id?: number
          last_modify_ts?: number | null
          nickname?: string | null
          sub_comment_count?: string | null
          user_id?: string | null
          video_id?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          comment_id?: number | null
          content?: string | null
          create_time?: number | null
          id?: number
          last_modify_ts?: number | null
          nickname?: string | null
          sub_comment_count?: string | null
          user_id?: string | null
          video_id?: string | null
        }
        Relationships: []
      }
      post_metric_snapshots: {
        Row: {
          comment_count: number
          id: string
          like_count: number
          observed_at: string
          platform: string
          platform_post_id: string
          post_id: string
          raw: Json | null
          share_count: number
          source: string | null
          view_count: number
        }
        Insert: {
          comment_count?: number
          id?: string
          like_count?: number
          observed_at?: string
          platform: string
          platform_post_id: string
          post_id: string
          raw?: Json | null
          share_count?: number
          source?: string | null
          view_count?: number
        }
        Update: {
          comment_count?: number
          id?: string
          like_count?: number
          observed_at?: string
          platform?: string
          platform_post_id?: string
          post_id?: string
          raw?: Json | null
          share_count?: number
          source?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_metric_snapshots_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "crawled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      release_ops_apps: {
        Row: {
          app_name: string
          created_at: string
          id: string
          metadata: Json
          package_name: string
          play_account_id: string | null
          policy_readiness: string
          target_sdk: number | null
          updated_at: string
        }
        Insert: {
          app_name: string
          created_at?: string
          id?: string
          metadata?: Json
          package_name: string
          play_account_id?: string | null
          policy_readiness?: string
          target_sdk?: number | null
          updated_at?: string
        }
        Update: {
          app_name?: string
          created_at?: string
          id?: string
          metadata?: Json
          package_name?: string
          play_account_id?: string | null
          policy_readiness?: string
          target_sdk?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_ops_apps_play_account_id_fkey"
            columns: ["play_account_id"]
            isOneToOne: false
            referencedRelation: "release_ops_play_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      release_ops_artifacts: {
        Row: {
          checksum_sha256: string
          created_at: string
          file_name: string
          file_size: number
          id: string
          provenance: Json
          release_id: string
          signing_fingerprint: string | null
          storage_path: string
        }
        Insert: {
          checksum_sha256: string
          created_at?: string
          file_name: string
          file_size: number
          id?: string
          provenance?: Json
          release_id: string
          signing_fingerprint?: string | null
          storage_path: string
        }
        Update: {
          checksum_sha256?: string
          created_at?: string
          file_name?: string
          file_size?: number
          id?: string
          provenance?: Json
          release_id?: string
          signing_fingerprint?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_ops_artifacts_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "release_ops_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      release_ops_aso_metrics: {
        Row: {
          app_id: string
          conversion_rate: number | null
          created_at: string
          dimension: string
          dimension_value: string
          id: string
          installs: number
          metadata: Json
          report_date: string
          store_listing_visitors: number
          updated_at: string
        }
        Insert: {
          app_id: string
          conversion_rate?: number | null
          created_at?: string
          dimension: string
          dimension_value: string
          id?: string
          installs?: number
          metadata?: Json
          report_date: string
          store_listing_visitors?: number
          updated_at?: string
        }
        Update: {
          app_id?: string
          conversion_rate?: number | null
          created_at?: string
          dimension?: string
          dimension_value?: string
          id?: string
          installs?: number
          metadata?: Json
          report_date?: string
          store_listing_visitors?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_ops_aso_metrics_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "release_ops_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      release_ops_audits: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      release_ops_batch_operations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          operation_type: string
          plan_payload: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          operation_type: string
          plan_payload?: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          operation_type?: string
          plan_payload?: Json
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      release_ops_job_events: {
        Row: {
          created_at: string
          external_ref: string | null
          id: string
          job_id: string
          level: string
          message: string
          metadata: Json
          progress: number | null
          stage: string
        }
        Insert: {
          created_at?: string
          external_ref?: string | null
          id?: string
          job_id: string
          level?: string
          message: string
          metadata?: Json
          progress?: number | null
          stage: string
        }
        Update: {
          created_at?: string
          external_ref?: string | null
          id?: string
          job_id?: string
          level?: string
          message?: string
          metadata?: Json
          progress?: number | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_ops_job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "release_ops_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      release_ops_jobs: {
        Row: {
          app_id: string | null
          attempt_count: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          heartbeat_at: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          lease_until: string | null
          max_attempts: number
          payload: Json
          priority: number
          release_id: string | null
          result: Json
          status: string
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          app_id?: string | null
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          heartbeat_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_type: string
          lease_until?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          release_id?: string | null
          result?: Json
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          app_id?: string | null
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          heartbeat_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_type?: string
          lease_until?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          release_id?: string | null
          result?: Json
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "release_ops_jobs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "release_ops_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_ops_jobs_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "release_ops_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_ops_jobs_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "release_ops_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      release_ops_play_accounts: {
        Row: {
          bucket_name: string
          created_at: string
          developer_id: string
          id: string
          service_account_key_file: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          created_at?: string
          developer_id: string
          id?: string
          service_account_key_file?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          developer_id?: string
          id?: string
          service_account_key_file?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      release_ops_releases: {
        Row: {
          app_id: string
          batch_operation_id: string | null
          created_at: string
          id: string
          release_notes: string | null
          rollout_percentage: number
          status: string
          track: string
          updated_at: string
          version_code: number
          version_name: string
        }
        Insert: {
          app_id: string
          batch_operation_id?: string | null
          created_at?: string
          id?: string
          release_notes?: string | null
          rollout_percentage?: number
          status?: string
          track: string
          updated_at?: string
          version_code: number
          version_name: string
        }
        Update: {
          app_id?: string
          batch_operation_id?: string | null
          created_at?: string
          id?: string
          release_notes?: string | null
          rollout_percentage?: number
          status?: string
          track?: string
          updated_at?: string
          version_code?: number
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_ops_releases_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "release_ops_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_ops_releases_batch_operation_id_fkey"
            columns: ["batch_operation_id"]
            isOneToOne: false
            referencedRelation: "release_ops_batch_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      release_ops_workers: {
        Row: {
          capacity: Json
          created_at: string
          id: string
          last_heartbeat: string
          status: string
          updated_at: string
          worker_name: string
        }
        Insert: {
          capacity?: Json
          created_at?: string
          id?: string
          last_heartbeat?: string
          status?: string
          updated_at?: string
          worker_name: string
        }
        Update: {
          capacity?: Json
          created_at?: string
          id?: string
          last_heartbeat?: string
          status?: string
          updated_at?: string
          worker_name?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          alert_on_failure: boolean
          api_key: string | null
          collect_comments: boolean
          collect_replies: boolean
          default_priority: string
          default_webhook_url: string | null
          headless_mode: boolean
          id: string
          max_concurrent_tasks: number
          max_retries: number
          notify_on_success: boolean
          updated_at: string
          use_2captcha: boolean
        }
        Insert: {
          alert_on_failure?: boolean
          api_key?: string | null
          collect_comments?: boolean
          collect_replies?: boolean
          default_priority?: string
          default_webhook_url?: string | null
          headless_mode?: boolean
          id?: string
          max_concurrent_tasks?: number
          max_retries?: number
          notify_on_success?: boolean
          updated_at?: string
          use_2captcha?: boolean
        }
        Update: {
          alert_on_failure?: boolean
          api_key?: string | null
          collect_comments?: boolean
          collect_replies?: boolean
          default_priority?: string
          default_webhook_url?: string | null
          headless_mode?: boolean
          id?: string
          max_concurrent_tasks?: number
          max_retries?: number
          notify_on_success?: boolean
          updated_at?: string
          use_2captcha?: boolean
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          role_id: string | null
          token: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          role_id?: string | null
          token: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          role_id?: string | null
          token?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "team_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role_id: string | null
          status: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role_id?: string | null
          status?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string | null
          status?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "team_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_role_permissions: {
        Row: {
          permission: string
          role_id: string
        }
        Insert: {
          permission: string
          role_id: string
        }
        Update: {
          permission?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "team_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_locked: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_locked?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_locked?: boolean
          name?: string
        }
        Relationships: []
      }
      tieba_comment: {
        Row: {
          add_ts: number | null
          comment_id: string | null
          content: string | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          note_id: string | null
          note_url: string | null
          parent_comment_id: string | null
          publish_time: string | null
          sub_comment_count: number | null
          tieba_id: string | null
          tieba_link: string | null
          tieba_name: string | null
          user_avatar: string | null
          user_link: string | null
          user_nickname: string | null
        }
        Insert: {
          add_ts?: number | null
          comment_id?: string | null
          content?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          note_id?: string | null
          note_url?: string | null
          parent_comment_id?: string | null
          publish_time?: string | null
          sub_comment_count?: number | null
          tieba_id?: string | null
          tieba_link?: string | null
          tieba_name?: string | null
          user_avatar?: string | null
          user_link?: string | null
          user_nickname?: string | null
        }
        Update: {
          add_ts?: number | null
          comment_id?: string | null
          content?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          note_id?: string | null
          note_url?: string | null
          parent_comment_id?: string | null
          publish_time?: string | null
          sub_comment_count?: number | null
          tieba_id?: string | null
          tieba_link?: string | null
          tieba_name?: string | null
          user_avatar?: string | null
          user_link?: string | null
          user_nickname?: string | null
        }
        Relationships: []
      }
      tieba_creator: {
        Row: {
          add_ts: number | null
          avatar: string | null
          fans: string | null
          follows: string | null
          gender: string | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          nickname: string | null
          registration_duration: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          fans?: string | null
          follows?: string | null
          gender?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          nickname?: string | null
          registration_duration?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          fans?: string | null
          follows?: string | null
          gender?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          nickname?: string | null
          registration_duration?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      tieba_note: {
        Row: {
          add_ts: number | null
          desc: string | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          note_id: string | null
          note_url: string | null
          publish_time: string | null
          source_keyword: string | null
          tieba_id: string | null
          tieba_link: string | null
          tieba_name: string | null
          title: string | null
          total_replay_num: number | null
          total_replay_page: number | null
          user_avatar: string | null
          user_link: string | null
          user_nickname: string | null
        }
        Insert: {
          add_ts?: number | null
          desc?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          note_id?: string | null
          note_url?: string | null
          publish_time?: string | null
          source_keyword?: string | null
          tieba_id?: string | null
          tieba_link?: string | null
          tieba_name?: string | null
          title?: string | null
          total_replay_num?: number | null
          total_replay_page?: number | null
          user_avatar?: string | null
          user_link?: string | null
          user_nickname?: string | null
        }
        Update: {
          add_ts?: number | null
          desc?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          note_id?: string | null
          note_url?: string | null
          publish_time?: string | null
          source_keyword?: string | null
          tieba_id?: string | null
          tieba_link?: string | null
          tieba_name?: string | null
          title?: string | null
          total_replay_num?: number | null
          total_replay_page?: number | null
          user_avatar?: string | null
          user_link?: string | null
          user_nickname?: string | null
        }
        Relationships: []
      }
      weibo_creator: {
        Row: {
          add_ts: number | null
          avatar: string | null
          desc: string | null
          fans: string | null
          follows: string | null
          gender: string | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          nickname: string | null
          tag_list: string | null
          user_id: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          desc?: string | null
          fans?: string | null
          follows?: string | null
          gender?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          nickname?: string | null
          tag_list?: string | null
          user_id?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          desc?: string | null
          fans?: string | null
          follows?: string | null
          gender?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          nickname?: string | null
          tag_list?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      weibo_note: {
        Row: {
          add_ts: number | null
          avatar: string | null
          comments_count: string | null
          content: string | null
          create_date_time: string | null
          create_time: number | null
          gender: string | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          liked_count: string | null
          nickname: string | null
          note_id: number | null
          note_url: string | null
          profile_url: string | null
          shared_count: string | null
          source_keyword: string | null
          user_id: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          comments_count?: string | null
          content?: string | null
          create_date_time?: string | null
          create_time?: number | null
          gender?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          liked_count?: string | null
          nickname?: string | null
          note_id?: number | null
          note_url?: string | null
          profile_url?: string | null
          shared_count?: string | null
          source_keyword?: string | null
          user_id?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          comments_count?: string | null
          content?: string | null
          create_date_time?: string | null
          create_time?: number | null
          gender?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          liked_count?: string | null
          nickname?: string | null
          note_id?: number | null
          note_url?: string | null
          profile_url?: string | null
          shared_count?: string | null
          source_keyword?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      weibo_note_comment: {
        Row: {
          add_ts: number | null
          avatar: string | null
          comment_id: number | null
          comment_like_count: string | null
          content: string | null
          create_date_time: string | null
          create_time: number | null
          gender: string | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          nickname: string | null
          note_id: number | null
          parent_comment_id: string | null
          profile_url: string | null
          sub_comment_count: string | null
          user_id: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          comment_id?: number | null
          comment_like_count?: string | null
          content?: string | null
          create_date_time?: string | null
          create_time?: number | null
          gender?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          nickname?: string | null
          note_id?: number | null
          parent_comment_id?: string | null
          profile_url?: string | null
          sub_comment_count?: string | null
          user_id?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          comment_id?: number | null
          comment_like_count?: string | null
          content?: string | null
          create_date_time?: string | null
          create_time?: number | null
          gender?: string | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          nickname?: string | null
          note_id?: number | null
          parent_comment_id?: string | null
          profile_url?: string | null
          sub_comment_count?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      xhs_creator: {
        Row: {
          add_ts: number | null
          avatar: string | null
          desc: string | null
          fans: string | null
          follows: string | null
          gender: string | null
          id: number
          interaction: string | null
          ip_location: string | null
          last_modify_ts: number | null
          nickname: string | null
          tag_list: string | null
          user_id: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          desc?: string | null
          fans?: string | null
          follows?: string | null
          gender?: string | null
          id?: number
          interaction?: string | null
          ip_location?: string | null
          last_modify_ts?: number | null
          nickname?: string | null
          tag_list?: string | null
          user_id?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          desc?: string | null
          fans?: string | null
          follows?: string | null
          gender?: string | null
          id?: number
          interaction?: string | null
          ip_location?: string | null
          last_modify_ts?: number | null
          nickname?: string | null
          tag_list?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      xhs_note: {
        Row: {
          add_ts: number | null
          avatar: string | null
          collected_count: string | null
          comment_count: string | null
          desc: string | null
          id: number
          image_list: string | null
          ip_location: string | null
          last_modify_ts: number | null
          last_update_time: number | null
          liked_count: string | null
          nickname: string | null
          note_id: string | null
          note_url: string | null
          share_count: string | null
          source_keyword: string | null
          tag_list: string | null
          time: number | null
          title: string | null
          type: string | null
          user_id: string | null
          video_url: string | null
          xsec_token: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          collected_count?: string | null
          comment_count?: string | null
          desc?: string | null
          id?: number
          image_list?: string | null
          ip_location?: string | null
          last_modify_ts?: number | null
          last_update_time?: number | null
          liked_count?: string | null
          nickname?: string | null
          note_id?: string | null
          note_url?: string | null
          share_count?: string | null
          source_keyword?: string | null
          tag_list?: string | null
          time?: number | null
          title?: string | null
          type?: string | null
          user_id?: string | null
          video_url?: string | null
          xsec_token?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          collected_count?: string | null
          comment_count?: string | null
          desc?: string | null
          id?: number
          image_list?: string | null
          ip_location?: string | null
          last_modify_ts?: number | null
          last_update_time?: number | null
          liked_count?: string | null
          nickname?: string | null
          note_id?: string | null
          note_url?: string | null
          share_count?: string | null
          source_keyword?: string | null
          tag_list?: string | null
          time?: number | null
          title?: string | null
          type?: string | null
          user_id?: string | null
          video_url?: string | null
          xsec_token?: string | null
        }
        Relationships: []
      }
      xhs_note_comment: {
        Row: {
          add_ts: number | null
          avatar: string | null
          comment_id: string | null
          content: string | null
          create_time: number | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          like_count: string | null
          nickname: string | null
          note_id: string | null
          parent_comment_id: string | null
          pictures: string | null
          sub_comment_count: number | null
          user_id: string | null
        }
        Insert: {
          add_ts?: number | null
          avatar?: string | null
          comment_id?: string | null
          content?: string | null
          create_time?: number | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          like_count?: string | null
          nickname?: string | null
          note_id?: string | null
          parent_comment_id?: string | null
          pictures?: string | null
          sub_comment_count?: number | null
          user_id?: string | null
        }
        Update: {
          add_ts?: number | null
          avatar?: string | null
          comment_id?: string | null
          content?: string | null
          create_time?: number | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          like_count?: string | null
          nickname?: string | null
          note_id?: string | null
          parent_comment_id?: string | null
          pictures?: string | null
          sub_comment_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      zhihu_comment: {
        Row: {
          add_ts: number | null
          comment_id: string | null
          content: string | null
          content_id: string | null
          content_type: string | null
          dislike_count: number | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          like_count: number | null
          parent_comment_id: string | null
          publish_time: string | null
          sub_comment_count: number | null
          user_avatar: string | null
          user_id: string | null
          user_link: string | null
          user_nickname: string | null
        }
        Insert: {
          add_ts?: number | null
          comment_id?: string | null
          content?: string | null
          content_id?: string | null
          content_type?: string | null
          dislike_count?: number | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          like_count?: number | null
          parent_comment_id?: string | null
          publish_time?: string | null
          sub_comment_count?: number | null
          user_avatar?: string | null
          user_id?: string | null
          user_link?: string | null
          user_nickname?: string | null
        }
        Update: {
          add_ts?: number | null
          comment_id?: string | null
          content?: string | null
          content_id?: string | null
          content_type?: string | null
          dislike_count?: number | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          like_count?: number | null
          parent_comment_id?: string | null
          publish_time?: string | null
          sub_comment_count?: number | null
          user_avatar?: string | null
          user_id?: string | null
          user_link?: string | null
          user_nickname?: string | null
        }
        Relationships: []
      }
      zhihu_content: {
        Row: {
          add_ts: number | null
          comment_count: number | null
          content_id: string | null
          content_text: string | null
          content_type: string | null
          content_url: string | null
          created_time: string | null
          desc: string | null
          id: number
          last_modify_ts: number | null
          question_id: string | null
          source_keyword: string | null
          title: string | null
          updated_time: string | null
          user_avatar: string | null
          user_id: string | null
          user_link: string | null
          user_nickname: string | null
          user_url_token: string | null
          voteup_count: number | null
        }
        Insert: {
          add_ts?: number | null
          comment_count?: number | null
          content_id?: string | null
          content_text?: string | null
          content_type?: string | null
          content_url?: string | null
          created_time?: string | null
          desc?: string | null
          id?: number
          last_modify_ts?: number | null
          question_id?: string | null
          source_keyword?: string | null
          title?: string | null
          updated_time?: string | null
          user_avatar?: string | null
          user_id?: string | null
          user_link?: string | null
          user_nickname?: string | null
          user_url_token?: string | null
          voteup_count?: number | null
        }
        Update: {
          add_ts?: number | null
          comment_count?: number | null
          content_id?: string | null
          content_text?: string | null
          content_type?: string | null
          content_url?: string | null
          created_time?: string | null
          desc?: string | null
          id?: number
          last_modify_ts?: number | null
          question_id?: string | null
          source_keyword?: string | null
          title?: string | null
          updated_time?: string | null
          user_avatar?: string | null
          user_id?: string | null
          user_link?: string | null
          user_nickname?: string | null
          user_url_token?: string | null
          voteup_count?: number | null
        }
        Relationships: []
      }
      zhihu_creator: {
        Row: {
          add_ts: number | null
          anwser_count: number | null
          article_count: number | null
          column_count: number | null
          fans: number | null
          follows: number | null
          gender: string | null
          get_voteup_count: number | null
          id: number
          ip_location: string | null
          last_modify_ts: number | null
          question_count: number | null
          url_token: string | null
          user_avatar: string | null
          user_id: string | null
          user_link: string | null
          user_nickname: string | null
          video_count: number | null
        }
        Insert: {
          add_ts?: number | null
          anwser_count?: number | null
          article_count?: number | null
          column_count?: number | null
          fans?: number | null
          follows?: number | null
          gender?: string | null
          get_voteup_count?: number | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          question_count?: number | null
          url_token?: string | null
          user_avatar?: string | null
          user_id?: string | null
          user_link?: string | null
          user_nickname?: string | null
          video_count?: number | null
        }
        Update: {
          add_ts?: number | null
          anwser_count?: number | null
          article_count?: number | null
          column_count?: number | null
          fans?: number | null
          follows?: number | null
          gender?: string | null
          get_voteup_count?: number | null
          id?: number
          ip_location?: string | null
          last_modify_ts?: number | null
          question_count?: number | null
          url_token?: string | null
          user_avatar?: string | null
          user_id?: string | null
          user_link?: string | null
          user_nickname?: string | null
          video_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_next_crawler_task: { Args: never; Returns: Json }
      claim_next_job: {
        Args: {
          p_job_types: string[]
          p_lease_duration: string
          p_worker_id: string
        }
        Returns: {
          app_id: string | null
          attempt_count: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          heartbeat_at: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          lease_until: string | null
          max_attempts: number
          payload: Json
          priority: number
          release_id: string | null
          result: Json
          status: string
          updated_at: string
          worker_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "release_ops_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_crawler_tasks: { Args: { p_tasks: Json }; Returns: Json }
      fail_job: {
        Args: {
          p_error_message?: string
          p_fatal?: boolean
          p_job_id: string
          p_worker_id: string
        }
        Returns: {
          app_id: string | null
          attempt_count: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          heartbeat_at: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          lease_until: string | null
          max_attempts: number
          payload: Json
          priority: number
          release_id: string | null
          result: Json
          status: string
          updated_at: string
          worker_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "release_ops_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      heartbeat_job: {
        Args: {
          p_job_id: string
          p_lease_duration: string
          p_worker_id: string
        }
        Returns: boolean
      }
      heartbeat_worker: {
        Args: {
          p_capacity: Json
          p_status: string
          p_worker_id: string
          p_worker_name: string
        }
        Returns: undefined
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      succeed_job: {
        Args: { p_job_id: string; p_result?: Json; p_worker_id: string }
        Returns: {
          app_id: string | null
          attempt_count: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          heartbeat_at: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          lease_until: string | null
          max_attempts: number
          payload: Json
          priority: number
          release_id: string | null
          result: Json
          status: string
          updated_at: string
          worker_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "release_ops_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sync_aso_metrics: { Args: { p_metrics: Json }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

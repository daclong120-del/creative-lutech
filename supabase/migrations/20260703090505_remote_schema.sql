


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bilibili_contact_info" (
    "id" integer NOT NULL,
    "up_id" bigint,
    "fan_id" bigint,
    "up_name" "text",
    "fan_name" "text",
    "up_sign" "text",
    "fan_sign" "text",
    "up_avatar" "text",
    "fan_avatar" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint
);


ALTER TABLE "public"."bilibili_contact_info" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bilibili_contact_info"."id" IS '主键ID';



COMMENT ON COLUMN "public"."bilibili_contact_info"."up_id" IS 'UP主ID';



COMMENT ON COLUMN "public"."bilibili_contact_info"."fan_id" IS '粉丝ID';



COMMENT ON COLUMN "public"."bilibili_contact_info"."up_name" IS 'UP主名称';



COMMENT ON COLUMN "public"."bilibili_contact_info"."fan_name" IS '粉丝名称';



COMMENT ON COLUMN "public"."bilibili_contact_info"."up_sign" IS 'UP主签名';



COMMENT ON COLUMN "public"."bilibili_contact_info"."fan_sign" IS '粉丝签名';



COMMENT ON COLUMN "public"."bilibili_contact_info"."up_avatar" IS 'UP主头像';



COMMENT ON COLUMN "public"."bilibili_contact_info"."fan_avatar" IS '粉丝头像';



COMMENT ON COLUMN "public"."bilibili_contact_info"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."bilibili_contact_info"."last_modify_ts" IS '最后修改时间戳';



CREATE SEQUENCE IF NOT EXISTS "public"."bilibili_contact_info_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bilibili_contact_info_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bilibili_contact_info_id_seq" OWNED BY "public"."bilibili_contact_info"."id";



CREATE TABLE IF NOT EXISTS "public"."bilibili_up_dynamic" (
    "id" integer NOT NULL,
    "dynamic_id" bigint,
    "user_id" character varying(255),
    "user_name" "text",
    "text" "text",
    "type" "text",
    "pub_ts" bigint,
    "total_comments" integer,
    "total_forwards" integer,
    "total_liked" integer,
    "add_ts" bigint,
    "last_modify_ts" bigint
);


ALTER TABLE "public"."bilibili_up_dynamic" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bilibili_up_dynamic"."id" IS '主键ID';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."dynamic_id" IS '动态ID';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."user_name" IS '用户名称';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."text" IS '动态内容';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."type" IS '动态类型';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."pub_ts" IS '发布时间戳';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."total_comments" IS '总评论数';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."total_forwards" IS '总转发数';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."total_liked" IS '总点赞数';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."bilibili_up_dynamic"."last_modify_ts" IS '最后修改时间戳';



CREATE SEQUENCE IF NOT EXISTS "public"."bilibili_up_dynamic_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bilibili_up_dynamic_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bilibili_up_dynamic_id_seq" OWNED BY "public"."bilibili_up_dynamic"."id";



CREATE TABLE IF NOT EXISTS "public"."bilibili_up_info" (
    "id" integer NOT NULL,
    "user_id" bigint,
    "nickname" "text",
    "sex" "text",
    "sign" "text",
    "avatar" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "total_fans" integer,
    "total_liked" integer,
    "user_rank" integer,
    "is_official" integer
);


ALTER TABLE "public"."bilibili_up_info" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bilibili_up_info"."id" IS '主键ID';



COMMENT ON COLUMN "public"."bilibili_up_info"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."bilibili_up_info"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."bilibili_up_info"."sex" IS '性别';



COMMENT ON COLUMN "public"."bilibili_up_info"."sign" IS '签名';



COMMENT ON COLUMN "public"."bilibili_up_info"."avatar" IS '头像';



COMMENT ON COLUMN "public"."bilibili_up_info"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."bilibili_up_info"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."bilibili_up_info"."total_fans" IS '总粉丝数';



COMMENT ON COLUMN "public"."bilibili_up_info"."total_liked" IS '总获赞数';



COMMENT ON COLUMN "public"."bilibili_up_info"."user_rank" IS '用户等级';



COMMENT ON COLUMN "public"."bilibili_up_info"."is_official" IS '是否官方认证';



CREATE SEQUENCE IF NOT EXISTS "public"."bilibili_up_info_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bilibili_up_info_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bilibili_up_info_id_seq" OWNED BY "public"."bilibili_up_info"."id";



CREATE TABLE IF NOT EXISTS "public"."bilibili_video" (
    "id" integer NOT NULL,
    "video_id" bigint NOT NULL,
    "video_url" "text" NOT NULL,
    "user_id" bigint,
    "nickname" "text",
    "avatar" "text",
    "liked_count" integer,
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "video_type" "text",
    "title" "text",
    "desc" "text",
    "create_time" bigint,
    "disliked_count" "text",
    "video_play_count" "text",
    "video_favorite_count" "text",
    "video_share_count" "text",
    "video_coin_count" "text",
    "video_danmaku" "text",
    "video_comment" "text",
    "video_cover_url" "text",
    "source_keyword" "text"
);


ALTER TABLE "public"."bilibili_video" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bilibili_video"."id" IS '主键ID';



COMMENT ON COLUMN "public"."bilibili_video"."video_id" IS '视频ID';



COMMENT ON COLUMN "public"."bilibili_video"."video_url" IS '视频URL';



COMMENT ON COLUMN "public"."bilibili_video"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."bilibili_video"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."bilibili_video"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."bilibili_video"."liked_count" IS '点赞数';



COMMENT ON COLUMN "public"."bilibili_video"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."bilibili_video"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."bilibili_video"."video_type" IS '视频类型';



COMMENT ON COLUMN "public"."bilibili_video"."title" IS '视频标题';



COMMENT ON COLUMN "public"."bilibili_video"."desc" IS '视频描述';



COMMENT ON COLUMN "public"."bilibili_video"."create_time" IS '创建时间戳';



COMMENT ON COLUMN "public"."bilibili_video"."disliked_count" IS '点踩数';



COMMENT ON COLUMN "public"."bilibili_video"."video_play_count" IS '播放数';



COMMENT ON COLUMN "public"."bilibili_video"."video_favorite_count" IS '收藏数';



COMMENT ON COLUMN "public"."bilibili_video"."video_share_count" IS '分享数';



COMMENT ON COLUMN "public"."bilibili_video"."video_coin_count" IS '硬币数';



COMMENT ON COLUMN "public"."bilibili_video"."video_danmaku" IS '弹幕数';



COMMENT ON COLUMN "public"."bilibili_video"."video_comment" IS '评论数';



COMMENT ON COLUMN "public"."bilibili_video"."video_cover_url" IS '视频封面URL';



COMMENT ON COLUMN "public"."bilibili_video"."source_keyword" IS '来源关键词';



CREATE TABLE IF NOT EXISTS "public"."bilibili_video_comment" (
    "id" integer NOT NULL,
    "user_id" character varying(255),
    "nickname" "text",
    "sex" "text",
    "sign" "text",
    "avatar" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "comment_id" bigint,
    "video_id" bigint,
    "content" "text",
    "create_time" bigint,
    "sub_comment_count" "text",
    "parent_comment_id" character varying(255),
    "like_count" "text"
);


ALTER TABLE "public"."bilibili_video_comment" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bilibili_video_comment"."id" IS '主键ID';



COMMENT ON COLUMN "public"."bilibili_video_comment"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."bilibili_video_comment"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."bilibili_video_comment"."sex" IS '性别';



COMMENT ON COLUMN "public"."bilibili_video_comment"."sign" IS '签名';



COMMENT ON COLUMN "public"."bilibili_video_comment"."avatar" IS '头像';



COMMENT ON COLUMN "public"."bilibili_video_comment"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."bilibili_video_comment"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."bilibili_video_comment"."comment_id" IS '评论ID';



COMMENT ON COLUMN "public"."bilibili_video_comment"."video_id" IS '视频ID';



COMMENT ON COLUMN "public"."bilibili_video_comment"."content" IS '评论内容';



COMMENT ON COLUMN "public"."bilibili_video_comment"."create_time" IS '创建时间戳';



COMMENT ON COLUMN "public"."bilibili_video_comment"."sub_comment_count" IS '子评论数';



COMMENT ON COLUMN "public"."bilibili_video_comment"."parent_comment_id" IS '父评论ID';



COMMENT ON COLUMN "public"."bilibili_video_comment"."like_count" IS '点赞数';



CREATE SEQUENCE IF NOT EXISTS "public"."bilibili_video_comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bilibili_video_comment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bilibili_video_comment_id_seq" OWNED BY "public"."bilibili_video_comment"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."bilibili_video_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bilibili_video_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bilibili_video_id_seq" OWNED BY "public"."bilibili_video"."id";



CREATE TABLE IF NOT EXISTS "public"."crawler_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform" "text" NOT NULL,
    "username" "text" NOT NULL,
    "cookie_data" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "failure_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_status" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'banned'::"text"])))
);


ALTER TABLE "public"."crawler_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."douyin_aweme" (
    "id" integer NOT NULL,
    "user_id" character varying(255),
    "sec_uid" character varying(255),
    "short_user_id" character varying(255),
    "user_unique_id" character varying(255),
    "nickname" "text",
    "avatar" "text",
    "user_signature" "text",
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "aweme_id" bigint,
    "aweme_type" "text",
    "title" "text",
    "desc" "text",
    "create_time" bigint,
    "liked_count" "text",
    "comment_count" "text",
    "share_count" "text",
    "collected_count" "text",
    "aweme_url" "text",
    "cover_url" "text",
    "video_download_url" "text",
    "music_download_url" "text",
    "note_download_url" "text",
    "source_keyword" "text"
);


ALTER TABLE "public"."douyin_aweme" OWNER TO "postgres";


COMMENT ON COLUMN "public"."douyin_aweme"."id" IS '主键ID';



COMMENT ON COLUMN "public"."douyin_aweme"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."douyin_aweme"."sec_uid" IS '安全用户ID';



COMMENT ON COLUMN "public"."douyin_aweme"."short_user_id" IS '短用户ID';



COMMENT ON COLUMN "public"."douyin_aweme"."user_unique_id" IS '用户唯一ID';



COMMENT ON COLUMN "public"."douyin_aweme"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."douyin_aweme"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."douyin_aweme"."user_signature" IS '用户签名';



COMMENT ON COLUMN "public"."douyin_aweme"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."douyin_aweme"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."douyin_aweme"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."douyin_aweme"."aweme_id" IS '作品ID';



COMMENT ON COLUMN "public"."douyin_aweme"."aweme_type" IS '作品类型';



COMMENT ON COLUMN "public"."douyin_aweme"."title" IS '作品标题';



COMMENT ON COLUMN "public"."douyin_aweme"."desc" IS '作品描述';



COMMENT ON COLUMN "public"."douyin_aweme"."create_time" IS '创建时间戳';



COMMENT ON COLUMN "public"."douyin_aweme"."liked_count" IS '点赞数';



COMMENT ON COLUMN "public"."douyin_aweme"."comment_count" IS '评论数';



COMMENT ON COLUMN "public"."douyin_aweme"."share_count" IS '分享数';



COMMENT ON COLUMN "public"."douyin_aweme"."collected_count" IS '收藏数';



COMMENT ON COLUMN "public"."douyin_aweme"."aweme_url" IS '作品URL';



COMMENT ON COLUMN "public"."douyin_aweme"."cover_url" IS '封面URL';



COMMENT ON COLUMN "public"."douyin_aweme"."video_download_url" IS '视频下载URL';



COMMENT ON COLUMN "public"."douyin_aweme"."music_download_url" IS '音乐下载URL';



COMMENT ON COLUMN "public"."douyin_aweme"."note_download_url" IS '笔记下载URL';



COMMENT ON COLUMN "public"."douyin_aweme"."source_keyword" IS '来源关键词';



CREATE TABLE IF NOT EXISTS "public"."douyin_aweme_comment" (
    "id" integer NOT NULL,
    "user_id" character varying(255),
    "sec_uid" character varying(255),
    "short_user_id" character varying(255),
    "user_unique_id" character varying(255),
    "nickname" "text",
    "avatar" "text",
    "user_signature" "text",
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "comment_id" bigint,
    "aweme_id" bigint,
    "content" "text",
    "create_time" bigint,
    "sub_comment_count" "text",
    "parent_comment_id" character varying(255),
    "like_count" "text",
    "pictures" "text"
);


ALTER TABLE "public"."douyin_aweme_comment" OWNER TO "postgres";


COMMENT ON COLUMN "public"."douyin_aweme_comment"."id" IS '主键ID';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."sec_uid" IS '安全用户ID';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."short_user_id" IS '短用户ID';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."user_unique_id" IS '用户唯一ID';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."user_signature" IS '用户签名';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."comment_id" IS '评论ID';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."aweme_id" IS '作品ID';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."content" IS '评论内容';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."create_time" IS '创建时间戳';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."sub_comment_count" IS '子评论数';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."parent_comment_id" IS '父评论ID';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."like_count" IS '点赞数';



COMMENT ON COLUMN "public"."douyin_aweme_comment"."pictures" IS '图片';



CREATE SEQUENCE IF NOT EXISTS "public"."douyin_aweme_comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."douyin_aweme_comment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."douyin_aweme_comment_id_seq" OWNED BY "public"."douyin_aweme_comment"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."douyin_aweme_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."douyin_aweme_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."douyin_aweme_id_seq" OWNED BY "public"."douyin_aweme"."id";



CREATE TABLE IF NOT EXISTS "public"."dy_creator" (
    "id" integer NOT NULL,
    "user_id" character varying(255),
    "nickname" "text",
    "avatar" "text",
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "desc" "text",
    "gender" "text",
    "follows" "text",
    "fans" "text",
    "interaction" "text",
    "videos_count" character varying(255)
);


ALTER TABLE "public"."dy_creator" OWNER TO "postgres";


COMMENT ON COLUMN "public"."dy_creator"."id" IS '主键ID';



COMMENT ON COLUMN "public"."dy_creator"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."dy_creator"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."dy_creator"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."dy_creator"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."dy_creator"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."dy_creator"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."dy_creator"."desc" IS '描述';



COMMENT ON COLUMN "public"."dy_creator"."gender" IS '性别';



COMMENT ON COLUMN "public"."dy_creator"."follows" IS '关注数';



COMMENT ON COLUMN "public"."dy_creator"."fans" IS '粉丝数';



COMMENT ON COLUMN "public"."dy_creator"."interaction" IS '互动数';



COMMENT ON COLUMN "public"."dy_creator"."videos_count" IS '视频数量';



CREATE SEQUENCE IF NOT EXISTS "public"."dy_creator_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dy_creator_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dy_creator_id_seq" OWNED BY "public"."dy_creator"."id";



CREATE TABLE IF NOT EXISTS "public"."kuaishou_video" (
    "id" integer NOT NULL,
    "user_id" character varying(64),
    "nickname" "text",
    "avatar" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "video_id" character varying(255),
    "video_type" "text",
    "title" "text",
    "desc" "text",
    "create_time" bigint,
    "liked_count" "text",
    "viewd_count" "text",
    "video_url" "text",
    "video_cover_url" "text",
    "video_play_url" "text",
    "source_keyword" "text"
);


ALTER TABLE "public"."kuaishou_video" OWNER TO "postgres";


COMMENT ON COLUMN "public"."kuaishou_video"."id" IS '主键ID';



COMMENT ON COLUMN "public"."kuaishou_video"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."kuaishou_video"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."kuaishou_video"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."kuaishou_video"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."kuaishou_video"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."kuaishou_video"."video_id" IS '视频ID';



COMMENT ON COLUMN "public"."kuaishou_video"."video_type" IS '视频类型';



COMMENT ON COLUMN "public"."kuaishou_video"."title" IS '视频标题';



COMMENT ON COLUMN "public"."kuaishou_video"."desc" IS '视频描述';



COMMENT ON COLUMN "public"."kuaishou_video"."create_time" IS '创建时间戳';



COMMENT ON COLUMN "public"."kuaishou_video"."liked_count" IS '点赞数';



COMMENT ON COLUMN "public"."kuaishou_video"."viewd_count" IS '观看数';



COMMENT ON COLUMN "public"."kuaishou_video"."video_url" IS '视频URL';



COMMENT ON COLUMN "public"."kuaishou_video"."video_cover_url" IS '视频封面URL';



COMMENT ON COLUMN "public"."kuaishou_video"."video_play_url" IS '视频播放URL';



COMMENT ON COLUMN "public"."kuaishou_video"."source_keyword" IS '来源关键词';



CREATE TABLE IF NOT EXISTS "public"."kuaishou_video_comment" (
    "id" integer NOT NULL,
    "user_id" "text",
    "nickname" "text",
    "avatar" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "comment_id" bigint,
    "video_id" character varying(255),
    "content" "text",
    "create_time" bigint,
    "sub_comment_count" "text"
);


ALTER TABLE "public"."kuaishou_video_comment" OWNER TO "postgres";


COMMENT ON COLUMN "public"."kuaishou_video_comment"."id" IS '主键ID';



COMMENT ON COLUMN "public"."kuaishou_video_comment"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."kuaishou_video_comment"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."kuaishou_video_comment"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."kuaishou_video_comment"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."kuaishou_video_comment"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."kuaishou_video_comment"."comment_id" IS '评论ID';



COMMENT ON COLUMN "public"."kuaishou_video_comment"."video_id" IS '视频ID';



COMMENT ON COLUMN "public"."kuaishou_video_comment"."content" IS '评论内容';



COMMENT ON COLUMN "public"."kuaishou_video_comment"."create_time" IS '创建时间戳';



COMMENT ON COLUMN "public"."kuaishou_video_comment"."sub_comment_count" IS '子评论数';



CREATE SEQUENCE IF NOT EXISTS "public"."kuaishou_video_comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."kuaishou_video_comment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."kuaishou_video_comment_id_seq" OWNED BY "public"."kuaishou_video_comment"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."kuaishou_video_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."kuaishou_video_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."kuaishou_video_id_seq" OWNED BY "public"."kuaishou_video"."id";



CREATE TABLE IF NOT EXISTS "public"."tieba_comment" (
    "id" integer NOT NULL,
    "comment_id" character varying(255),
    "parent_comment_id" character varying(255),
    "content" "text",
    "user_link" "text",
    "user_nickname" "text",
    "user_avatar" "text",
    "tieba_id" character varying(255),
    "tieba_name" "text",
    "tieba_link" "text",
    "publish_time" character varying(255),
    "ip_location" "text",
    "sub_comment_count" integer,
    "note_id" character varying(255),
    "note_url" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint
);


ALTER TABLE "public"."tieba_comment" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tieba_comment"."id" IS '主键ID';



COMMENT ON COLUMN "public"."tieba_comment"."comment_id" IS '评论ID';



COMMENT ON COLUMN "public"."tieba_comment"."parent_comment_id" IS '父评论ID';



COMMENT ON COLUMN "public"."tieba_comment"."content" IS '评论内容';



COMMENT ON COLUMN "public"."tieba_comment"."user_link" IS '用户链接';



COMMENT ON COLUMN "public"."tieba_comment"."user_nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."tieba_comment"."user_avatar" IS '用户头像';



COMMENT ON COLUMN "public"."tieba_comment"."tieba_id" IS '贴吧ID';



COMMENT ON COLUMN "public"."tieba_comment"."tieba_name" IS '贴吧名称';



COMMENT ON COLUMN "public"."tieba_comment"."tieba_link" IS '贴吧链接';



COMMENT ON COLUMN "public"."tieba_comment"."publish_time" IS '发布时间';



COMMENT ON COLUMN "public"."tieba_comment"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."tieba_comment"."sub_comment_count" IS '子评论数';



COMMENT ON COLUMN "public"."tieba_comment"."note_id" IS '笔记ID';



COMMENT ON COLUMN "public"."tieba_comment"."note_url" IS '笔记URL';



COMMENT ON COLUMN "public"."tieba_comment"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."tieba_comment"."last_modify_ts" IS '最后修改时间戳';



CREATE SEQUENCE IF NOT EXISTS "public"."tieba_comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tieba_comment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tieba_comment_id_seq" OWNED BY "public"."tieba_comment"."id";



CREATE TABLE IF NOT EXISTS "public"."tieba_creator" (
    "id" integer NOT NULL,
    "user_id" character varying(64),
    "user_name" "text",
    "nickname" "text",
    "avatar" "text",
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "gender" "text",
    "follows" "text",
    "fans" "text",
    "registration_duration" "text"
);


ALTER TABLE "public"."tieba_creator" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tieba_creator"."id" IS '主键ID';



COMMENT ON COLUMN "public"."tieba_creator"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."tieba_creator"."user_name" IS '用户名';



COMMENT ON COLUMN "public"."tieba_creator"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."tieba_creator"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."tieba_creator"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."tieba_creator"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."tieba_creator"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."tieba_creator"."gender" IS '性别';



COMMENT ON COLUMN "public"."tieba_creator"."follows" IS '关注数';



COMMENT ON COLUMN "public"."tieba_creator"."fans" IS '粉丝数';



COMMENT ON COLUMN "public"."tieba_creator"."registration_duration" IS '注册时长';



CREATE SEQUENCE IF NOT EXISTS "public"."tieba_creator_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tieba_creator_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tieba_creator_id_seq" OWNED BY "public"."tieba_creator"."id";



CREATE TABLE IF NOT EXISTS "public"."tieba_note" (
    "id" integer NOT NULL,
    "note_id" character varying(644),
    "title" "text",
    "desc" "text",
    "note_url" "text",
    "publish_time" character varying(255),
    "user_link" "text",
    "user_nickname" "text",
    "user_avatar" "text",
    "tieba_id" character varying(255),
    "tieba_name" "text",
    "tieba_link" "text",
    "total_replay_num" integer,
    "total_replay_page" integer,
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "source_keyword" "text"
);


ALTER TABLE "public"."tieba_note" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tieba_note"."id" IS '主键ID';



COMMENT ON COLUMN "public"."tieba_note"."note_id" IS '笔记ID';



COMMENT ON COLUMN "public"."tieba_note"."title" IS '笔记标题';



COMMENT ON COLUMN "public"."tieba_note"."desc" IS '笔记描述';



COMMENT ON COLUMN "public"."tieba_note"."note_url" IS '笔记URL';



COMMENT ON COLUMN "public"."tieba_note"."publish_time" IS '发布时间';



COMMENT ON COLUMN "public"."tieba_note"."user_link" IS '用户链接';



COMMENT ON COLUMN "public"."tieba_note"."user_nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."tieba_note"."user_avatar" IS '用户头像';



COMMENT ON COLUMN "public"."tieba_note"."tieba_id" IS '贴吧ID';



COMMENT ON COLUMN "public"."tieba_note"."tieba_name" IS '贴吧名称';



COMMENT ON COLUMN "public"."tieba_note"."tieba_link" IS '贴吧链接';



COMMENT ON COLUMN "public"."tieba_note"."total_replay_num" IS '总回复数';



COMMENT ON COLUMN "public"."tieba_note"."total_replay_page" IS '总回复页数';



COMMENT ON COLUMN "public"."tieba_note"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."tieba_note"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."tieba_note"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."tieba_note"."source_keyword" IS '来源关键词';



CREATE SEQUENCE IF NOT EXISTS "public"."tieba_note_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tieba_note_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tieba_note_id_seq" OWNED BY "public"."tieba_note"."id";



CREATE TABLE IF NOT EXISTS "public"."weibo_creator" (
    "id" integer NOT NULL,
    "user_id" character varying(255),
    "nickname" "text",
    "avatar" "text",
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "desc" "text",
    "gender" "text",
    "follows" "text",
    "fans" "text",
    "tag_list" "text"
);


ALTER TABLE "public"."weibo_creator" OWNER TO "postgres";


COMMENT ON COLUMN "public"."weibo_creator"."id" IS '主键ID';



COMMENT ON COLUMN "public"."weibo_creator"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."weibo_creator"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."weibo_creator"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."weibo_creator"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."weibo_creator"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."weibo_creator"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."weibo_creator"."desc" IS '描述';



COMMENT ON COLUMN "public"."weibo_creator"."gender" IS '性别';



COMMENT ON COLUMN "public"."weibo_creator"."follows" IS '关注数';



COMMENT ON COLUMN "public"."weibo_creator"."fans" IS '粉丝数';



COMMENT ON COLUMN "public"."weibo_creator"."tag_list" IS '标签列表';



CREATE SEQUENCE IF NOT EXISTS "public"."weibo_creator_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."weibo_creator_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."weibo_creator_id_seq" OWNED BY "public"."weibo_creator"."id";



CREATE TABLE IF NOT EXISTS "public"."weibo_note" (
    "id" integer NOT NULL,
    "user_id" character varying(255),
    "nickname" "text",
    "avatar" "text",
    "gender" "text",
    "profile_url" "text",
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "note_id" bigint,
    "content" "text",
    "create_time" bigint,
    "create_date_time" character varying(255),
    "liked_count" "text",
    "comments_count" "text",
    "shared_count" "text",
    "note_url" "text",
    "source_keyword" "text"
);


ALTER TABLE "public"."weibo_note" OWNER TO "postgres";


COMMENT ON COLUMN "public"."weibo_note"."id" IS '主键ID';



COMMENT ON COLUMN "public"."weibo_note"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."weibo_note"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."weibo_note"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."weibo_note"."gender" IS '性别';



COMMENT ON COLUMN "public"."weibo_note"."profile_url" IS '个人主页URL';



COMMENT ON COLUMN "public"."weibo_note"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."weibo_note"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."weibo_note"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."weibo_note"."note_id" IS '笔记ID';



COMMENT ON COLUMN "public"."weibo_note"."content" IS '笔记内容';



COMMENT ON COLUMN "public"."weibo_note"."create_time" IS '创建时间戳';



COMMENT ON COLUMN "public"."weibo_note"."create_date_time" IS '创建日期时间';



COMMENT ON COLUMN "public"."weibo_note"."liked_count" IS '点赞数';



COMMENT ON COLUMN "public"."weibo_note"."comments_count" IS '评论数';



COMMENT ON COLUMN "public"."weibo_note"."shared_count" IS '分享数';



COMMENT ON COLUMN "public"."weibo_note"."note_url" IS '笔记URL';



COMMENT ON COLUMN "public"."weibo_note"."source_keyword" IS '来源关键词';



CREATE TABLE IF NOT EXISTS "public"."weibo_note_comment" (
    "id" integer NOT NULL,
    "user_id" character varying(255),
    "nickname" "text",
    "avatar" "text",
    "gender" "text",
    "profile_url" "text",
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "comment_id" bigint,
    "note_id" bigint,
    "content" "text",
    "create_time" bigint,
    "create_date_time" character varying(255),
    "comment_like_count" "text",
    "sub_comment_count" "text",
    "parent_comment_id" character varying(255)
);


ALTER TABLE "public"."weibo_note_comment" OWNER TO "postgres";


COMMENT ON COLUMN "public"."weibo_note_comment"."id" IS '主键ID';



COMMENT ON COLUMN "public"."weibo_note_comment"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."weibo_note_comment"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."weibo_note_comment"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."weibo_note_comment"."gender" IS '性别';



COMMENT ON COLUMN "public"."weibo_note_comment"."profile_url" IS '个人主页URL';



COMMENT ON COLUMN "public"."weibo_note_comment"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."weibo_note_comment"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."weibo_note_comment"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."weibo_note_comment"."comment_id" IS '评论ID';



COMMENT ON COLUMN "public"."weibo_note_comment"."note_id" IS '笔记ID';



COMMENT ON COLUMN "public"."weibo_note_comment"."content" IS '评论内容';



COMMENT ON COLUMN "public"."weibo_note_comment"."create_time" IS '创建时间戳';



COMMENT ON COLUMN "public"."weibo_note_comment"."create_date_time" IS '创建日期时间';



COMMENT ON COLUMN "public"."weibo_note_comment"."comment_like_count" IS '评论点赞数';



COMMENT ON COLUMN "public"."weibo_note_comment"."sub_comment_count" IS '子评论数';



COMMENT ON COLUMN "public"."weibo_note_comment"."parent_comment_id" IS '父评论ID';



CREATE SEQUENCE IF NOT EXISTS "public"."weibo_note_comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."weibo_note_comment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."weibo_note_comment_id_seq" OWNED BY "public"."weibo_note_comment"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."weibo_note_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."weibo_note_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."weibo_note_id_seq" OWNED BY "public"."weibo_note"."id";



CREATE TABLE IF NOT EXISTS "public"."xhs_creator" (
    "id" integer NOT NULL,
    "user_id" character varying(255),
    "nickname" "text",
    "avatar" "text",
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "desc" "text",
    "gender" "text",
    "follows" "text",
    "fans" "text",
    "interaction" "text",
    "tag_list" "text"
);


ALTER TABLE "public"."xhs_creator" OWNER TO "postgres";


COMMENT ON COLUMN "public"."xhs_creator"."id" IS '主键ID';



COMMENT ON COLUMN "public"."xhs_creator"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."xhs_creator"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."xhs_creator"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."xhs_creator"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."xhs_creator"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."xhs_creator"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."xhs_creator"."desc" IS '描述';



COMMENT ON COLUMN "public"."xhs_creator"."gender" IS '性别';



COMMENT ON COLUMN "public"."xhs_creator"."follows" IS '关注数';



COMMENT ON COLUMN "public"."xhs_creator"."fans" IS '粉丝数';



COMMENT ON COLUMN "public"."xhs_creator"."interaction" IS '互动数';



COMMENT ON COLUMN "public"."xhs_creator"."tag_list" IS '标签列表';



CREATE SEQUENCE IF NOT EXISTS "public"."xhs_creator_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."xhs_creator_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."xhs_creator_id_seq" OWNED BY "public"."xhs_creator"."id";



CREATE TABLE IF NOT EXISTS "public"."xhs_note" (
    "id" integer NOT NULL,
    "user_id" character varying(255),
    "nickname" "text",
    "avatar" "text",
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "note_id" character varying(255),
    "type" "text",
    "title" "text",
    "desc" "text",
    "video_url" "text",
    "time" bigint,
    "last_update_time" bigint,
    "liked_count" "text",
    "collected_count" "text",
    "comment_count" "text",
    "share_count" "text",
    "image_list" "text",
    "tag_list" "text",
    "note_url" "text",
    "source_keyword" "text",
    "xsec_token" "text"
);


ALTER TABLE "public"."xhs_note" OWNER TO "postgres";


COMMENT ON COLUMN "public"."xhs_note"."id" IS '主键ID';



COMMENT ON COLUMN "public"."xhs_note"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."xhs_note"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."xhs_note"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."xhs_note"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."xhs_note"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."xhs_note"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."xhs_note"."note_id" IS '笔记ID';



COMMENT ON COLUMN "public"."xhs_note"."type" IS '笔记类型';



COMMENT ON COLUMN "public"."xhs_note"."title" IS '笔记标题';



COMMENT ON COLUMN "public"."xhs_note"."desc" IS '笔记描述';



COMMENT ON COLUMN "public"."xhs_note"."video_url" IS '视频URL';



COMMENT ON COLUMN "public"."xhs_note"."time" IS '时间戳';



COMMENT ON COLUMN "public"."xhs_note"."last_update_time" IS '最后更新时间戳';



COMMENT ON COLUMN "public"."xhs_note"."liked_count" IS '点赞数';



COMMENT ON COLUMN "public"."xhs_note"."collected_count" IS '收藏数';



COMMENT ON COLUMN "public"."xhs_note"."comment_count" IS '评论数';



COMMENT ON COLUMN "public"."xhs_note"."share_count" IS '分享数';



COMMENT ON COLUMN "public"."xhs_note"."image_list" IS '图片列表';



COMMENT ON COLUMN "public"."xhs_note"."tag_list" IS '标签列表';



COMMENT ON COLUMN "public"."xhs_note"."note_url" IS '笔记URL';



COMMENT ON COLUMN "public"."xhs_note"."source_keyword" IS '来源关键词';



COMMENT ON COLUMN "public"."xhs_note"."xsec_token" IS 'Xsec Token';



CREATE TABLE IF NOT EXISTS "public"."xhs_note_comment" (
    "id" integer NOT NULL,
    "user_id" character varying(255),
    "nickname" "text",
    "avatar" "text",
    "ip_location" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint,
    "comment_id" character varying(255),
    "create_time" bigint,
    "note_id" character varying(255),
    "content" "text",
    "sub_comment_count" integer,
    "pictures" "text",
    "parent_comment_id" character varying(255),
    "like_count" "text"
);


ALTER TABLE "public"."xhs_note_comment" OWNER TO "postgres";


COMMENT ON COLUMN "public"."xhs_note_comment"."id" IS '主键ID';



COMMENT ON COLUMN "public"."xhs_note_comment"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."xhs_note_comment"."nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."xhs_note_comment"."avatar" IS '用户头像';



COMMENT ON COLUMN "public"."xhs_note_comment"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."xhs_note_comment"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."xhs_note_comment"."last_modify_ts" IS '最后修改时间戳';



COMMENT ON COLUMN "public"."xhs_note_comment"."comment_id" IS '评论ID';



COMMENT ON COLUMN "public"."xhs_note_comment"."create_time" IS '创建时间戳';



COMMENT ON COLUMN "public"."xhs_note_comment"."note_id" IS '笔记ID';



COMMENT ON COLUMN "public"."xhs_note_comment"."content" IS '评论内容';



COMMENT ON COLUMN "public"."xhs_note_comment"."sub_comment_count" IS '子评论数';



COMMENT ON COLUMN "public"."xhs_note_comment"."pictures" IS '图片';



COMMENT ON COLUMN "public"."xhs_note_comment"."parent_comment_id" IS '父评论ID';



COMMENT ON COLUMN "public"."xhs_note_comment"."like_count" IS '点赞数';



CREATE SEQUENCE IF NOT EXISTS "public"."xhs_note_comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."xhs_note_comment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."xhs_note_comment_id_seq" OWNED BY "public"."xhs_note_comment"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."xhs_note_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."xhs_note_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."xhs_note_id_seq" OWNED BY "public"."xhs_note"."id";



CREATE TABLE IF NOT EXISTS "public"."zhihu_comment" (
    "id" integer NOT NULL,
    "comment_id" character varying(64),
    "parent_comment_id" character varying(64),
    "content" "text",
    "publish_time" character varying(32),
    "ip_location" "text",
    "sub_comment_count" integer,
    "like_count" integer,
    "dislike_count" integer,
    "content_id" character varying(64),
    "content_type" "text",
    "user_id" character varying(64),
    "user_link" "text",
    "user_nickname" "text",
    "user_avatar" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint
);


ALTER TABLE "public"."zhihu_comment" OWNER TO "postgres";


COMMENT ON COLUMN "public"."zhihu_comment"."id" IS '主键ID';



COMMENT ON COLUMN "public"."zhihu_comment"."comment_id" IS '评论ID';



COMMENT ON COLUMN "public"."zhihu_comment"."parent_comment_id" IS '父评论ID';



COMMENT ON COLUMN "public"."zhihu_comment"."content" IS '评论内容';



COMMENT ON COLUMN "public"."zhihu_comment"."publish_time" IS '发布时间';



COMMENT ON COLUMN "public"."zhihu_comment"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."zhihu_comment"."sub_comment_count" IS '子评论数';



COMMENT ON COLUMN "public"."zhihu_comment"."like_count" IS '点赞数';



COMMENT ON COLUMN "public"."zhihu_comment"."dislike_count" IS '点踩数';



COMMENT ON COLUMN "public"."zhihu_comment"."content_id" IS '内容ID';



COMMENT ON COLUMN "public"."zhihu_comment"."content_type" IS '内容类型';



COMMENT ON COLUMN "public"."zhihu_comment"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."zhihu_comment"."user_link" IS '用户链接';



COMMENT ON COLUMN "public"."zhihu_comment"."user_nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."zhihu_comment"."user_avatar" IS '用户头像';



COMMENT ON COLUMN "public"."zhihu_comment"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."zhihu_comment"."last_modify_ts" IS '最后修改时间戳';



CREATE SEQUENCE IF NOT EXISTS "public"."zhihu_comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."zhihu_comment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."zhihu_comment_id_seq" OWNED BY "public"."zhihu_comment"."id";



CREATE TABLE IF NOT EXISTS "public"."zhihu_content" (
    "id" integer NOT NULL,
    "content_id" character varying(64),
    "content_type" "text",
    "content_text" "text",
    "content_url" "text",
    "question_id" character varying(255),
    "title" "text",
    "desc" "text",
    "created_time" character varying(32),
    "updated_time" "text",
    "voteup_count" integer,
    "comment_count" integer,
    "source_keyword" "text",
    "user_id" character varying(255),
    "user_link" "text",
    "user_nickname" "text",
    "user_avatar" "text",
    "user_url_token" "text",
    "add_ts" bigint,
    "last_modify_ts" bigint
);


ALTER TABLE "public"."zhihu_content" OWNER TO "postgres";


COMMENT ON COLUMN "public"."zhihu_content"."id" IS '主键ID';



COMMENT ON COLUMN "public"."zhihu_content"."content_id" IS '内容ID';



COMMENT ON COLUMN "public"."zhihu_content"."content_type" IS '内容类型';



COMMENT ON COLUMN "public"."zhihu_content"."content_text" IS '内容文本';



COMMENT ON COLUMN "public"."zhihu_content"."content_url" IS '内容URL';



COMMENT ON COLUMN "public"."zhihu_content"."question_id" IS '问题ID';



COMMENT ON COLUMN "public"."zhihu_content"."title" IS '标题';



COMMENT ON COLUMN "public"."zhihu_content"."desc" IS '描述';



COMMENT ON COLUMN "public"."zhihu_content"."created_time" IS '创建时间';



COMMENT ON COLUMN "public"."zhihu_content"."updated_time" IS '更新时间';



COMMENT ON COLUMN "public"."zhihu_content"."voteup_count" IS '赞同数';



COMMENT ON COLUMN "public"."zhihu_content"."comment_count" IS '评论数';



COMMENT ON COLUMN "public"."zhihu_content"."source_keyword" IS '来源关键词';



COMMENT ON COLUMN "public"."zhihu_content"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."zhihu_content"."user_link" IS '用户链接';



COMMENT ON COLUMN "public"."zhihu_content"."user_nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."zhihu_content"."user_avatar" IS '用户头像';



COMMENT ON COLUMN "public"."zhihu_content"."user_url_token" IS '用户URL Token';



COMMENT ON COLUMN "public"."zhihu_content"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."zhihu_content"."last_modify_ts" IS '最后修改时间戳';



CREATE SEQUENCE IF NOT EXISTS "public"."zhihu_content_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."zhihu_content_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."zhihu_content_id_seq" OWNED BY "public"."zhihu_content"."id";



CREATE TABLE IF NOT EXISTS "public"."zhihu_creator" (
    "id" integer NOT NULL,
    "user_id" character varying(64),
    "user_link" "text",
    "user_nickname" "text",
    "user_avatar" "text",
    "url_token" "text",
    "gender" "text",
    "ip_location" "text",
    "follows" integer,
    "fans" integer,
    "anwser_count" integer,
    "video_count" integer,
    "question_count" integer,
    "article_count" integer,
    "column_count" integer,
    "get_voteup_count" integer,
    "add_ts" bigint,
    "last_modify_ts" bigint
);


ALTER TABLE "public"."zhihu_creator" OWNER TO "postgres";


COMMENT ON COLUMN "public"."zhihu_creator"."id" IS '主键ID';



COMMENT ON COLUMN "public"."zhihu_creator"."user_id" IS '用户ID';



COMMENT ON COLUMN "public"."zhihu_creator"."user_link" IS '用户链接';



COMMENT ON COLUMN "public"."zhihu_creator"."user_nickname" IS '用户昵称';



COMMENT ON COLUMN "public"."zhihu_creator"."user_avatar" IS '用户头像';



COMMENT ON COLUMN "public"."zhihu_creator"."url_token" IS 'URL Token';



COMMENT ON COLUMN "public"."zhihu_creator"."gender" IS '性别';



COMMENT ON COLUMN "public"."zhihu_creator"."ip_location" IS 'IP地址位置';



COMMENT ON COLUMN "public"."zhihu_creator"."follows" IS '关注数';



COMMENT ON COLUMN "public"."zhihu_creator"."fans" IS '粉丝数';



COMMENT ON COLUMN "public"."zhihu_creator"."anwser_count" IS '回答数';



COMMENT ON COLUMN "public"."zhihu_creator"."video_count" IS '视频数';



COMMENT ON COLUMN "public"."zhihu_creator"."question_count" IS '问题数';



COMMENT ON COLUMN "public"."zhihu_creator"."article_count" IS '文章数';



COMMENT ON COLUMN "public"."zhihu_creator"."column_count" IS '专栏数';



COMMENT ON COLUMN "public"."zhihu_creator"."get_voteup_count" IS '获赞数';



COMMENT ON COLUMN "public"."zhihu_creator"."add_ts" IS '添加时间戳';



COMMENT ON COLUMN "public"."zhihu_creator"."last_modify_ts" IS '最后修改时间戳';



CREATE SEQUENCE IF NOT EXISTS "public"."zhihu_creator_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."zhihu_creator_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."zhihu_creator_id_seq" OWNED BY "public"."zhihu_creator"."id";



ALTER TABLE ONLY "public"."bilibili_contact_info" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bilibili_contact_info_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bilibili_up_dynamic" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bilibili_up_dynamic_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bilibili_up_info" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bilibili_up_info_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bilibili_video" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bilibili_video_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bilibili_video_comment" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bilibili_video_comment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."douyin_aweme" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."douyin_aweme_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."douyin_aweme_comment" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."douyin_aweme_comment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."dy_creator" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."dy_creator_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."kuaishou_video" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."kuaishou_video_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."kuaishou_video_comment" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."kuaishou_video_comment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tieba_comment" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tieba_comment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tieba_creator" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tieba_creator_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tieba_note" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tieba_note_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."weibo_creator" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."weibo_creator_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."weibo_note" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."weibo_note_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."weibo_note_comment" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."weibo_note_comment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."xhs_creator" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."xhs_creator_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."xhs_note" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."xhs_note_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."xhs_note_comment" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."xhs_note_comment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."zhihu_comment" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."zhihu_comment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."zhihu_content" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."zhihu_content_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."zhihu_creator" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."zhihu_creator_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bilibili_contact_info"
    ADD CONSTRAINT "bilibili_contact_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bilibili_up_dynamic"
    ADD CONSTRAINT "bilibili_up_dynamic_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bilibili_up_info"
    ADD CONSTRAINT "bilibili_up_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bilibili_video_comment"
    ADD CONSTRAINT "bilibili_video_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bilibili_video"
    ADD CONSTRAINT "bilibili_video_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crawler_accounts"
    ADD CONSTRAINT "crawler_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."douyin_aweme_comment"
    ADD CONSTRAINT "douyin_aweme_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."douyin_aweme"
    ADD CONSTRAINT "douyin_aweme_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dy_creator"
    ADD CONSTRAINT "dy_creator_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kuaishou_video_comment"
    ADD CONSTRAINT "kuaishou_video_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kuaishou_video"
    ADD CONSTRAINT "kuaishou_video_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tieba_comment"
    ADD CONSTRAINT "tieba_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tieba_creator"
    ADD CONSTRAINT "tieba_creator_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tieba_note"
    ADD CONSTRAINT "tieba_note_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crawler_accounts"
    ADD CONSTRAINT "unique_platform_username" UNIQUE ("platform", "username");



ALTER TABLE ONLY "public"."weibo_creator"
    ADD CONSTRAINT "weibo_creator_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weibo_note_comment"
    ADD CONSTRAINT "weibo_note_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weibo_note"
    ADD CONSTRAINT "weibo_note_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xhs_creator"
    ADD CONSTRAINT "xhs_creator_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xhs_note_comment"
    ADD CONSTRAINT "xhs_note_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xhs_note"
    ADD CONSTRAINT "xhs_note_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zhihu_comment"
    ADD CONSTRAINT "zhihu_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zhihu_content"
    ADD CONSTRAINT "zhihu_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zhihu_creator"
    ADD CONSTRAINT "zhihu_creator_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_crawler_accounts_rotation" ON "public"."crawler_accounts" USING "btree" ("platform", "status", "last_used_at");



CREATE INDEX "ix_bilibili_contact_info_fan_id" ON "public"."bilibili_contact_info" USING "btree" ("fan_id");



CREATE INDEX "ix_bilibili_contact_info_up_id" ON "public"."bilibili_contact_info" USING "btree" ("up_id");



CREATE INDEX "ix_bilibili_up_dynamic_dynamic_id" ON "public"."bilibili_up_dynamic" USING "btree" ("dynamic_id");



CREATE INDEX "ix_bilibili_up_info_user_id" ON "public"."bilibili_up_info" USING "btree" ("user_id");



CREATE INDEX "ix_bilibili_video_comment_comment_id" ON "public"."bilibili_video_comment" USING "btree" ("comment_id");



CREATE INDEX "ix_bilibili_video_comment_video_id" ON "public"."bilibili_video_comment" USING "btree" ("video_id");



CREATE INDEX "ix_bilibili_video_create_time" ON "public"."bilibili_video" USING "btree" ("create_time");



CREATE INDEX "ix_bilibili_video_user_id" ON "public"."bilibili_video" USING "btree" ("user_id");



CREATE UNIQUE INDEX "ix_bilibili_video_video_id" ON "public"."bilibili_video" USING "btree" ("video_id");



CREATE INDEX "ix_douyin_aweme_aweme_id" ON "public"."douyin_aweme" USING "btree" ("aweme_id");



CREATE INDEX "ix_douyin_aweme_comment_aweme_id" ON "public"."douyin_aweme_comment" USING "btree" ("aweme_id");



CREATE INDEX "ix_douyin_aweme_comment_comment_id" ON "public"."douyin_aweme_comment" USING "btree" ("comment_id");



CREATE INDEX "ix_douyin_aweme_create_time" ON "public"."douyin_aweme" USING "btree" ("create_time");



CREATE INDEX "ix_kuaishou_video_comment_comment_id" ON "public"."kuaishou_video_comment" USING "btree" ("comment_id");



CREATE INDEX "ix_kuaishou_video_comment_video_id" ON "public"."kuaishou_video_comment" USING "btree" ("video_id");



CREATE INDEX "ix_kuaishou_video_create_time" ON "public"."kuaishou_video" USING "btree" ("create_time");



CREATE INDEX "ix_kuaishou_video_video_id" ON "public"."kuaishou_video" USING "btree" ("video_id");



CREATE INDEX "ix_tieba_comment_comment_id" ON "public"."tieba_comment" USING "btree" ("comment_id");



CREATE INDEX "ix_tieba_comment_note_id" ON "public"."tieba_comment" USING "btree" ("note_id");



CREATE INDEX "ix_tieba_comment_publish_time" ON "public"."tieba_comment" USING "btree" ("publish_time");



CREATE INDEX "ix_tieba_note_note_id" ON "public"."tieba_note" USING "btree" ("note_id");



CREATE INDEX "ix_tieba_note_publish_time" ON "public"."tieba_note" USING "btree" ("publish_time");



CREATE INDEX "ix_weibo_note_comment_comment_id" ON "public"."weibo_note_comment" USING "btree" ("comment_id");



CREATE INDEX "ix_weibo_note_comment_create_date_time" ON "public"."weibo_note_comment" USING "btree" ("create_date_time");



CREATE INDEX "ix_weibo_note_comment_note_id" ON "public"."weibo_note_comment" USING "btree" ("note_id");



CREATE INDEX "ix_weibo_note_create_date_time" ON "public"."weibo_note" USING "btree" ("create_date_time");



CREATE INDEX "ix_weibo_note_create_time" ON "public"."weibo_note" USING "btree" ("create_time");



CREATE INDEX "ix_weibo_note_note_id" ON "public"."weibo_note" USING "btree" ("note_id");



CREATE INDEX "ix_xhs_note_comment_comment_id" ON "public"."xhs_note_comment" USING "btree" ("comment_id");



CREATE INDEX "ix_xhs_note_comment_create_time" ON "public"."xhs_note_comment" USING "btree" ("create_time");



CREATE INDEX "ix_xhs_note_note_id" ON "public"."xhs_note" USING "btree" ("note_id");



CREATE INDEX "ix_xhs_note_time" ON "public"."xhs_note" USING "btree" ("time");



CREATE INDEX "ix_zhihu_comment_comment_id" ON "public"."zhihu_comment" USING "btree" ("comment_id");



CREATE INDEX "ix_zhihu_comment_content_id" ON "public"."zhihu_comment" USING "btree" ("content_id");



CREATE INDEX "ix_zhihu_comment_publish_time" ON "public"."zhihu_comment" USING "btree" ("publish_time");



CREATE INDEX "ix_zhihu_content_content_id" ON "public"."zhihu_content" USING "btree" ("content_id");



CREATE INDEX "ix_zhihu_content_created_time" ON "public"."zhihu_content" USING "btree" ("created_time");



CREATE UNIQUE INDEX "ix_zhihu_creator_user_id" ON "public"."zhihu_creator" USING "btree" ("user_id");



ALTER TABLE "public"."crawler_accounts" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."bilibili_contact_info" TO "anon";
GRANT ALL ON TABLE "public"."bilibili_contact_info" TO "authenticated";
GRANT ALL ON TABLE "public"."bilibili_contact_info" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bilibili_contact_info_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bilibili_contact_info_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bilibili_contact_info_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bilibili_up_dynamic" TO "anon";
GRANT ALL ON TABLE "public"."bilibili_up_dynamic" TO "authenticated";
GRANT ALL ON TABLE "public"."bilibili_up_dynamic" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bilibili_up_dynamic_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bilibili_up_dynamic_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bilibili_up_dynamic_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bilibili_up_info" TO "anon";
GRANT ALL ON TABLE "public"."bilibili_up_info" TO "authenticated";
GRANT ALL ON TABLE "public"."bilibili_up_info" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bilibili_up_info_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bilibili_up_info_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bilibili_up_info_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bilibili_video" TO "anon";
GRANT ALL ON TABLE "public"."bilibili_video" TO "authenticated";
GRANT ALL ON TABLE "public"."bilibili_video" TO "service_role";



GRANT ALL ON TABLE "public"."bilibili_video_comment" TO "anon";
GRANT ALL ON TABLE "public"."bilibili_video_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."bilibili_video_comment" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bilibili_video_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bilibili_video_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bilibili_video_comment_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bilibili_video_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bilibili_video_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bilibili_video_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."crawler_accounts" TO "anon";
GRANT ALL ON TABLE "public"."crawler_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."crawler_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."douyin_aweme" TO "anon";
GRANT ALL ON TABLE "public"."douyin_aweme" TO "authenticated";
GRANT ALL ON TABLE "public"."douyin_aweme" TO "service_role";



GRANT ALL ON TABLE "public"."douyin_aweme_comment" TO "anon";
GRANT ALL ON TABLE "public"."douyin_aweme_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."douyin_aweme_comment" TO "service_role";



GRANT ALL ON SEQUENCE "public"."douyin_aweme_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."douyin_aweme_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."douyin_aweme_comment_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."douyin_aweme_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."douyin_aweme_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."douyin_aweme_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dy_creator" TO "anon";
GRANT ALL ON TABLE "public"."dy_creator" TO "authenticated";
GRANT ALL ON TABLE "public"."dy_creator" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dy_creator_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dy_creator_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dy_creator_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."kuaishou_video" TO "anon";
GRANT ALL ON TABLE "public"."kuaishou_video" TO "authenticated";
GRANT ALL ON TABLE "public"."kuaishou_video" TO "service_role";



GRANT ALL ON TABLE "public"."kuaishou_video_comment" TO "anon";
GRANT ALL ON TABLE "public"."kuaishou_video_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."kuaishou_video_comment" TO "service_role";



GRANT ALL ON SEQUENCE "public"."kuaishou_video_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."kuaishou_video_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."kuaishou_video_comment_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."kuaishou_video_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."kuaishou_video_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."kuaishou_video_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tieba_comment" TO "anon";
GRANT ALL ON TABLE "public"."tieba_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."tieba_comment" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tieba_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tieba_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tieba_comment_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tieba_creator" TO "anon";
GRANT ALL ON TABLE "public"."tieba_creator" TO "authenticated";
GRANT ALL ON TABLE "public"."tieba_creator" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tieba_creator_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tieba_creator_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tieba_creator_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tieba_note" TO "anon";
GRANT ALL ON TABLE "public"."tieba_note" TO "authenticated";
GRANT ALL ON TABLE "public"."tieba_note" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tieba_note_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tieba_note_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tieba_note_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."weibo_creator" TO "anon";
GRANT ALL ON TABLE "public"."weibo_creator" TO "authenticated";
GRANT ALL ON TABLE "public"."weibo_creator" TO "service_role";



GRANT ALL ON SEQUENCE "public"."weibo_creator_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."weibo_creator_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."weibo_creator_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."weibo_note" TO "anon";
GRANT ALL ON TABLE "public"."weibo_note" TO "authenticated";
GRANT ALL ON TABLE "public"."weibo_note" TO "service_role";



GRANT ALL ON TABLE "public"."weibo_note_comment" TO "anon";
GRANT ALL ON TABLE "public"."weibo_note_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."weibo_note_comment" TO "service_role";



GRANT ALL ON SEQUENCE "public"."weibo_note_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."weibo_note_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."weibo_note_comment_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."weibo_note_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."weibo_note_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."weibo_note_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."xhs_creator" TO "anon";
GRANT ALL ON TABLE "public"."xhs_creator" TO "authenticated";
GRANT ALL ON TABLE "public"."xhs_creator" TO "service_role";



GRANT ALL ON SEQUENCE "public"."xhs_creator_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."xhs_creator_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."xhs_creator_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."xhs_note" TO "anon";
GRANT ALL ON TABLE "public"."xhs_note" TO "authenticated";
GRANT ALL ON TABLE "public"."xhs_note" TO "service_role";



GRANT ALL ON TABLE "public"."xhs_note_comment" TO "anon";
GRANT ALL ON TABLE "public"."xhs_note_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."xhs_note_comment" TO "service_role";



GRANT ALL ON SEQUENCE "public"."xhs_note_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."xhs_note_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."xhs_note_comment_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."xhs_note_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."xhs_note_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."xhs_note_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."zhihu_comment" TO "anon";
GRANT ALL ON TABLE "public"."zhihu_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."zhihu_comment" TO "service_role";



GRANT ALL ON SEQUENCE "public"."zhihu_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."zhihu_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."zhihu_comment_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."zhihu_content" TO "anon";
GRANT ALL ON TABLE "public"."zhihu_content" TO "authenticated";
GRANT ALL ON TABLE "public"."zhihu_content" TO "service_role";



GRANT ALL ON SEQUENCE "public"."zhihu_content_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."zhihu_content_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."zhihu_content_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."zhihu_creator" TO "anon";
GRANT ALL ON TABLE "public"."zhihu_creator" TO "authenticated";
GRANT ALL ON TABLE "public"."zhihu_creator" TO "service_role";



GRANT ALL ON SEQUENCE "public"."zhihu_creator_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."zhihu_creator_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."zhihu_creator_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";



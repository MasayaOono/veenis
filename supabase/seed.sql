SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '7d58c3a8-5a38-472c-bf7b-9ba313787f05', '{"action":"user_confirmation_requested","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-22 08:50:10.454178+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b7aa0b50-38ba-4d5f-b3d8-2af8445444e2', '{"action":"user_signedup","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-22 08:50:37.965746+00', ''),
	('00000000-0000-0000-0000-000000000000', '96586cb4-af6a-4eb0-b323-26e42340cf09', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-22 08:56:05.690727+00', ''),
	('00000000-0000-0000-0000-000000000000', '19910344-5954-44c3-b6e0-98c9d4bb72f5', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-22 10:14:01.66953+00', ''),
	('00000000-0000-0000-0000-000000000000', '27b6236a-66ca-457a-af75-12f8bc1e4222', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-22 10:14:01.692002+00', ''),
	('00000000-0000-0000-0000-000000000000', '267e49a3-cfed-4fc1-b4a8-60454ad179b6', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-22 14:10:39.193807+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ff68debd-5514-4823-b94a-9850273c782d', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-22 14:10:39.213957+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b7ea1405-0228-4607-b6f5-9b50603b8fa3', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-22 23:50:46.132311+00', ''),
	('00000000-0000-0000-0000-000000000000', '954fe075-3812-4490-a316-adf72beaa226', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-22 23:50:46.16215+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a6e0a7a4-1890-4d32-b806-8ace59a8161f', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-23 01:45:23.552917+00', ''),
	('00000000-0000-0000-0000-000000000000', '59396cec-f04b-4fc6-ad02-5f52d02c98e9', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-23 01:45:23.586165+00', ''),
	('00000000-0000-0000-0000-000000000000', '35f75fa4-596a-4d6d-96c5-4494252bc926', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-23 10:32:13.938277+00', ''),
	('00000000-0000-0000-0000-000000000000', '7b6afb65-c224-4c68-8332-d83acf924848', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-23 10:32:13.966391+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dd0c79dd-8ed7-46cb-9d2e-cb9a7ca3220b', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-23 23:30:48.99237+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fc796962-89f4-4b67-8cb2-a565a9c5b25d', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-23 23:30:49.027305+00', ''),
	('00000000-0000-0000-0000-000000000000', '4fcce862-46ae-48d4-8fa0-e061fb9cf958', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 00:29:08.870478+00', ''),
	('00000000-0000-0000-0000-000000000000', '86ef5c0a-782d-4631-a60f-5196d1cfbe82', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 00:29:08.882363+00', ''),
	('00000000-0000-0000-0000-000000000000', '0492a371-62c3-4083-9bcb-ec62a4944d13', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 01:27:59.360705+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d3a761a-928c-4208-9dcc-e29e11197f61', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 01:27:59.387989+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bacb4698-52a1-49c9-a7a6-d455623beef8', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 01:28:00.172709+00', ''),
	('00000000-0000-0000-0000-000000000000', '71b21112-dceb-41a6-8942-74c54c5908b0', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 02:28:07.884827+00', ''),
	('00000000-0000-0000-0000-000000000000', '015e70dd-3381-4651-84e5-90857f7ab88f', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 02:28:07.911698+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f91df9d0-798e-4101-ab35-7ddcfd918fc4', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 03:28:33.705227+00', ''),
	('00000000-0000-0000-0000-000000000000', '7a21ed21-948d-4e6f-9f99-de16d4629e8a', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 03:28:33.714247+00', ''),
	('00000000-0000-0000-0000-000000000000', '8d07f4a5-a7e4-4cd8-bc59-925265344c00', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 06:51:24.268914+00', ''),
	('00000000-0000-0000-0000-000000000000', '1aa3d97d-5322-4dcc-a47c-76b8fd691c5a', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-24 06:51:24.300113+00', ''),
	('00000000-0000-0000-0000-000000000000', '6c27a851-9378-445b-ab89-a96e4bc63202', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-24 06:58:55.315264+00', ''),
	('00000000-0000-0000-0000-000000000000', '7d78f1e9-836a-4351-b0e2-115f402c9b77', '{"action":"user_repeated_signup","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-24 07:00:43.653107+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c11b6ccd-2906-4380-81a5-871b95ab64af', '{"action":"user_repeated_signup","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-24 07:01:29.019837+00', ''),
	('00000000-0000-0000-0000-000000000000', '6a3a42fc-be75-4368-97f0-ef658ac75a11', '{"action":"user_confirmation_requested","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-08-24 07:02:38.00518+00', ''),
	('00000000-0000-0000-0000-000000000000', '292137c0-7e40-4188-bd4c-822c548c38d0', '{"action":"user_signedup","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-08-24 07:03:27.837909+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd8cf1519-1bd4-4753-b90c-8568220da81b', '{"action":"logout","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-24 07:17:56.59823+00', ''),
	('00000000-0000-0000-0000-000000000000', '95b6f049-fd26-4b54-a159-f4bc0fdef6dd', '{"action":"login","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-24 07:18:05.652909+00', ''),
	('00000000-0000-0000-0000-000000000000', '6007bf0a-217c-4a75-aeef-8d05749f4e4e', '{"action":"login","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-24 13:27:19.647861+00', ''),
	('00000000-0000-0000-0000-000000000000', '15eabe50-56d2-4486-9e09-c81f5be6b30d', '{"action":"logout","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-24 13:31:36.517061+00', ''),
	('00000000-0000-0000-0000-000000000000', '6482741b-58dd-4d77-b8eb-b4c7a481a203', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-24 13:32:45.793902+00', ''),
	('00000000-0000-0000-0000-000000000000', '523cacfa-9267-4cca-a6c8-d3fa74f46983', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-25 13:32:51.121051+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f9ad29c3-03b1-4bfb-99e4-9655c42e8b3c', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-25 13:32:51.154868+00', ''),
	('00000000-0000-0000-0000-000000000000', '1c2541df-c751-4cbb-81ab-218539b178d1', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-25 14:46:22.395421+00', ''),
	('00000000-0000-0000-0000-000000000000', '7c4201e3-0c7a-4b00-bf1b-e5c6df0b30fd', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-25 14:46:22.410602+00', ''),
	('00000000-0000-0000-0000-000000000000', '6a6b1c01-d6a3-425d-aa34-bf39837351c2', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-26 00:28:53.124817+00', ''),
	('00000000-0000-0000-0000-000000000000', '30f16a9b-39c0-4887-a49c-f9522936f5ee', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-26 00:28:53.142179+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a8587c08-68f3-44d4-a0ae-5522fa41ae1c', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-08 12:30:47.246479+00', ''),
	('00000000-0000-0000-0000-000000000000', '5a5f88e2-356f-4d04-bb6c-e6f8ce88760c', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-08 12:30:47.265064+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ee6632d5-3914-4d7e-b8ab-f78b3f04323d', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-08 12:31:13.300159+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bf74f782-07d4-450c-9858-93d8339bc97a', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-08 12:31:22.547847+00', ''),
	('00000000-0000-0000-0000-000000000000', '71a4274d-6f08-451e-abc3-5eddc4a09dc0', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-08 13:29:55.820998+00', ''),
	('00000000-0000-0000-0000-000000000000', '2243ed79-01a3-482c-a9d1-bdb3b9b0908b', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-08 13:29:55.835862+00', ''),
	('00000000-0000-0000-0000-000000000000', '96f64fcd-476f-49ff-bd83-a7ff72ded423', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-08 13:31:05.015865+00', ''),
	('00000000-0000-0000-0000-000000000000', '49c1ee3d-0dbe-406b-b5d8-198197805362', '{"action":"login","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-08 13:36:19.542639+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f9a024c7-cc0a-4992-bb02-04771e039879', '{"action":"logout","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-08 13:36:33.870434+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c16678fc-1a1d-43c0-ad27-f47e0a2c2154', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-08 13:36:44.701254+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e21e5a20-0e72-47b5-8068-cfa2299faf62', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-08 13:53:30.491463+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a67d48f3-44f4-4262-86fe-eab4873c3496', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-08 13:53:59.983807+00', ''),
	('00000000-0000-0000-0000-000000000000', '05092e74-45f0-4159-8614-d7ae566c5af2', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 02:03:41.282018+00', ''),
	('00000000-0000-0000-0000-000000000000', '318fa5c2-2d25-425c-aafb-e7fbc7e68d78', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 02:03:41.30606+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a5919504-d2a3-4a80-a74f-3d7678a2d0e7', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-09 02:13:46.663439+00', ''),
	('00000000-0000-0000-0000-000000000000', '998f9120-ee5b-4386-859f-b2afec8a0ae5', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 02:14:05.324205+00', ''),
	('00000000-0000-0000-0000-000000000000', '069f190d-ce3e-4ff7-8e49-5055bb76e66c', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-09 02:38:01.956768+00', ''),
	('00000000-0000-0000-0000-000000000000', '65f75263-d666-47fd-97ff-cda076f70a84', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-09 02:38:49.507291+00', ''),
	('00000000-0000-0000-0000-000000000000', '9e742467-5ee5-4e65-a086-a256e813ddf3', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 03:58:29.426688+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e1b8a232-de8e-4347-a9ca-b8d76921ec00', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 03:58:29.452606+00', ''),
	('00000000-0000-0000-0000-000000000000', '7bf9b6ab-5566-4211-a00b-65bf1473d73f', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 04:56:55.440883+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e28d3371-782f-4a56-8256-d166915fe97f', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 04:56:55.453812+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bf77cd36-dd78-4a25-b48c-167d77be952f', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 08:25:51.463895+00', ''),
	('00000000-0000-0000-0000-000000000000', 'eb23922a-5de0-429c-9652-6fcb2c827d17', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 08:25:51.485274+00', ''),
	('00000000-0000-0000-0000-000000000000', '2c435ac4-6521-420b-81c4-a3e6bbbd2337', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 11:18:11.302238+00', ''),
	('00000000-0000-0000-0000-000000000000', '82448824-1a0d-4bdf-bb3e-2fc04867a607', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 11:18:11.314426+00', ''),
	('00000000-0000-0000-0000-000000000000', 'caafd9db-e0ef-499d-a3c0-65248dd0fa96', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 14:48:42.488738+00', ''),
	('00000000-0000-0000-0000-000000000000', '49c567d0-34f6-4bde-93ea-94d6efedf0c8', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-09 14:48:42.502617+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de25cca1-4a3c-418b-883d-04a6a9eac7fc', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-09 15:13:29.240066+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ddc33331-3c9d-4412-b9e4-ea452d2fbccb', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-11 00:05:42.84698+00', ''),
	('00000000-0000-0000-0000-000000000000', '5cf3c182-7095-4221-ba56-303c92528476', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 01:32:51.947643+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b95d649f-b2ce-44f1-b979-cf91b8177680', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-11 01:32:51.970909+00', ''),
	('00000000-0000-0000-0000-000000000000', '25a8427a-2fc2-48a2-a87e-2359c808c8e7', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-12 09:30:05.674931+00', ''),
	('00000000-0000-0000-0000-000000000000', '88b1adab-e9c6-4d6c-b540-267dd6f3655f', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-12 09:30:05.701609+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b38d4b2b-1aa6-439e-be71-f3a19be971a3', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-13 12:54:44.900335+00', ''),
	('00000000-0000-0000-0000-000000000000', '2631db08-14de-4c60-80ac-ae401b4be805', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-13 14:01:05.089392+00', ''),
	('00000000-0000-0000-0000-000000000000', '91b586ee-6504-458e-92c3-4bda17dd608a', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-13 14:01:05.105624+00', ''),
	('00000000-0000-0000-0000-000000000000', '78332f34-16e1-497c-a836-7719d10fc414', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-14 00:36:33.073353+00', ''),
	('00000000-0000-0000-0000-000000000000', 'edfb8382-b8ec-4da8-b53f-8a8b2c25b893', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-14 00:36:33.102803+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dd1cff04-2de6-441c-9e30-3173fb3d3f7c', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-14 02:23:21.087632+00', ''),
	('00000000-0000-0000-0000-000000000000', '6cd515bd-38b7-403f-ab92-74bad832ca1c', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-14 02:23:21.110984+00', ''),
	('00000000-0000-0000-0000-000000000000', '25b98dc7-dd53-47a8-830b-ab9bf031fe1c', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-14 03:32:19.524733+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cc242678-a9d5-42e1-a65c-a34b3ac5f998', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-14 03:32:19.540858+00', ''),
	('00000000-0000-0000-0000-000000000000', '95fb62c3-2da3-42b6-9c50-ea0d298e308e', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-14 07:15:02.869223+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de64af3e-0c3f-42a9-8b78-dca7a1466487', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-14 07:15:02.891756+00', ''),
	('00000000-0000-0000-0000-000000000000', '22a51666-3a21-48d3-b5e4-098c3f424181', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-14 07:33:12.436775+00', ''),
	('00000000-0000-0000-0000-000000000000', '34915ee5-41fe-4f66-a036-71d10bc2c12f', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-14 07:33:27.367564+00', ''),
	('00000000-0000-0000-0000-000000000000', '8f2c0f83-b184-4eaa-8c80-9d24971989eb', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-14 08:35:52.526897+00', ''),
	('00000000-0000-0000-0000-000000000000', '3aa4a9fc-ad0b-49f0-b3a3-caf07ef3d485', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-14 08:35:52.554954+00', ''),
	('00000000-0000-0000-0000-000000000000', '23fe2d56-29d8-4277-a45e-496dfb2eaecc', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 00:32:57.420329+00', ''),
	('00000000-0000-0000-0000-000000000000', '7f201882-f775-4cd5-ae2c-4410283c4e28', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 00:32:57.433951+00', ''),
	('00000000-0000-0000-0000-000000000000', '938b671e-8488-462a-8f37-3dd917eda750', '{"action":"login","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-16 00:33:33.832776+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fd240613-53a8-460d-9a9b-137bbef6856c', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 01:32:21.290633+00', ''),
	('00000000-0000-0000-0000-000000000000', '06eb8b16-5741-4525-8e12-5eccdfaf728d', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 01:32:21.311029+00', ''),
	('00000000-0000-0000-0000-000000000000', '3f9b70f4-530d-4e3c-b103-326a8cc0425c', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 02:09:27.5802+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e5292bb9-c7ff-42da-b7cd-a02c7187a3f5', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 02:09:27.609556+00', ''),
	('00000000-0000-0000-0000-000000000000', '703d862d-950b-480a-b3cd-43eb01fa012f', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 02:32:04.274529+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd0c9b02a-b694-4d43-9489-7463910dc272', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 02:32:04.288652+00', ''),
	('00000000-0000-0000-0000-000000000000', '21c04fc9-63b3-405c-82a2-5556f88ae2f4', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 03:07:36.661162+00', ''),
	('00000000-0000-0000-0000-000000000000', '0baed31b-b077-4be3-9a95-c688f68b3124', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 03:07:36.680913+00', ''),
	('00000000-0000-0000-0000-000000000000', 'daa06b92-bf8f-4bc7-8058-4c4d2c1b307e', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 04:14:45.330359+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f0da8d3a-ac20-4cab-bbef-092b6fb3eea7', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 04:14:45.355893+00', ''),
	('00000000-0000-0000-0000-000000000000', '10f7f760-1b9e-46ff-a4c7-ef6774e060a9', '{"action":"logout","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-16 04:16:48.255014+00', ''),
	('00000000-0000-0000-0000-000000000000', '0a221aa1-d051-460c-a6bf-b8152d66d21e', '{"action":"user_confirmation_requested","actor_id":"8560bb8b-9324-4a0c-8b2b-ed518da7c0f1","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 04:18:19.430966+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ff4ad6e4-dd7a-4ebe-a4a2-5a2f109a249c', '{"action":"user_signedup","actor_id":"8560bb8b-9324-4a0c-8b2b-ed518da7c0f1","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-16 04:18:41.347978+00', ''),
	('00000000-0000-0000-0000-000000000000', '360205b0-866e-41f0-9873-2e2b849ef933', '{"action":"logout","actor_id":"8560bb8b-9324-4a0c-8b2b-ed518da7c0f1","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-16 04:25:09.945283+00', ''),
	('00000000-0000-0000-0000-000000000000', '33904e59-bb11-4988-935c-6c4182d9faa4', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-16 04:25:39.097178+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b3714e49-6ce2-4cc8-89d4-7ad9f5eb2986', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"masaya.quest.academia@gmail.com","user_id":"8560bb8b-9324-4a0c-8b2b-ed518da7c0f1","user_phone":""}}', '2025-09-16 04:47:51.953342+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd2345a3b-4609-497d-8274-0f167b2216f5', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-16 04:47:59.853383+00', ''),
	('00000000-0000-0000-0000-000000000000', '6c5c3afc-8177-4eb5-920d-61d82b945cda', '{"action":"user_confirmation_requested","actor_id":"08d0ae6e-4f52-4f24-9153-29a1d880021a","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 04:48:20.604816+00', ''),
	('00000000-0000-0000-0000-000000000000', '800f037d-5eef-42bd-9024-8d096dfdd848', '{"action":"user_signedup","actor_id":"08d0ae6e-4f52-4f24-9153-29a1d880021a","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-16 04:48:43.532827+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bfbe2767-2960-4069-93ce-2adf3e12b680', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"masaya.quest.academia@gmail.com","user_id":"08d0ae6e-4f52-4f24-9153-29a1d880021a","user_phone":""}}', '2025-09-16 05:08:18.646614+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fd492eb8-464e-40fd-968e-3d57f15da7dd', '{"action":"user_confirmation_requested","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 05:08:28.455468+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f46b7531-9ca8-45f3-9b4f-5c911d017b9e', '{"action":"user_signedup","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-16 05:08:39.142713+00', ''),
	('00000000-0000-0000-0000-000000000000', '6531ac38-2ac7-48fd-80e5-5ed1f38b2bca', '{"action":"token_refreshed","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 07:20:07.516359+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a4bf1d24-7882-46ca-8be4-a287b54ab914', '{"action":"token_revoked","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 07:20:07.540457+00', ''),
	('00000000-0000-0000-0000-000000000000', '90693ab6-5a0e-4b5f-bb73-f2157a7416c5', '{"action":"logout","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-16 07:45:42.161241+00', ''),
	('00000000-0000-0000-0000-000000000000', 'db70869d-6bfc-4c3a-8f67-cd65f896c539', '{"action":"user_repeated_signup","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 07:46:13.30262+00', ''),
	('00000000-0000-0000-0000-000000000000', '8d85ce54-c079-4eae-a0c7-5231cef45ecf', '{"action":"user_repeated_signup","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 07:46:41.712718+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a997fe25-97a6-4fa5-ab4e-3c19422897ce', '{"action":"user_repeated_signup","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 07:47:40.666146+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a2ec7f64-7b12-4195-9600-09d7b4e45ba4', '{"action":"user_repeated_signup","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 07:49:20.995211+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dc42f048-1efc-4d79-898a-ad02c75657d7', '{"action":"user_repeated_signup","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 07:49:40.228244+00', ''),
	('00000000-0000-0000-0000-000000000000', '5c65a79f-bfbd-4432-ac1b-889e7fc19d0f', '{"action":"user_confirmation_requested","actor_id":"224f3e9f-9e11-42b4-8583-00b418549a04","actor_username":"ohno2404@softbank.ne.jp","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 07:50:07.055944+00', ''),
	('00000000-0000-0000-0000-000000000000', '1975e1bc-378c-4449-a38c-6b043eefda4c', '{"action":"user_repeated_signup","actor_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 07:50:51.58018+00', ''),
	('00000000-0000-0000-0000-000000000000', '6caade9e-a4a5-465a-bb30-be2db5e9aaf8', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"ohno2404@softbank.ne.jp","user_id":"224f3e9f-9e11-42b4-8583-00b418549a04","user_phone":""}}', '2025-09-16 07:51:01.225632+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aa3c7b64-79b6-4220-8bbf-d3093fda3900', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"masaya.quest.academia@gmail.com","user_id":"b5ebbf79-7149-4ccf-88fb-39110ebd3f53","user_phone":""}}', '2025-09-16 07:51:01.245681+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e39b5d37-c9ee-44c5-8e52-dd259823d678', '{"action":"user_confirmation_requested","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-09-16 07:51:23.761623+00', ''),
	('00000000-0000-0000-0000-000000000000', '0d4f2a27-10e6-4dd8-989e-8453ac94d9c0', '{"action":"user_signedup","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-16 07:51:41.06316+00', ''),
	('00000000-0000-0000-0000-000000000000', '3db5f817-3c8d-4c3e-9cde-4ccd72378e4d', '{"action":"logout","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-16 07:58:15.235188+00', ''),
	('00000000-0000-0000-0000-000000000000', '02cc8569-fcc4-4a1c-8785-13e6f6f5f39e', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-16 07:58:23.652095+00', ''),
	('00000000-0000-0000-0000-000000000000', '14442d2a-b0cd-433b-9ed0-dd3fbe025144', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-16 08:42:47.772513+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c28804bb-4450-47bd-b67c-cc8f3ab153d2', '{"action":"login","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-16 08:44:10.51601+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e9f0e0d5-7965-43ce-ad8c-90952c6ae16e', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-16 12:22:49.540912+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e66ff872-b276-4363-9658-eb43bd5b7514', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-16 12:43:04.665955+00', ''),
	('00000000-0000-0000-0000-000000000000', '83a560a1-bcd6-4457-a15c-d1b2e9b17fe8', '{"action":"login","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-16 12:43:25.775514+00', ''),
	('00000000-0000-0000-0000-000000000000', 'abe3f276-0503-4a65-bdbb-6bd8272d85ca', '{"action":"token_refreshed","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 13:06:47.916621+00', ''),
	('00000000-0000-0000-0000-000000000000', '66461bd9-7615-4c69-a189-bc0810a9d1f8', '{"action":"token_revoked","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 13:06:47.938216+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f0aec280-da18-40e2-a80e-125f85a56e7b', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-16 13:38:12.289375+00', ''),
	('00000000-0000-0000-0000-000000000000', '3f6b9a07-2335-4a07-b600-b4101d082654', '{"action":"token_refreshed","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 14:17:28.806103+00', ''),
	('00000000-0000-0000-0000-000000000000', '35b5fa5d-fa4f-47b1-9975-192304acae76', '{"action":"token_revoked","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 14:17:28.823506+00', ''),
	('00000000-0000-0000-0000-000000000000', '67f23d2d-211a-4d50-98bc-37eb4f7a1a3d', '{"action":"logout","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-16 14:18:19.924396+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a492f9d1-8342-414e-a5a6-2d2927988174', '{"action":"login","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-16 14:18:36.247155+00', ''),
	('00000000-0000-0000-0000-000000000000', '3857c48a-4ec0-4992-b4d9-6c8f9df04ff1', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 14:23:25.1337+00', ''),
	('00000000-0000-0000-0000-000000000000', '11c33523-2002-4ab2-82b0-0731848dc2ca', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-16 14:23:25.151379+00', ''),
	('00000000-0000-0000-0000-000000000000', '49948c3f-dbfc-4397-9c1a-b776fd6d2ac4', '{"action":"logout","actor_id":"c569e6d5-5a78-49d9-8398-4c008f7faa8f","actor_username":"masaya.quest.academia@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-16 14:23:29.825081+00', ''),
	('00000000-0000-0000-0000-000000000000', '6354f486-4c61-42e5-a6b8-c98f3438425d', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-16 14:23:41.081649+00', ''),
	('00000000-0000-0000-0000-000000000000', '9574a7db-d6bd-4a3b-86b2-fba85011ce92', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 00:35:02.480913+00', ''),
	('00000000-0000-0000-0000-000000000000', '2c1a30e9-dbf4-4bb3-bfa8-936793576873', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 00:35:02.506227+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b996f33d-f34c-4b88-ad7c-5039f439f4d1', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 01:33:37.853147+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a30d6c17-0338-41c4-9476-c0dee81faa54', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 01:33:37.871459+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bab26bb1-7f50-43a2-9d09-17026c99a049', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 02:31:44.949817+00', ''),
	('00000000-0000-0000-0000-000000000000', '006797f6-315a-4f98-ad90-1c2c74d5a78e', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 02:31:44.96841+00', ''),
	('00000000-0000-0000-0000-000000000000', '898fef7e-17b0-4d3e-bcc4-359831eed159', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 03:58:57.1132+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ac8d88e7-5b50-4145-a3f6-9b5a83a78cc8', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 03:58:57.134359+00', ''),
	('00000000-0000-0000-0000-000000000000', '715391f5-e280-45ac-84d0-50f570e09364', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 05:37:40.624579+00', ''),
	('00000000-0000-0000-0000-000000000000', '44f694f1-48c5-4d82-aff7-36902692e3cb', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 05:37:40.649925+00', ''),
	('00000000-0000-0000-0000-000000000000', '43ad9de7-3692-414e-a93d-4d53f97b1c7a', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 06:27:29.242285+00', ''),
	('00000000-0000-0000-0000-000000000000', '21fad24e-4d3a-45d1-84f5-123be9222fe7', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 06:27:29.262921+00', ''),
	('00000000-0000-0000-0000-000000000000', '88d7312d-7150-4e97-b578-9f9a44f267fa', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 07:26:16.906836+00', ''),
	('00000000-0000-0000-0000-000000000000', '9d25d45c-ddd8-4ece-a9a2-f0d1ec752271', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 07:26:16.929938+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bd64dcd9-5d21-4c26-80f7-6736fc87507a', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 08:25:07.546284+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f205576-5641-42a9-ba45-2f2c5b15d59a', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 08:25:07.564859+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd960a236-a06b-46cf-8eb9-6f57d91d0526', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 08:29:48.044944+00', ''),
	('00000000-0000-0000-0000-000000000000', '4338f37c-7fa6-4f25-8b21-4e1035976398', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 08:29:48.046565+00', ''),
	('00000000-0000-0000-0000-000000000000', '48279c12-72a7-47b2-864b-7e533ecd28d5', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 10:11:38.414268+00', ''),
	('00000000-0000-0000-0000-000000000000', '8de07b49-f7ce-4f28-9d8c-1853dc1f16fe', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 10:11:38.437595+00', ''),
	('00000000-0000-0000-0000-000000000000', '47c165d0-42cf-4b31-9051-cc09c2f00f04', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 13:34:31.589049+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd4b35199-8c1d-42c9-9198-c6dbe045f3a5', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 13:34:31.60383+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b310db9d-9388-4ead-82c0-3882d8aaf3b9', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 14:43:32.793695+00', ''),
	('00000000-0000-0000-0000-000000000000', '9b11babf-04f6-49c1-b23c-8d59936ca49d', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 14:43:32.807602+00', ''),
	('00000000-0000-0000-0000-000000000000', '6174501e-58d9-4f7c-b8b1-9844ff5cdb0c', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 23:18:16.682777+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ce176067-c3b5-4043-9e4e-683b3cde1445', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 23:18:16.705536+00', ''),
	('00000000-0000-0000-0000-000000000000', '56ef7fb3-dde9-4518-8eff-1abbda0e3f3c', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 23:25:22.145633+00', ''),
	('00000000-0000-0000-0000-000000000000', '7f76be1b-bc27-4980-b460-0a7f55b7dcc4', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-17 23:25:22.151238+00', ''),
	('00000000-0000-0000-0000-000000000000', '5b00cc46-9409-4aeb-a648-8e0648d90271', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 00:26:06.710261+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e1cca0a2-a36b-40ca-8a7c-f8dbb616930a', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 00:26:06.732805+00', ''),
	('00000000-0000-0000-0000-000000000000', '62a38b68-5138-45ed-ad5b-a2f68bf1f15b', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 00:27:04.920228+00', ''),
	('00000000-0000-0000-0000-000000000000', '169472f6-0ab0-416a-983b-a703d38491a2', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 00:27:04.920882+00', ''),
	('00000000-0000-0000-0000-000000000000', '7adc8866-aab4-4e62-819f-5229bd333918', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 01:45:44.697669+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd89b2d1c-402d-4f8f-89db-659632e03178', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 01:45:44.718438+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af02a9b9-d46f-407d-bc20-fa01aa47f345', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 03:18:39.58482+00', ''),
	('00000000-0000-0000-0000-000000000000', 'def7b171-dea9-4cd4-b39d-0c3da8e1fc36', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 03:18:39.608115+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ad63c455-11ea-458f-b75d-197504fec811', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 07:56:59.94586+00', ''),
	('00000000-0000-0000-0000-000000000000', '91d8fd46-8153-4f28-9bcc-e3e60c3d4e51', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 07:56:59.970027+00', ''),
	('00000000-0000-0000-0000-000000000000', '147af440-e71a-41af-b7f1-fc0c4ca59348', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 12:15:37.960625+00', ''),
	('00000000-0000-0000-0000-000000000000', '43d51115-db52-4ee6-bd02-45b18f1873a6', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 12:15:37.984012+00', ''),
	('00000000-0000-0000-0000-000000000000', '5707b30e-f442-430f-9f93-332f14b953ea', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 12:19:09.503016+00', ''),
	('00000000-0000-0000-0000-000000000000', '49e4b789-9e7a-4f25-b67a-0cb610d7b058', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 12:19:09.504158+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fbc1268f-6fc9-4fca-a4d5-03212c22dcf7', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 23:54:31.828856+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f97b100b-38a3-4621-a688-2938cc7835e9', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 23:54:31.861691+00', ''),
	('00000000-0000-0000-0000-000000000000', '6d9a08fd-b850-4572-a54e-d36b7c6a4660', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 23:59:13.976479+00', ''),
	('00000000-0000-0000-0000-000000000000', '2448b464-f1ef-4c26-98c9-ace60ce8c674', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-18 23:59:13.980052+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b28c7074-1447-4ac1-84e4-a56f60fdfae3', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 10:18:13.69064+00', ''),
	('00000000-0000-0000-0000-000000000000', '8b9565af-3142-4fe2-9bb6-b310f164128a', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 10:18:13.719777+00', ''),
	('00000000-0000-0000-0000-000000000000', '9035d981-ae71-4553-93f7-00f6b3c558a5', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 11:17:22.837267+00', ''),
	('00000000-0000-0000-0000-000000000000', '1304b138-9be8-474b-b3e6-568a19bf6ad3', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 11:17:22.853905+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f52777b9-196a-4be9-adf2-66a97bd576a9', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 12:04:11.07491+00', ''),
	('00000000-0000-0000-0000-000000000000', '1e603c12-1b3c-4293-b2d4-56a1790193e8', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 12:04:11.104889+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e09ce150-3b58-4033-aa12-af470368ae8f', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 12:20:40.350181+00', ''),
	('00000000-0000-0000-0000-000000000000', '995e721f-f85d-45e5-9da6-f9830e419576', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 12:20:40.360745+00', ''),
	('00000000-0000-0000-0000-000000000000', '808a1893-c4f9-451f-9e72-2da96289fd6c', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 14:12:39.411043+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de38fc44-6039-43e5-b444-3eb447560588', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 14:12:39.435061+00', ''),
	('00000000-0000-0000-0000-000000000000', '3bc6a10b-5f5f-405c-ab79-762f9853b254', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 14:15:36.157177+00', ''),
	('00000000-0000-0000-0000-000000000000', '47a95a68-fb66-48f8-b5e3-865437c4ca5d', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-19 14:15:36.175804+00', ''),
	('00000000-0000-0000-0000-000000000000', '167a2180-c967-42ca-9976-c608d1b146bd', '{"action":"token_refreshed","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-21 08:16:46.573359+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c817b5b3-0f84-4af9-a372-c0cbe40c80c2', '{"action":"token_revoked","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-21 08:16:46.599163+00', ''),
	('00000000-0000-0000-0000-000000000000', '60738c7c-d884-4f42-8bbd-7c8768528d3e', '{"action":"token_refreshed","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-21 08:37:23.634304+00', ''),
	('00000000-0000-0000-0000-000000000000', '53f362da-3b7b-4e60-b9da-aba5557c834d', '{"action":"token_revoked","actor_id":"651bb299-cd7d-480e-b3bf-d6776befdf07","actor_username":"m.ohno2404@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-09-21 08:37:23.651808+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a63e3364-a108-4441-8ec2-584394ae5dd1', '{"action":"logout","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-09-21 08:51:52.391305+00', ''),
	('00000000-0000-0000-0000-000000000000', '784807ec-611e-4e70-ae63-c03b372805ec', '{"action":"login","actor_id":"c8e35e92-7f66-4425-b5c0-2e2291b4bad3","actor_username":"ohnomasaya2404@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-21 08:53:43.794094+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'c569e6d5-5a78-49d9-8398-4c008f7faa8f', 'authenticated', 'authenticated', 'masaya.quest.academia@gmail.com', '$2a$10$J2.muy5wX69bQrFxZLXTVO2P7OnDrTHluihJtDCNfXhh/z1Qib9Re', '2025-09-16 07:51:41.064604+00', NULL, '', '2025-09-16 07:51:23.762829+00', '', NULL, '', '', NULL, '2025-09-16 14:18:36.248238+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "c569e6d5-5a78-49d9-8398-4c008f7faa8f", "email": "masaya.quest.academia@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-09-16 07:51:23.750258+00', '2025-09-16 14:18:36.257039+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '651bb299-cd7d-480e-b3bf-d6776befdf07', 'authenticated', 'authenticated', 'm.ohno2404@gmail.com', '$2a$10$PBKcHieiqv136Hvaf7Z.d.fAS19weqwoKnDpbQcDkWP0BdGiXwbMe', '2025-08-24 07:03:27.838901+00', NULL, '', '2025-08-24 07:02:38.007375+00', '', NULL, '', '', NULL, '2025-09-16 12:43:25.785941+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "651bb299-cd7d-480e-b3bf-d6776befdf07", "email": "m.ohno2404@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-08-24 07:02:37.940107+00', '2025-09-21 08:37:23.669157+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'authenticated', 'authenticated', 'ohnomasaya2404@gmail.com', '$2a$10$1HS0OHq7fxnRBv9VrDsoeelrCn1uii2MfowxTe/rg1YBPq2DgZM6u', '2025-08-22 08:50:37.968739+00', NULL, '', '2025-08-22 08:50:10.465319+00', '', NULL, '', '', NULL, '2025-09-21 08:53:43.80672+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "c8e35e92-7f66-4425-b5c0-2e2291b4bad3", "email": "ohnomasaya2404@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-08-22 08:50:10.369646+00', '2025-09-21 08:53:43.840271+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '{"sub": "c8e35e92-7f66-4425-b5c0-2e2291b4bad3", "email": "ohnomasaya2404@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2025-08-22 08:50:10.434753+00', '2025-08-22 08:50:10.434821+00', '2025-08-22 08:50:10.434821+00', 'f800c0f1-68a6-4633-b7f6-b707cd761850'),
	('651bb299-cd7d-480e-b3bf-d6776befdf07', '651bb299-cd7d-480e-b3bf-d6776befdf07', '{"sub": "651bb299-cd7d-480e-b3bf-d6776befdf07", "email": "m.ohno2404@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2025-08-24 07:02:37.98356+00', '2025-08-24 07:02:37.983621+00', '2025-08-24 07:02:37.983621+00', 'dc610e74-9d42-48d7-841c-77f0bf801b95'),
	('c569e6d5-5a78-49d9-8398-4c008f7faa8f', 'c569e6d5-5a78-49d9-8398-4c008f7faa8f', '{"sub": "c569e6d5-5a78-49d9-8398-4c008f7faa8f", "email": "masaya.quest.academia@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2025-09-16 07:51:23.758806+00', '2025-09-16 07:51:23.758873+00', '2025-09-16 07:51:23.758873+00', 'fad231ec-da44-48b2-8eec-3f7604d4e2c9');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('556125f3-a924-4e91-af7f-ade9b744e503', '651bb299-cd7d-480e-b3bf-d6776befdf07', '2025-09-16 12:43:25.78603+00', '2025-09-21 08:37:23.677819+00', NULL, 'aal1', NULL, '2025-09-21 08:37:23.677262', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '153.242.176.134', NULL),
	('75f72fb6-0eea-4340-b22f-9716c697c8c7', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '2025-09-21 08:53:43.807766+00', '2025-09-21 08:53:43.807766+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '153.242.176.134', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('556125f3-a924-4e91-af7f-ade9b744e503', '2025-09-16 12:43:25.812896+00', '2025-09-16 12:43:25.812896+00', 'password', '3dd16df3-ef10-4e4c-b229-9f712c1d3b60'),
	('75f72fb6-0eea-4340-b22f-9716c697c8c7', '2025-09-21 08:53:43.845528+00', '2025-09-21 08:53:43.845528+00', 'password', '0017bd02-04fa-4276-b685-3069e4aca305');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 76, 'jlpabes3jhgs', '651bb299-cd7d-480e-b3bf-d6776befdf07', true, '2025-09-17 08:29:48.048048+00', '2025-09-17 13:34:31.606374+00', 'r2rorbc6zwoc', '556125f3-a924-4e91-af7f-ade9b744e503'),
	('00000000-0000-0000-0000-000000000000', 78, 'jygts3vuvjlg', '651bb299-cd7d-480e-b3bf-d6776befdf07', true, '2025-09-17 13:34:31.624026+00', '2025-09-17 23:18:16.707473+00', 'jlpabes3jhgs', '556125f3-a924-4e91-af7f-ade9b744e503'),
	('00000000-0000-0000-0000-000000000000', 80, 'hislfaesrr2g', '651bb299-cd7d-480e-b3bf-d6776befdf07', true, '2025-09-17 23:18:16.734+00', '2025-09-18 00:27:04.92146+00', 'jygts3vuvjlg', '556125f3-a924-4e91-af7f-ade9b744e503'),
	('00000000-0000-0000-0000-000000000000', 83, 'ff4clhimyb4q', '651bb299-cd7d-480e-b3bf-d6776befdf07', true, '2025-09-18 00:27:04.922452+00', '2025-09-18 12:19:09.505519+00', 'hislfaesrr2g', '556125f3-a924-4e91-af7f-ade9b744e503'),
	('00000000-0000-0000-0000-000000000000', 88, 'qdqv46f634sb', '651bb299-cd7d-480e-b3bf-d6776befdf07', true, '2025-09-18 12:19:09.506897+00', '2025-09-18 23:59:13.980697+00', 'ff4clhimyb4q', '556125f3-a924-4e91-af7f-ade9b744e503'),
	('00000000-0000-0000-0000-000000000000', 90, '4dvjynwcwg3i', '651bb299-cd7d-480e-b3bf-d6776befdf07', true, '2025-09-18 23:59:13.983083+00', '2025-09-19 12:04:11.107025+00', 'qdqv46f634sb', '556125f3-a924-4e91-af7f-ade9b744e503'),
	('00000000-0000-0000-0000-000000000000', 61, 'qfgiurxmlw75', '651bb299-cd7d-480e-b3bf-d6776befdf07', true, '2025-09-16 12:43:25.793197+00', '2025-09-16 14:23:25.152616+00', NULL, '556125f3-a924-4e91-af7f-ade9b744e503'),
	('00000000-0000-0000-0000-000000000000', 93, 'qtug6oqyfias', '651bb299-cd7d-480e-b3bf-d6776befdf07', true, '2025-09-19 12:04:11.135447+00', '2025-09-19 14:15:36.177192+00', '4dvjynwcwg3i', '556125f3-a924-4e91-af7f-ade9b744e503'),
	('00000000-0000-0000-0000-000000000000', 96, '5cji3qgzknze', '651bb299-cd7d-480e-b3bf-d6776befdf07', true, '2025-09-19 14:15:36.193753+00', '2025-09-21 08:37:23.65306+00', 'qtug6oqyfias', '556125f3-a924-4e91-af7f-ade9b744e503'),
	('00000000-0000-0000-0000-000000000000', 98, '54dntnyaiu47', '651bb299-cd7d-480e-b3bf-d6776befdf07', false, '2025-09-21 08:37:23.66038+00', '2025-09-21 08:37:23.66038+00', '5cji3qgzknze', '556125f3-a924-4e91-af7f-ade9b744e503'),
	('00000000-0000-0000-0000-000000000000', 99, 'cuxgmwzl3i5m', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', false, '2025-09-21 08:53:43.822107+00', '2025-09-21 08:53:43.822107+00', NULL, '75f72fb6-0eea-4340-b22f-9716c697c8c7'),
	('00000000-0000-0000-0000-000000000000', 66, 'r2rorbc6zwoc', '651bb299-cd7d-480e-b3bf-d6776befdf07', true, '2025-09-16 14:23:25.164318+00', '2025-09-17 08:29:48.04719+00', 'qfgiurxmlw75', '556125f3-a924-4e91-af7f-ade9b744e503');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."groups" ("id", "name", "owner_id", "invite_token", "created_at") VALUES
	('cfe96853-9d12-4748-a62c-cd21be49e935', 'sample1', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', NULL, '2025-09-08 14:12:22.053912+00'),
	('ea157d5c-898c-4ce0-bb6b-a68410585796', 'ただ駄々', '651bb299-cd7d-480e-b3bf-d6776befdf07', NULL, '2025-09-16 00:35:59.657423+00'),
	('66dccb70-230c-4366-8a72-2512e85f068c', 'test1', 'c569e6d5-5a78-49d9-8398-4c008f7faa8f', NULL, '2025-09-16 08:48:11.311994+00'),
	('bd590021-cec7-46d5-9bc1-77ef1d94d823', 'ささ', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', NULL, '2025-09-21 08:39:41.613836+00'),
	('3c651ffc-4b79-409e-aebd-a25c905cde36', 'ららら', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', NULL, '2025-09-21 08:39:53.515+00');


--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."group_members" ("group_id", "user_id", "role", "created_at") VALUES
	('cfe96853-9d12-4748-a62c-cd21be49e935', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'owner', '2025-09-08 14:12:22.053912+00'),
	('ea157d5c-898c-4ce0-bb6b-a68410585796', '651bb299-cd7d-480e-b3bf-d6776befdf07', 'owner', '2025-09-16 00:35:59.657423+00'),
	('66dccb70-230c-4366-8a72-2512e85f068c', 'c569e6d5-5a78-49d9-8398-4c008f7faa8f', 'owner', '2025-09-16 08:48:11.311994+00'),
	('bd590021-cec7-46d5-9bc1-77ef1d94d823', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'owner', '2025-09-21 08:39:41.613836+00'),
	('3c651ffc-4b79-409e-aebd-a25c905cde36', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'owner', '2025-09-21 08:39:53.515+00');


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."posts" ("id", "author_id", "title", "slug", "body_md", "cover_image_url", "visibility", "link_token", "group_id", "is_published", "read_minutes", "published_at", "created_at", "updated_at") VALUES
	('deec76f9-b791-4170-8559-c7832eae362d', '651bb299-cd7d-480e-b3bf-d6776befdf07', 'サザビー', 'サザビー', '# dsdsdsds

## dsds

![](https://zylkbsmbxctfdwatifxi.supabase.co/storage/v1/object/public/public-images/651bb299-cd7d-480e-b3bf-d6776befdf07/1756042079801-ckpke3kkwqa.png)', NULL, 'draft', NULL, NULL, false, 1, NULL, '2025-08-24 13:28:07.257836+00', '2025-08-24 13:28:07.257836+00'),
	('3f5b18a9-2228-459c-8b08-071c91d8bfb4', '651bb299-cd7d-480e-b3bf-d6776befdf07', 'タイトル１', 'タイトル1-5tdj', 'sasa

![](https://zylkbsmbxctfdwatifxi.supabase.co/storage/v1/object/public/public-images/651bb299-cd7d-480e-b3bf-d6776befdf07/1756042152583-sfgqucx8wsh.png)![](https://zylkbsmbxctfdwatifxi.supabase.co/storage/v1/object/public/public-images/651bb299-cd7d-480e-b3bf-d6776befdf07/1756042154751-gf7667425n.png)

# sasas

## sasa

# sasasa', NULL, 'draft', NULL, NULL, false, 1, NULL, '2025-08-24 13:29:22.67621+00', '2025-08-24 13:29:22.67621+00'),
	('a5c4f830-cc26-4238-8a6a-1e3393a74cf3', '651bb299-cd7d-480e-b3bf-d6776befdf07', 'sasa', 'sasa', 'sasasa', NULL, 'public', NULL, NULL, true, 1, '2025-09-17 23:42:11.109+00', '2025-09-17 23:42:11.156946+00', '2025-09-17 23:42:11.156946+00'),
	('8881a94a-3859-4ee6-b45f-cc3684761607', '651bb299-cd7d-480e-b3bf-d6776befdf07', 'タイトル', 'タイトル', '# カウンセリングテンプレ（共通）

> 目的：初回〜3回目で「再現性」と「不満ゼロ」化。所要 5–8分。

## 1) ゴール定義（今日は何が変われば成功？）

-   悩み：＿＿＿＿＿＿（例：広がり／ツヤ不足／持ち）
    
-   仕上がりキーワード：＿＿＿＿＿＿（例：軽い・柔らかい・締まる）
    
-   優先順位：見た目 / ダメージ最小 / 時短 のどれ？
    

## 2) 履歴・素材評価

-   直近履歴：＿＿＿＿（カラー/パーマ/縮毛/黒染め）
    
-   ホームケア：＿＿＿＿（頻度・アイテム）
    
-   素材：太さ＿/量＿/ダメージ＿/癖＿/浮き＿/生えグセ＿', NULL, 'public', NULL, NULL, true, 1, '2025-09-17 23:43:28.236+00', '2025-09-17 23:43:28.332161+00', '2025-09-17 23:43:28.332161+00'),
	('e43b98a4-f677-4aa4-8895-49cbd58bcb48', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'タイトル2', 'タイトル2', 'sasa', NULL, 'public', NULL, NULL, true, 1, '2025-09-18 00:48:04.327+00', '2025-09-18 00:48:04.448918+00', '2025-09-18 00:48:04.448918+00'),
	('14a7d663-2968-4f9f-8c5f-25c2db72bc3e', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'sa', 'sa', 'sasa', NULL, 'draft', NULL, NULL, false, 1, NULL, '2025-09-19 10:57:52.427819+00', '2025-09-19 10:57:52.427819+00'),
	('1c52da38-d201-4789-abee-09521f8a770c', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'sa', 'sa-f61x', 'sasa', NULL, 'draft', NULL, NULL, false, 1, NULL, '2025-09-19 12:28:02.485259+00', '2025-09-19 12:28:02.485259+00'),
	('f77dd531-f867-461e-9eea-1dd68eb3e742', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'sa', 'sa-tbag', 'sa', NULL, 'draft', NULL, NULL, false, 1, NULL, '2025-09-19 12:39:02.279728+00', '2025-09-19 12:39:02.279728+00'),
	('551346a6-b0a8-4d4f-9f0e-b0aa4fd3ca70', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'sa', 'sa-7iof', '', NULL, 'draft', NULL, NULL, false, 1, NULL, '2025-09-19 14:14:03.920066+00', '2025-09-19 14:14:03.920066+00'),
	('f4e702a9-4cc6-49ae-a286-1efdc3c837b2', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'さささ', 'さささ', 'さささ', NULL, 'public', NULL, NULL, true, 1, '2025-09-19 14:43:21.022+00', '2025-09-19 14:43:21.112326+00', '2025-09-19 14:43:21.112326+00'),
	('2ec46cb6-1ce7-4a47-b5f0-52cb705bf2b5', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'だだだ', 'だだだ', 'だだだ', NULL, 'public', NULL, NULL, true, 1, '2025-09-19 14:44:01.202+00', '2025-09-19 14:44:01.248507+00', '2025-09-19 14:44:01.248507+00'),
	('59b12e71-d437-40d2-9865-e66c2b10ecf8', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'sasasa', 'sasasa', 'sasasa', NULL, 'public', NULL, NULL, true, 1, '2025-09-19 14:45:30.381+00', '2025-09-19 14:45:12.267302+00', '2025-09-19 14:45:30.409173+00');


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tags" ("id", "name", "owner_id", "created_at") VALUES
	('efcc73cd-4752-45e2-a111-e02c96c388e7', 'next', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '2025-08-22 09:01:10.064874+00'),
	('fd108077-7b04-4ef3-b669-eed3a9d8a7fa', 'カット', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '2025-09-09 02:09:52.881368+00'),
	('75e3a913-c9f5-4b93-9478-fc63189de2d6', 'エステ', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '2025-09-09 14:58:43.732245+00');


--
-- Data for Name: post_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("user_id", "username", "display_name", "avatar_url", "created_at", "updated_at", "job", "onboarding_needed") VALUES
	('651bb299-cd7d-480e-b3bf-d6776befdf07', NULL, NULL, NULL, '2025-08-24 07:18:05.907687+00', '2025-09-16 12:43:25.971573+00', NULL, true),
	('c569e6d5-5a78-49d9-8398-4c008f7faa8f', 'masaya.quest.academia', 'masaya.quest.academia', NULL, '2025-09-16 07:51:23.749898+00', '2025-09-16 14:18:36.532804+00', NULL, true),
	('c8e35e92-7f66-4425-b5c0-2e2291b4bad3', 'veenis_official', 'Veenis_Official', 'https://zylkbsmbxctfdwatifxi.supabase.co/storage/v1/object/public/public-images/c8e35e92-7f66-4425-b5c0-2e2291b4bad3/1756998b-8d06-4cb7-a839-abc5bb700232.png', '2025-08-22 08:56:06.476407+00', '2025-09-21 08:53:44.356271+00', 'ネイリスト', true);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('public-images', 'public-images', NULL, '2025-08-24 03:46:13.051143+00', '2025-08-24 03:46:13.051143+00', true, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "level") VALUES
	('79ce9619-e354-48a8-aa03-c634a4d8ab8b', 'public-images', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3/1756007727795-cb1xw7k50ms.png', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '2025-08-24 03:55:31.374292+00', '2025-08-24 03:55:31.374292+00', '2025-08-24 03:55:31.374292+00', '{"eTag": "\"cb0f1214bd6525421b4fa3c814104fea-5\"", "size": 26066291, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-08-24T03:55:31.000Z", "contentLength": 26066291, "httpStatusCode": 200}', 'bd9adc64-bc20-4b46-9221-2a36fc693817', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '{}', 2),
	('911dc4b0-6a64-4e16-851f-756f9654afde', 'public-images', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3/1756007790649-f5md0kd5en.png', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '2025-08-24 03:56:35.069891+00', '2025-08-24 03:56:35.069891+00', '2025-08-24 03:56:35.069891+00', '{"eTag": "\"cb0f1214bd6525421b4fa3c814104fea-5\"", "size": 26066291, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-08-24T03:56:34.000Z", "contentLength": 26066291, "httpStatusCode": 200}', '13af1f02-af1e-48db-a5cb-f2465cb27255', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '{}', 2),
	('be7e1fb1-1edb-4705-95c1-0d0d97cd55c8', 'public-images', '651bb299-cd7d-480e-b3bf-d6776befdf07/1756042079801-ckpke3kkwqa.png', '651bb299-cd7d-480e-b3bf-d6776befdf07', '2025-08-24 13:28:07.076467+00', '2025-08-24 13:28:07.076467+00', '2025-08-24 13:28:07.076467+00', '{"eTag": "\"cb0f1214bd6525421b4fa3c814104fea-5\"", "size": 26066291, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-08-24T13:28:07.000Z", "contentLength": 26066291, "httpStatusCode": 200}', '7d974950-3524-44b9-a3b6-b0224115eaf3', '651bb299-cd7d-480e-b3bf-d6776befdf07', '{}', 2),
	('d600f941-35cf-4545-b916-fa00982c7aac', 'public-images', '651bb299-cd7d-480e-b3bf-d6776befdf07/1756042152583-sfgqucx8wsh.png', '651bb299-cd7d-480e-b3bf-d6776befdf07', '2025-08-24 13:29:18.666588+00', '2025-08-24 13:29:18.666588+00', '2025-08-24 13:29:18.666588+00', '{"eTag": "\"cb0f1214bd6525421b4fa3c814104fea-5\"", "size": 26066291, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-08-24T13:29:18.000Z", "contentLength": 26066291, "httpStatusCode": 200}', 'c166963b-05a1-40e5-a774-e7fde497f2f1', '651bb299-cd7d-480e-b3bf-d6776befdf07', '{}', 2),
	('68609cf8-c926-41de-80d8-5ed937821fee', 'public-images', '651bb299-cd7d-480e-b3bf-d6776befdf07/1756042154751-gf7667425n.png', '651bb299-cd7d-480e-b3bf-d6776befdf07', '2025-08-24 13:29:22.388603+00', '2025-08-24 13:29:22.388603+00', '2025-08-24 13:29:22.388603+00', '{"eTag": "\"cb0f1214bd6525421b4fa3c814104fea-5\"", "size": 26066291, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-08-24T13:29:22.000Z", "contentLength": 26066291, "httpStatusCode": 200}', '47eea71f-e899-4640-bf17-d50b5d0b717c', '651bb299-cd7d-480e-b3bf-d6776befdf07', '{}', 2),
	('a06d7201-402d-44dd-834e-408dd84799ea', 'public-images', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3/1757334975617-ro61yrvg9u.png', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '2025-09-08 12:36:15.947509+00', '2025-09-08 12:36:15.947509+00', '2025-09-08 12:36:15.947509+00', '{"eTag": "\"c3897d3f593f4bcc8bdebd4ffc14f553\"", "size": 159439, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-09-08T12:36:16.000Z", "contentLength": 159439, "httpStatusCode": 200}', '4cc949ce-3714-4516-95c5-3d5be066a960', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '{}', 2),
	('a7fa2864-3359-4ad2-9532-532a5b91f556', 'public-images', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3/1756998b-8d06-4cb7-a839-abc5bb700232.png', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '2025-09-08 13:19:51.177348+00', '2025-09-08 13:19:51.177348+00', '2025-09-08 13:19:51.177348+00', '{"eTag": "\"c3897d3f593f4bcc8bdebd4ffc14f553\"", "size": 159439, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-09-08T13:19:52.000Z", "contentLength": 159439, "httpStatusCode": 200}', '22da3ea6-c4c8-4cbf-aec8-c451820aa764', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '{}', 2),
	('3b23f0d2-9ae9-44f3-a3cb-d381520253c7', 'public-images', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3/1757834639969-q8cp5t5ong.png', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '2025-09-14 07:24:04.334147+00', '2025-09-14 07:24:04.334147+00', '2025-09-14 07:24:04.334147+00', '{"eTag": "\"c3897d3f593f4bcc8bdebd4ffc14f553\"", "size": 159439, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-09-14T07:24:05.000Z", "contentLength": 159439, "httpStatusCode": 200}', '0d84ad82-ff28-4dae-b84d-7592b496b20f', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '{}', 2);


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."prefixes" ("bucket_id", "name", "created_at", "updated_at") VALUES
	('public-images', 'c8e35e92-7f66-4425-b5c0-2e2291b4bad3', '2025-08-24 03:55:31.374292+00', '2025-08-24 03:55:31.374292+00'),
	('public-images', '651bb299-cd7d-480e-b3bf-d6776befdf07', '2025-08-24 13:28:07.076467+00', '2025-08-24 13:28:07.076467+00');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 99, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;

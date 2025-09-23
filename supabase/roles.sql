
SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

CREATE ROLE "cli_login_postgres";
ALTER ROLE "cli_login_postgres" WITH INHERIT CREATEROLE NOCREATEDB LOGIN NOBYPASSRLS VALID UNTIL '2025-09-21 14:48:24.031687+00';
CREATE ROLE "veenis_app_admin";
ALTER ROLE "veenis_app_admin" WITH INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOBYPASSRLS;
CREATE ROLE "veenis_app_reader";
ALTER ROLE "veenis_app_reader" WITH INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOBYPASSRLS;
CREATE ROLE "veenis_app_writer";
ALTER ROLE "veenis_app_writer" WITH INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOBYPASSRLS;

ALTER ROLE "anon" SET "statement_timeout" TO '3s';

ALTER ROLE "authenticated" SET "statement_timeout" TO '8s';

ALTER ROLE "authenticator" SET "statement_timeout" TO '8s';

GRANT "postgres" TO "cli_login_postgres" WITH INHERIT FALSE GRANTED BY "supabase_admin";

RESET ALL;

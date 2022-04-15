-- Database: chat

-- DROP DATABASE IF EXISTS chat;

CREATE DATABASE chat
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- SCHEMA: chat-schema

-- DROP SCHEMA IF EXISTS "chat-schema" ;

CREATE SCHEMA IF NOT EXISTS "chat-schema"
    AUTHORIZATION postgres;
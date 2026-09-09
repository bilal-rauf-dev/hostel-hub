-- 0001: add 'pending' to the order_status enum
--
-- Why: database/hostelhub.sql declares
--     CREATE TYPE order_status AS ENUM ('confirmed','delivered','cancelled');
-- but marketplace_orders declares DEFAULT 'pending', and place_order() inserts
-- the literal 'pending'. Both are invalid against the enum, so every attempt to
-- place a marketplace order fails at the database level.
--
-- The application treats 'pending' as the real initial state (the seller's
-- Confirm / Reject controls key off it), so the enum is what is wrong here,
-- not the function.
--
-- Rollback: there is no safe automatic rollback. Removing a value from a
-- PostgreSQL enum requires recreating the type and rewriting every dependent
-- column, and any row already holding 'pending' would have to be remapped
-- first. Do it by hand if it is ever needed.

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'confirmed';

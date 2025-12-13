-- Migration: Add is_hidden column to notes table
-- This enables hidden chat functionality where notes can be marked as hidden
-- and only displayed when the user enables the "Show Hidden Notes" setting

ALTER TABLE `notes` ADD COLUMN `is_hidden` integer DEFAULT 0 NOT NULL;

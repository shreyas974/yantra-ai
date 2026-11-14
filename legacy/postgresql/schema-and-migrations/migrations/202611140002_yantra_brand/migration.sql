-- Update only original default branding. Preserve custom organizer text and IDs.
UPDATE "EventConfig" SET value = 'YANTRA AI', "updatedAt" = CURRENT_TIMESTAMP
WHERE key = 'event_name' AND value = 'CHAD';
UPDATE "EventConfig" SET value = 'YANTRA', "updatedAt" = CURRENT_TIMESTAMP
WHERE key = 'registration_prefix' AND value = 'CHAD';
UPDATE "Event" SET title = 'YANTRA AI', "updatedAt" = CURRENT_TIMESTAMP
WHERE title = 'CHAD';

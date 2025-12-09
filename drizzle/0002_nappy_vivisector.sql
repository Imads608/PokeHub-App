DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatarPath') THEN
        ALTER TABLE "users" RENAME COLUMN "avatarPath" TO "avatarFilename";
    END IF;
END $$;
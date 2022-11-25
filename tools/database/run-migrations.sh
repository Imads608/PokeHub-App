## Execute from Root Directory

echo "Running migrations for Users Database"
npm run typeorm migration:run -- -d apps/user-service/ormconfig.ts
echo "Completed migrations for Users Database"

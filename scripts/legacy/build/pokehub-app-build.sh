# In App Directory

docker build --build-arg NEXT_PUBLIC_POKEHUB_API_URL=http://localhost:3000/api --rm --target app-runtime -t pokehub-app -f Dockerfile .
docker tag pokehub-app pokehub.azurecr.io/pokehub-app:dev
docker push pokehub.azurecr.io/pokehub-app:dev

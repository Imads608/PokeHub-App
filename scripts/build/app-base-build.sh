# In Root Directory

docker build --rm --target app-base -t pokehub-base -f Dockerfile .
docker tag pokehub-base pokehub.azurecr.io/pokehub-base:dev
docker push pokehub.azurecr.io/pokehub-base:dev

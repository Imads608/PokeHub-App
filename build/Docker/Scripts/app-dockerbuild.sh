echo "Building Base App Docker Image"
docker build --rm -t app-base-image:latest -f build/Docker/Dockerfiles/app-Dockerfile .
docker tag app-base-image:latest registry.gitlab.com/imadsheriff97/pokehub-app/app-base-image:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/app-base-image:latest
echo "Done building Base App Docker Image"

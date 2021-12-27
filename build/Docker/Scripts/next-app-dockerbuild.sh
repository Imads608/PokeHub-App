echo "Building Next Application Prod Docker Image"
docker build --rm --target final -t next-app:latest -f build/Docker/Dockerfiles/next-app-Dockerfile .
docker tag next-app:latest registry.gitlab.com/imadsheriff97/pokehub-app/next-app:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/next-app:latest
echo "Done building Next Application Prod Docker Image"

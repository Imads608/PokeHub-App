echo "Building Socket Service Prod Docker Image"
docker build --rm --target final -t socket-service:latest -f build/Docker/Dockerfiles/socket-service-Dockerfile .
docker tag socket-service:latest registry.gitlab.com/imadsheriff97/pokehub-app/socket-service:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/socket-service:latest
echo "Done building Socket Service Prod Docker Image"

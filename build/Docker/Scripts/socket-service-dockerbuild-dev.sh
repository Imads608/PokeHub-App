echo "Building Socket Service Dev Docker Image"
docker build -t socket-service:dev -f build/Docker/Dockerfiles/socket-service-Dockerfile .
docker tag socket-service:dev registry.gitlab.com/imadsheriff97/pokehub-app/socket-service:dev
docker push registry.gitlab.com/imadsheriff97/pokehub-app/socket-service:dev
echo "Done building Socket Service Dev Docker Image"

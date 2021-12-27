echo "Building User Service Prod Docker Image"
docker build --rm --target final -t user-service:latest -f build/Docker/Dockerfiles/user-service-Dockerfile .
docker tag user-service:latest registry.gitlab.com/imadsheriff97/pokehub-app/user-service:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-service:latest
echo "Done building User Service Prod Docker Image"

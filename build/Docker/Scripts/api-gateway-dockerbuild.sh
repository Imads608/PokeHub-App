echo "Building API Gateway Production Docker Image"
docker build -t api-gateway:latest -f build/Docker/Dockerfiles/api-gateway-Dockerfile .
docker tag api-gateway:latest registry.gitlab.com/imadsheriff97/pokehub-app/api-gateway:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/api-gateway:latest
echo "Done building API Gateway Production Docker Image"

echo "Building API Gateway Dev Docker Image"
docker build -t api-gateway:dev -f build/Docker/Dockerfiles/api-gateway-Dockerfile .
docker tag api-gateway:dev registry.gitlab.com/imadsheriff97/pokehub-app/api-gateway:dev
docker push registry.gitlab.com/imadsheriff97/pokehub-app/api-gateway:dev
echo "Done building API Gateway Dev Docker Image"

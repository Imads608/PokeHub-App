set -e
tag=${1:-dev}

echo "Building API Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t api-gateway:${tag} -f build/Docker/Dockerfiles/api-gateway-Dockerfile .
docker tag api-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/api-gateway:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/api-gateway:${tag}
echo "Done building API Gateway Docker Image with tag ${tag}"

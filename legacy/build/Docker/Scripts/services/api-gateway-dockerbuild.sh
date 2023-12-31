set -e
tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building API Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t api-gateway:${tag} -f apps/api-gateway/Dockerfile .

if [ $saveToRegistry -eq 1 ]; then
    docker tag api-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/api-gateway:${tag}
    docker push registry.gitlab.com/imadsheriff97/pokehub-app/api-gateway:${tag}
fi

echo "Done building API Gateway Docker Image with tag ${tag}"

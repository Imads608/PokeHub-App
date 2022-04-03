set -e
tag=${1:-dev}

echo "Building Mail Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t mail-gateway:${tag} -f build/Docker/Dockerfiles/mail-gateway-Dockerfile .
docker tag mail-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/mail-gateway:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/mail-gateway:${tag}
echo "Done building Mail Gateway Docker Image with tag ${tag}"

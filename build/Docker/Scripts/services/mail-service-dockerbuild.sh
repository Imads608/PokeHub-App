set -e
tag=${1:-dev}

echo "Building Mail Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t mail-service:${tag} -f build/Docker/Dockerfiles/mail-service-Dockerfile .
docker tag mail-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/mail-service:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/mail-service:${tag}
echo "Done building Mail Service Docker Image with tag ${tag}"

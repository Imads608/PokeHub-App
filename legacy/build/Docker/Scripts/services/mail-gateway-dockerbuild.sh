set -e
tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building Mail Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t mail-gateway:${tag} -f apps/mail-gateway/Dockerfile .

if [ $saveToRegistry -eq 1 ]; then
    docker tag mail-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/mail-gateway:${tag}
    docker push registry.gitlab.com/imadsheriff97/pokehub-app/mail-gateway:${tag}
fi

echo "Done building Mail Gateway Docker Image with tag ${tag}"
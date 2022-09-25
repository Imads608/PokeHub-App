set -e
tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building User Events Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t user-events-gateway:${tag} -f apps/user-events-gateway/Dockerfile .

if [ $saveToRegistry -eq 1 ]; then
    docker tag user-events-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/user-events-gateway:${tag}
    docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-events-gateway:${tag}
fi

echo "Done building User Events Gateway Docker Image with tag ${tag}"

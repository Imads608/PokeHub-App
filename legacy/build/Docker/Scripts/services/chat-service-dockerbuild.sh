set -e
tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building Chat Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t chat-service:${tag} -f apps/chat-service/Dockerfile .

if [ $saveToRegistry -eq 1 ]; then
    docker tag chat-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/chat-service:${tag}
    docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-service:${tag}
fi

echo "Done building Chat Service Docker Image with tag ${tag}"

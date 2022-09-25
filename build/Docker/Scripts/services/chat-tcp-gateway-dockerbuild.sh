set -e
tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building Chat TCP Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t chat-tcp-gateway:${tag} -f apps/chat-tcp-gateway/Dockerfile .

if [ $saveToRegistry -eq 1 ]; then
    docker tag chat-tcp-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/chat-tcp-gateway:${tag}
    docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-tcp-gateway:${tag}
fi

echo "Done building Chat TCP Gateway Docker Image with tag ${tag}"

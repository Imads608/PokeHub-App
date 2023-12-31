set -e
tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building Chat Notification Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t chat-notif-service:${tag} -f apps/chat-notif-service/Dockerfile .

if [ $saveToRegistry -eq 1 ]; then
    docker tag chat-notif-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/chat-notif-service:${tag}
    docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-notif-service:${tag}
fi

echo "Done building Chat Notification Service Docker Image with tag ${tag}"

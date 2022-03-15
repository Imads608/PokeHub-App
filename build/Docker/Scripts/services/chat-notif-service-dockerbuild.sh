tag=${1:-dev}

echo "Building Chat Notification Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t chat-notif-service:${tag} -f build/Docker/Dockerfiles/chat-notif-service-Dockerfile .
docker tag chat-notif-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/chat-notif-service:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-notif-service:${tag}
echo "Done building Chat Notification Service Docker Image with tag ${tag}"

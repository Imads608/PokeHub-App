set -e
tag=${1:-dev}

echo "Building Chat Socket Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t chat-socket-service:${tag} -f apps/chat-socket-service/Dockerfile .
docker tag chat-socket-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/chat-socket-service:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-socket-service:${tag}
echo "Done building Chat Socket Service Docker Image with tag ${tag}"
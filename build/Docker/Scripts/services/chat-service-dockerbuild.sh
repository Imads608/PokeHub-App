set -e
tag=${1:-dev}

echo "Building Chat Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t chat-service:${tag} -f apps/chat-service/Dockerfile .
docker tag chat-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/chat-service:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-service:${tag}
echo "Done building Chat Service Docker Image with tag ${tag}"

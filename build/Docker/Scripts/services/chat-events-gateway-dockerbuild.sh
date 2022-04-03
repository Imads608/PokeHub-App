set -e
tag=${1:-dev}

echo "Building Chat Events Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t chat-events-gateway:${tag} -f apps/chat-events-gateway/Dockerfile .
docker tag chat-events-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/chat-events-gateway:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-events-gateway:${tag}
echo "Done building Chat Events Gateway Docker Image with tag ${tag}"

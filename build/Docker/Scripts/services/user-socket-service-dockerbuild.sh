set -e
tag=${1:-dev}

echo "Building User Socket Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t user-socket-service:${tag} -f apps/user-socket-service/Dockerfile .
docker tag user-socket-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/user-socket-service:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-socket-service:${tag}
echo "Done building User Socket Service Docker Image with tag ${tag}"

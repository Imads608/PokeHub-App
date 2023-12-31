set -e
tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building User Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t user-service:${tag} -f apps/user-service/Dockerfile .

if [ $saveToRegistry -eq 1 ]; then
    docker tag user-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/user-service:${tag}
    docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-service:${tag}
fi

echo "Done building User Service Docker Image with tag ${tag}"

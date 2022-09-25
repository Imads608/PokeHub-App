set -e
tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building User REST Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t user-rest-gateway:${tag} -f apps/user-rest-gateway/Dockerfile .

if [ $saveToRegistry -eq 1 ]; then
    docker tag user-rest-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/user-rest-gateway:${tag}
    docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-rest-gateway:${tag}
fi

echo "Done building User REST Gateway Docker Image with tag ${tag}"
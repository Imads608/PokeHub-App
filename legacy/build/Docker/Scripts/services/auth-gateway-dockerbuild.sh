set -e
tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building Auth Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t auth-gateway:${tag} -f apps/auth-gateway/Dockerfile .

if [ $saveToRegistry -eq 1 ]; then
    docker tag auth-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/auth-gateway:${tag}
    docker push registry.gitlab.com/imadsheriff97/pokehub-app/auth-gateway:${tag}
fi

echo "Done building Auth Gateway Docker Image with tag ${tag}"

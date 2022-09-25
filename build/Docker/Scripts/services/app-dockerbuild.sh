set -e
tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building Base App Docker Image with tag ${tag}"
docker build --rm -t app-base-image:${tag} -f apps/app-Dockerfile .

if [ $saveToRegistry -eq 1 ]; then
    docker tag app-base-image:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/app-base-image:${tag}
    docker push registry.gitlab.com/imadsheriff97/pokehub-app/app-base-image:${tag}
fi

echo "Done building Base App Docker Image with tag ${tag}"
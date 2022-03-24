set -e
tag=${1:-dev}

echo "Building Base App Docker Image with tag ${tag}"
docker build --rm -t app-base-image:${tag} -f build/Docker/Dockerfiles/app-Dockerfile .
docker tag app-base-image:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/app-base-image:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/app-base-image:${tag}
echo "Done building Base App Docker Image with tag ${tag}"
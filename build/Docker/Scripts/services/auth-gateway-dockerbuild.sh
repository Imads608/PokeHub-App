set -e
tag=${1:-dev}

echo "Building Auth Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t auth-gateway:${tag} -f apps/auth-gateway/Dockerfile .
docker tag auth-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/auth-gateway:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/auth-gateway:${tag}
echo "Done building Auth Gateway Docker Image with tag ${tag}"

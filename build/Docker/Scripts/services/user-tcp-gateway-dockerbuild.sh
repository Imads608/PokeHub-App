set -e
tag=${1:-dev}

echo "Building User TCP Gateway Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t user-tcp-gateway:${tag} -f apps/user-tcp-gateway/Dockerfile .
docker tag user-tcp-gateway:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/user-tcp-gateway:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-tcp-gateway:${tag}
echo "Done building User TCP Gateway Docker Image with tag ${tag}"

tag=${1:-dev}

echo "Building User Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t user-service:${tag} -f build/Docker/Dockerfiles/user-service-Dockerfile .
docker tag user-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/user-service:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-service:${tag}
echo "Done building User Service Docker Image with tag ${tag}"

tag=${1:-dev}

echo "Building Auth Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t auth-service:${tag} -f build/Docker/Dockerfiles/auth-service-Dockerfile .
docker tag auth-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/auth-service:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/auth-service:${tag}
echo "Done building Auth Service Docker Image with tag ${tag}"

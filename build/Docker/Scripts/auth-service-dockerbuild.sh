echo "Building Auth Service Prod Docker Image"
docker build --rm --target final -t auth-service:latest -f build/Docker/Dockerfiles/auth-service-Dockerfile .
docker tag auth-service:latest registry.gitlab.com/imadsheriff97/pokehub-app/auth-service:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/auth-service:latest
echo "Done building Auth Service Prod Docker Image"

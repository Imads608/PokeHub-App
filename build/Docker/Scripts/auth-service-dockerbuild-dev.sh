echo "Building Auth Service Dev Docker Image"
docker build --rm --target final -t auth-service:dev -f build/Docker/Dockerfiles/auth-service-Dockerfile .
docker tag auth-service:dev registry.gitlab.com/imadsheriff97/pokehub-app/auth-service:dev
docker push registry.gitlab.com/imadsheriff97/pokehub-app/auth-service:dev
echo "Done building Auth Service Dev Docker Image"

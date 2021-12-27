echo "Building User Service Dev Docker Image"
docker build --rm --target final -t user-service:dev -f build/Docker/Dockerfiles/user-service-Dockerfile .
docker tag user-service:dev registry.gitlab.com/imadsheriff97/pokehub-app/user-service:dev
docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-service:dev
echo "Done building User Service Dev Docker Image"

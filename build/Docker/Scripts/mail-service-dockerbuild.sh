echo "Building Mail Service Production Docker Image"
docker build --rm --target final -t mail-service:latest -f build/Docker/Dockerfiles/mail-service-Dockerfile .
docker tag mail-service:latest registry.gitlab.com/imadsheriff97/pokehub-app/mail-service:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/mail-service:latest
echo "Done building Mail Service Production Docker Image"

echo "Building Mail Service Dev Docker Image"
docker build --rm --target final -t mail-service:dev -f build/Docker/Dockerfiles/mail-service-Dockerfile .
docker tag mail-service:dev registry.gitlab.com/imadsheriff97/pokehub-app/mail-service:dev
docker push registry.gitlab.com/imadsheriff97/pokehub-app/mail-service:dev
echo "Done building Mail Service Dev Docker Image"

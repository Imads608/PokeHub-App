echo "Building Next Application Dev Docker Image"
docker build --rm --target final -t next-app:dev -f build/Docker/Dockerfiles/next-app-Dockerfile .
docker tag next-app:dev registry.gitlab.com/imadsheriff97/pokehub-app/next-app:dev
docker push registry.gitlab.com/imadsheriff97/pokehub-app/next-app:dev
echo "Done building Next Application Dev Docker Image"

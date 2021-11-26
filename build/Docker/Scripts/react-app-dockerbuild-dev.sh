echo "Building React Application Dev Docker Image"
docker build -t react-app:dev -f build/Docker/Dockerfiles/react-app-Dockerfile .
docker tag react-app:dev registry.gitlab.com/imadsheriff97/pokehub-app/react-app:dev
docker push registry.gitlab.com/imadsheriff97/pokehub-app/react-app:dev
echo "Done building React Application Dev Docker Image"

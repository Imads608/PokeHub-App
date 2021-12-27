echo "Building React Application Prod Docker Image"
docker build --rm --target final -t react-app:latest -f build/Docker/Dockerfiles/react-app-Dockerfile .
docker tag react-app:latest registry.gitlab.com/imadsheriff97/pokehub-app/react-app:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/react-app:latest
echo "Done building React Application Prod Docker Image"

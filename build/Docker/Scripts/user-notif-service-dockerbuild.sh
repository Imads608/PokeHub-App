echo "Building User Notification Service Prod Docker Image"
docker build --rm --target final -t user-notif-service:latest -f build/Docker/Dockerfiles/user-notif-service-Dockerfile .
docker tag user-notif-service:latest registry.gitlab.com/imadsheriff97/pokehub-app/user-notif-service:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-notif-service:latest
echo "Done building User Notification Service Prod Docker Image"

echo "Building User Notification Service Dev Docker Image"
docker build --rm --target final -t user-notif-service:dev -f build/Docker/Dockerfiles/user-notif-service-Dockerfile .
docker tag user-notif-service:dev registry.gitlab.com/imadsheriff97/pokehub-app/user-notif-service:dev
docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-notif-service:dev
echo "Done building User Notification Service Dev Docker Image"

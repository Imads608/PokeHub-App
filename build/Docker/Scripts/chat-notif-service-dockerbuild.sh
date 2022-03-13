echo "Building Chat Notification Service Prod Docker Image"
docker build --rm --target final -t chat-notif-service:latest -f build/Docker/Dockerfiles/chat-notif-service-Dockerfile .
docker tag chat-notif-service:latest registry.gitlab.com/imadsheriff97/pokehub-app/chat-notif-service:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-notif-service:latest
echo "Done building Chat Notification Service Prod Docker Image"

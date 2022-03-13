echo "Building Chat Notification Service Dev Docker Image"
docker build --rm --target final -t chat-notif-service:dev -f build/Docker/Dockerfiles/chat-notif-service-Dockerfile .
docker tag chat-notif-service:dev registry.gitlab.com/imadsheriff97/pokehub-app/chat-notif-service:dev
docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-notif-service:dev
echo "Done building Chat Notification Service Dev Docker Image"

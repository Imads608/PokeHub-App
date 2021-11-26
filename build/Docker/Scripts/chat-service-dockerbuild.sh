echo "Building Chat Service Prod Docker Image"
docker build -t chat-service:latest -f build/Docker/Dockerfiles/chat-service-Dockerfile .
docker tag chat-service:latest registry.gitlab.com/imadsheriff97/pokehub-app/chat-service:latest
docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-service:latest
echo "Done building Chat Service Docker Image"

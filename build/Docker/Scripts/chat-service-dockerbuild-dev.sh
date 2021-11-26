echo "Building Chat Service Dev Docker Image"
docker build -t chat-service:dev -f build/Docker/Dockerfiles/chat-service-Dockerfile .
docker tag chat-service:dev registry.gitlab.com/imadsheriff97/pokehub-app/chat-service:dev
docker push registry.gitlab.com/imadsheriff97/pokehub-app/chat-service:dev
echo "Done building Chat Service Docker Image"

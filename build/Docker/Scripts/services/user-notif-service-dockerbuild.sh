set -e
tag=${1:-dev}

echo "Building User Notification Service Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t user-notif-service:${tag} -f apps/user-notif-service/Dockerfile .
docker tag user-notif-service:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/user-notif-service:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/user-notif-service:${tag}
echo "Done building User Notification Service Docker Image with tag ${tag}"

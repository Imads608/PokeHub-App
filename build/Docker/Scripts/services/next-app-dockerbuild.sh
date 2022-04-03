set -e
tag=${1:-dev}

echo "Building Next Front-end Application Docker Image with tag ${tag}"
docker build --rm --target final --build-arg "TAG=${tag}" -t next-app:${tag} -f apps/next-app/Dockerfile .
docker tag next-app:${tag} registry.gitlab.com/imadsheriff97/pokehub-app/next-app:${tag}
docker push registry.gitlab.com/imadsheriff97/pokehub-app/next-app:${tag}
echo "Done building Next Front-end Application Docker Image with tag ${tag}"

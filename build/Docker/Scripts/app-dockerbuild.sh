echo "Building Base App Docker Image"
docker build --rm -t app-base-image:latest -f build/Docker/Dockerfiles/app-Dockerfile .
echo "Done building Base App Docker Image"

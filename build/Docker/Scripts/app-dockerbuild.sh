echo "Building Base App Docker Image"
docker build -t app-base-image:latest -f build/Docker/Dockerfiles/app-Dockerfile .
echo "Done building Base App Docker Image"

tag=${1:-dev}
echo "Building PokeHub Projects with tag ${tag}"

bash build/Docker/Scripts/services/app-dockerbuild.sh ${tag}
bash build/Docker/Scripts/services/api-gateway-dockerbuild.sh ${tag}
bash build/Docker/Scripts/services/auth-service-dockerbuild.sh ${tag}
bash build/Docker/Scripts/services/user-service-dockerbuild.sh ${tag}
bash build/Docker/Scripts/services/mail-service-dockerbuild.sh ${tag}
bash build/Docker/Scripts/services/user-notif-service-dockerbuild.sh ${tag}
bash build/Docker/Scripts/services/chat-notif-service-dockerbuild.sh ${tag}
bash build/Docker/Scripts/services/next-app-dockerbuild.sh ${tag}

echo "Done Building PokeHub Projects with tag ${tag}"



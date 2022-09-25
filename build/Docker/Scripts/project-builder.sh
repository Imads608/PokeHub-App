# Exit when any command fails
set -e

tag=${1:-dev}
saveToRegistry=${2:-1}

echo "Building PokeHub Projects with tag ${tag}"

bash build/Docker/Scripts/services/app-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/api-gateway-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/auth-gateway-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/chat-events-gateway-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/chat-notif-service-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/chat-service-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/chat-socket-service-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/chat-tcp-gateway-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/mail-gateway-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/next-app-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/user-events-gateway-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/user-notif-service-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/user-rest-gateway-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/user-service-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/user-socket-service-dockerbuild.sh ${tag} ${saveToRegistry}
bash build/Docker/Scripts/services/user-tcp-gateway-dockerbuild.sh ${tag} ${saveToRegistry}

echo "Done Building PokeHub Projects with tag ${tag}"



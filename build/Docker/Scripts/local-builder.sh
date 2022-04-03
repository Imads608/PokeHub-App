# Exit when any command fails
set -e

echo "Building PokeHub Projects Locally"

nx build api-gateway --configuration=production
nx build auth-gateway --configuration=production
nx build chat-events-gateway --configuration=production
nx build chat-notif-service --configuraiton=production
nx build chat-service --configuration=production
nx build chat-socket-service --configuration=production
nx build chat-tcp-gateway --configuration=production
nx build mail-gateway --configuration=production
nx build next-app --configuration=production
nx build user-events-gateway --configuration=production
nx build user-notif-service --configuration=production
nx build user-rest-gateway --configuration=production
nx build user-service --configuration=production
nx build user-socket-service --configuration=production
nx build user-tcp-gateway --configuration=production

echo "Done Building PokeHub Projects Locally"



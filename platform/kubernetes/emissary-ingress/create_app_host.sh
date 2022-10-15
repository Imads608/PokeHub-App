## This script installs the K8 Resources to use the domain name to access internal resources with TLS

# Installs the Listener resource which configures where, how and which Hosts it should listen to requests from
kubectl apply -f resources/Listener.yaml


# Installs the Host resource with TLS enabled
kubectl apply -f resources/Main-Host-With-TLS.yaml
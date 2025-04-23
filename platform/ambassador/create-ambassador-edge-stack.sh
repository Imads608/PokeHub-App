# Quick Start Guide

# Copy the CLOUD_CONNECT_TOKEN value from the .env file in this directory
kubectl apply -f https://app.getambassador.io/yaml/edge-stack/3.11.1/aes-crds.yaml && \
kubectl wait --timeout=90s --for=condition=available deployment emissary-apiext -n emissary-system
 
kubectl apply -f https://app.getambassador.io/yaml/edge-stack/3.11.1/aes.yaml && \
kubectl create secret generic --namespace ambassador edge-stack-agent-cloud-token --from-literal=CLOUD_CONNECT_TOKEN=$CLOUD_CONNECT_TOKEN
kubectl -n ambassador wait --for condition=available --timeout=90s deploy -l product=aes

# Create Listener
# kubectl apply -f resources/Listener.yaml

# Create Host
kubectl apply -f Host.yaml

# Create a Sample Service
kubectl apply -f https://app.getambassador.io/yaml/v2-docs/3.9.1/quickstart/qotm.yaml

# Apply Mapping for the Service
kubectl apply -f resources/Mapping.yaml


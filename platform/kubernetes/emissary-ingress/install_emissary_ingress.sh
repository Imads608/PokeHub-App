## This script installs Emissary Ingress to the cluster
## NOTE: Istio must be installed in the Cluster before running this script

# Add the Repo:
helm repo add datawire https://app.getambassador.io
helm repo update
 
# Create Namespace:
kubectl create namespace emissary
kubectl create namespace emissary-system

# Enable Istio Integration
kubectl label namespace emissary istio-injection=enabled
kubectl label namespace emissary-system istio-injection=enabled

# Install Emissary
kubectl apply -f https://app.getambassador.io/yaml/emissary/3.1.0/emissary-crds.yaml
kubectl wait --timeout=90s --for=condition=available deployment emissary-apiext -n emissary-system
helm install emissary-ingress --namespace emissary datawire/emissary-ingress && \
kubectl -n emissary wait --for condition=available --timeout=90s deploy -lapp.kubernetes.io/instance=emissary-ingress

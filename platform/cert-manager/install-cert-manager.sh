kubectl apply -f https://github.com/jetstack/cert-manager/releases/latest/download/cert-manager.crds.yaml

helm repo add jetstack https://charts.jetstack.io && helm repo update

kubectl create ns cert-manager
helm install cert-manager --namespace cert-manager jetstack/cert-manager

kubectl apply -f resources/DNS01-Challenge/ClusterIssuer.yaml
kubectl apply -f resources/DNS01-Challenge/Certificate.yaml

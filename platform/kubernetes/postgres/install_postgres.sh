## NOTE: MUST HAVE ISTIO INSTALLED IN CLUSTER FIRST BEFORE RUNNING

# Create Namespace and Enable Istio Service Mesh
kubectl create namespace postgres
kubectl label namespace postgres istio-injection=enabled --overwrite

# Create PV and PVC Claims for the Postgres Instance
kubectl apply -f Resources/postgres-pv.yaml
kubectl apply -f Resources/postgres-pvc.yaml

helm install psql bitnami/postgresql --set persistence.existingClaim=postgresql-pv-claim --set volumePermissions.enabled=true --namespace postgres

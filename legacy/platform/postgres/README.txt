## Instructions for deploying PostgreSQL in Kubernetes

kubectl apply -f pv-volume.yaml
kubectl apply -f pv-claim.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

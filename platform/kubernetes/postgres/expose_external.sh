 
# Expost Postgres Instance Externally on Port 5432
kubectl port-forward --namespace postgres svc/psql-postgresql 5432:5432


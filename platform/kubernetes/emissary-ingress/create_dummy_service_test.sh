## This scripts install a sample service from: https://www.getambassador.io/docs/emissary/latest/tutorials/getting-started/
## This can be used to test if the ingress is working as expected

# Install the service
kubectl apply -f https://app.getambassador.io/yaml/v2-docs/3.1.0/quickstart/qotm.yaml


# Create the Mapping Resource to the service
kubectl apply -f resources/MappingTestService.yaml

# Create Mapping Resourcew with TLS to the service
#kubectl apply -f resources/MappingTestServiceWithTLS.yaml
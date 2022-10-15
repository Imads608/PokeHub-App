# This installs cert-manager through helm and sets the name servers from Azure. 
# Replace nameservers according to entries in Azure DNS Zone

# Add jetstack Helm Repo
helm repo add jetstack https://charts.jetstack.io && helm repo update

# Create cert-manager namespace
kubectl create ns cert-manager

# Install Helm Chart and Create Release with nameservers needed
helm install cert-manager --namespace cert-manager jetstack/cert-manager --set 'extraArgs={--dns01-recursive-nameservers-only,--dns01-recursive-nameservers=ns1-32.azure-dns.com.:53,ns2-32.azure.dns.net.:53,ns3-32.azure-dns.org.:53,ns4-32.azure-dns.info.:53}'


## NOTE: Run below command if wanting to update release with nameservers
#helm upgrade --set 'extraArgs={--dns01-recursive-nameservers-only,--dns01-recursive-nameservers=ns1-32.azure-dns.com.:53,ns2-32.azure.dns.net.:53,ns3-32.azure-dns.org.:53,ns4-32.azure-dns.info.:53}' --namespace cert-manager cert-manager jetstack/cert-manager
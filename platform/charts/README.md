To Package a Chart, typicall the below commands are run
- Go to chart directory, example "pokehub-infra"
- Install dependencies by running "helm dependency update" in the relevant chart directory
- Run "helm package ." to generate the tgz file

To Publish a Chart to a Container Registry, you can follow the below commands
- Get the access token to the Azure Container Registry by running: az acr login --name pokehub --expose-token
- This will generate fields: "accessToken" and "loginServer"
- Set your helm registry to Azure Container Registry: "helm registry login pokehub.azurecr.io --password <access_token>"
- Run the following commands to publish chart: "helm push <tgz_file_name> oci://pokehub.azurecr.io/helm"
To Package a Chart, typicall the below commands are run

- Go to chart directory, example "pokehub-infra"
- Install dependencies by running "helm dependency update" in the relevant chart directory
- Run "helm package ." to generate the tgz file

To Publish a Chart to a Container Registry, you can follow the below commands

- Get the access token to the Azure Container Registry by running: az acr login --name pokehub --expose-token
- This will generate fields: "accessToken" and "loginServer"
- Set your helm registry to Azure Container Registry: "helm registry login pokehub.azurecr.io --password <access_token>"
- Run the following commands to publish chart: "helm push <tgz_file_name> oci://pokehub.azurecr.io/helm"

This is what I'm doing to build and publsh a chart

`helm package platform/charts/pokehub-app`
`helm push pokehub-app-0.1.0.tgz oci://pokehub.azurecr.io/helm`

And then installing and deleting:
`helm install dev oci://pokehub.azurecr.io/helm/pokehub-app --version 0.1.0`


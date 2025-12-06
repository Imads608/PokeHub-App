helm package platform/charts/pokehub-app
helm push pokehub-app-0.1.0.tgz oci://pokehub.azurecr.io/helm

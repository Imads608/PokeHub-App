## Getting Started

There are certain dependencies between the steps, so
it's important to follow these steps in this order to
install your configured Ambassador Edge Stack.


## Install the Ambassador Edge Stack

## You need to have a certificate defined
You would need a self signed certificate or from a certificate authority. Once obtained run:

kubectl create secret tls tls-cert --cert=cert.pem --key=key.pem


## Before Running Instructions, install metallb for a Load Balancer on Prem:

kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.11.0/manifests/namespace.yaml
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.11.0/manifests/metallb.yaml
kubectl apply -f metallb-configmap.yaml

More instructions at: https://metallb.universe.tf/installation/#installation-by-manifest

Connect to your cluster and then run the following commands:

  kubectl apply -f 1-aes-crds.yaml && \
  kubectl wait --for condition=established --timeout=90s crd -lproduct=aes && \
  kubectl apply -f 2-aes.yaml && \
  kubectl -n ambassador wait --for condition=available --timeout=90s deploy -lproduct=aes


## Install Your Custom Resources

Now run the following commands to configure your Ambassador deployment with your custom manifests
generated from your configuration:

  kubectl apply -f 3-user.yaml


## Add the Listener Resource
  
  kubectl apply -f listener.yaml

## Use and share your Kubernetes playground

Navigate to https://$AMBASSADOR_SERVICE_IP/ and start exploring your Kubernetes environment!

## Installing Prometheus

When using Prometheus for collecting metrics from your application, you will need to verify that
the Kubernetes version you are running is version 1.16+ or greater.  To determine this, run:

  kubectl version

and confirm that the "serverVersion" is at least "Major:1, Minor:16+"

To install Prometheus, run:

  kubectl apply -f 4-prometheus-crd.yaml && \
  kubectl wait --for condition=established  --timeout=90s crd -lproduct=aes-prometheus && \
  kubectl apply -f 5-prometheus.yaml

The Prometheus web UI will be available at https://$AMBASSADOR_SERVICE_IP/prometheus/

## Installing OpenTelemetry

To install OpenTelemetry, run:

  kubectl apply -f 8-opentelemetry.yaml &&
  kubectl -n monitoring wait --for condition=available --timeout=90s deploy -lapp=opentelemetry

Configure your custom application for B3 Header Propagation and send trace data to one of the OpenTelemetry service endpoint:
  `otel-collector.monitoring:9411` for Zipkin
  `otel-collector.monitoring:55680` for OpenTelemetry Protocol (OTLP)
  `otel-collector.monitoring:14250` for Jaeger-grpc
  `otel-collector.monitoring:14268` for Jaeger-thrift

## Installing Jaeger

To install Jaeger, run:

  kubectl apply -f 6-jaeger-crds.yaml &&
  kubectl apply -f 7-jaeger.yaml &&
  kubectl -n monitoring wait --for condition=available --timeout=90s deploy -lapp=jaeger

It will take a moment for Jaeger to start.

The Jaeger UI will be available at https://$AMBASSADOR_SERVICE_IP/jaeger/

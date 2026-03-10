# WebShop - Azure Container Services Deployment Guide

## Overview

WebShop is a modern e-commerce application built with .NET 9.0 backend, Angular 20 frontend, and designed for containerized deployment on Azure Container Services. This comprehensive guide covers all aspects of deployment, configuration, and management.

## Architecture

### Technology Stack

**Backend (.NET 9.0)**
- ASP.NET Core Web API
- Entity Framework Core with SQL Server
- Identity Framework for authentication
- SignalR for real-time features
- Stripe payment integration
- Redis caching

**Frontend (Angular 20)**
- Angular Material UI components
- TailwindCSS for styling
- ngx-translate for internationalization
- SignalR client for real-time updates

**Database & Caching**
- Microsoft SQL Server 2022
- Redis for ses 

**Containerization**
- Docker multi-stage builds
- Docker Compose for local development
- Optimized for Azure Container Instances and AKS

## Project Structure

```
WebShop/
├── API/                    # .NET Web API project
├── Core/                   # Domain entities and interfaces
├── Infrastructure/         # Data access and external services
├── client/                 # Angular frontend application
├── docker-compose.yml      # Local development orchestration
├── dockerfile.api         # API container build
├── dockerfile.angular     # Frontend container build
└── .dockerignore          # Docker build exclusions
```

## Container Configuration

### API Container (dockerfile.api)
```dockerfile
# Multi-stage build for optimized production image
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
# Build process...
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
# Production runtime...
```

**Key Features:**
- .NET 9.0 runtime
- Optimized multi-stage build
- Static file serving for Angular SPA
- Seed data integration
- Port 80 exposure

### Frontend Container (dockerfile.angular)
```dockerfile
# Angular build stage
FROM node:20-alpine AS build
# Build process...
FROM nginx:alpine AS production
# Nginx serving...
```

**Key Features:**
- Node.js 20 Alpine build environment
- Angular production build optimization
- Nginx Alpine for lightweight serving
- Port 80 exposure

### Docker Compose Configuration

**Services:**
- **api**: .NET Web API (Port 5001:80)
- **frontend**: Angular SPA (Port 4200:80)
- **sql**: SQL Server 2022 (Port 1433:1433)
- **redis**: Redis cache (Port 6379:6379)

**Networking:**
- Custom bridge network: `webshop-network`
- Service discovery via container names

**Persistence:**
- `sql-data`: Named volume for SQL Server data
- `redis-data`: Named volume for Redis persistence

## Azure Container Services Deployment

### Prerequisites

1. **Azure CLI** installed and configured
2. **Docker** installed locally
3. **Azure Container Registry (ACR)** created
4. **Resource Group** for deployment

### Azure Container Registry Setup

```bash
# Create Azure Container Registry
az acr create --resource-group <resource-group> --name <acr-name> --sku Basic

# Login to ACR
az acr login --name <acr-name>
```

### Build and Push Images

```bash
# Build API image
docker build -f dockerfile.api -t <acr-name>.azurecr.io/webshop-api:latest .

# Build Frontend image
docker build -f dockerfile.angular -t <acr-name>.azurecr.io/webshop-frontend:latest .

# Push images to ACR
docker push <acr-name>.azurecr.io/webshop-api:latest
docker push <acr-name>.azurecr.io/webshop-frontend:latest
```

### Azure Container Instances Deployment

#### Option 1: Individual Container Instances

```bash
# Deploy API container
az container create \
  --resource-group <resource-group> \
  --name webshop-api \
  --image <acr-name>.azurecr.io/webshop-api:latest \
  --cpu 1 --memory 2 \
  --ports 80 \
  --environment-variables \
    "ConnectionStrings__DefaultConnection=Server=<sql-server>,1433;Database=WebShop;User Id=<user>;Password=<password>;TrustServerCertificate=true" \
    "ASPNETCORE_ENVIRONMENT=Production" \
    "ASPNETCORE_URLS=http://+:80"

# Deploy Frontend container
az container create \
  --resource-group <resource-group> \
  --name webshop-frontend \
  --image <acr-name>.azurecr.io/webshop-frontend:latest \
  --cpu 0.5 --memory 1 \
  --ports 80
```

#### Option 2: Container Group with YAML

Create `aci-deployment.yaml`:
```yaml
apiVersion: 2021-09-01
location: <azure-region>
name: webshop-group
properties:
  containers:
  - name: webshop-api
    properties:
      image: <acr-name>.azurecr.io/webshop-api:latest
      resources:
        requests:
          cpu: 1.0
          memoryInGb: 2.0
      ports:
      - port: 80
      environmentVariables:
      - name: ConnectionStrings__DefaultConnection
        value: Server=<sql-server>,1433;Database=WebShop;User Id=<user>;Password=<password>;TrustServerCertificate=true
      - name: ASPNETCORE_ENVIRONMENT
        value: Production
  - name: webshop-frontend
    properties:
      image: <acr-name>.azurecr.io/webshop-frontend:latest
      resources:
        requests:
          cpu: 0.5
          memoryInGb: 1.0
      ports:
      - port: 80
  osType: Linux
  networkProfile:
    id: /subscriptions/<subscription>/resourceGroups/<resource-group>/providers/Microsoft.Network/networkProfiles/webshop-network-profile
tags: {}
type: Microsoft.ContainerInstance/containerGroups
```

Deploy with:
```bash
az container create --resource-group <resource-group> --file aci-deployment.yaml
```

### Azure Kubernetes Service (AKS) Deployment

#### Kubernetes Manifests

**api-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webshop-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: webshop-api
  template:
    metadata:
      labels:
        app: webshop-api
    spec:
      containers:
      - name: api
        image: <acr-name>.azurecr.io/webshop-api:latest
        ports:
        - containerPort: 80
        env:
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: webshop-secrets
              key: database-connection
        - name: ASPNETCORE_ENVIRONMENT
          value: Production
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: webshop-api-service
spec:
  selector:
    app: webshop-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

**frontend-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webshop-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: webshop-frontend
  template:
    metadata:
      labels:
        app: webshop-frontend
    spec:
      containers:
      - name: frontend
        image: <acr-name>.azurecr.io/webshop-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: webshop-frontend-service
spec:
  selector:
    app: webshop-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

#### Deploy to AKS

```bash
# Create AKS cluster
az aks create \
  --resource-group <resource-group> \
  --name <aks-cluster-name> \
  --node-count 2 \
  --enable-addons monitoring \
  --attach-acr <acr-name>

# Get cluster credentials
az aks get-credentials --resource-group <resource-group> --name <aks-cluster-name>

# Deploy manifests
kubectl apply -f api-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# Check deployment status
kubectl get pods
kubectl get services
```

## Configuration Management

### Environment Variables

**Required for API:**
- `ConnectionStrings__DefaultConnection`: SQL Server connection string
- `ConnectionStrings__Redis`: Redis connection string
- `ASPNETCORE_ENVIRONMENT`: Development/Production
- `ASPNETCORE_URLS`: API binding URLs
- `StripeSettings__PublishableKey`: Stripe publishable key
- `StripeSettings__SecretKey`: Stripe secret key
- `StripeSettings__WhSecret`: Stripe webhook secret

### Secrets Management

**Azure Key Vault Integration:**
```bash
# Create Key Vault
az keyvault create --name <keyvault-name> --resource-group <resource-group>

# Store secrets
az keyvault secret set --vault-name <keyvault-name> --name "database-connection" --value "<connection-string>"
az keyvault secret set --vault-name <keyvault-name> --name "stripe-secret-key" --value "<stripe-key>"
```

### Application Settings

**Development (appsettings.Development.json):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=webshop;User Id=SA;Password=Password@1;Encrypt=False;TrustServerCertificate=True",
    "Redis": "localhost"
  },
  "StripeSettings": {
    "PublishableKey": "pk_test_...",
    "SecretKey": "sk_test_...",
    "WhSecret": "whsec_..."
  },
  "UseMockPaymentService": false
}
```

## Database Configuration

### SQL Server on Azure

**Azure SQL Database Setup:**
```bash
# Create SQL Server
az sql server create \
  --name <sql-server-name> \
  --resource-group <resource-group> \
  --location <azure-region> \
  --admin-user <admin-username> \
  --admin-password <admin-password>

# Create database
az sql db create \
  --name WebShop \
  --server <sql-server-name> \
  --resource-group <resource-group> \
  --edition GeneralPurpose \
  --family Gen5 \
  --capacity 2
```

**Connection String Format:**
```
Server=<sql-server-name>.database.windows.net,1433;Database=WebShop;User Id=<username>;Password=<password>;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

### Database Migrations

**Run migrations in container:**
```bash
# Enter API container
docker exec -it <api-container-name> /bin/bash

# Apply migrations
dotnet ef database update -p Infrastructure -s API --context StoreContext
```

## Monitoring and Logging

### Azure Monitor Integration

**Container Insights:**
```bash
# Enable Container Insights
az aks enable-addons -a monitoring --name <aks-cluster-name> --resource-group <resource-group>
```

**Log Analytics Workspace:**
- Container logs aggregation
- Performance metrics
- Custom application logs
- Alert configurations

### Health Checks

**API Health Endpoints:**
- `/healthz` - Basic health check
- `/readyz` - Readiness probe
- `/livez` - Liveness probe

**Kubernetes Health Probes:**
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 80
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /readyz
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Scaling and Performance

### Horizontal Scaling

**AKS Horizontal Pod Autoscaler:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: webshop-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webshop-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Performance Optimization

**Container Resource Limits:**
- API: 1-2 CPU cores, 1-2GB RAM
- Frontend: 0.5 CPU core, 256-512MB RAM
- SQL Server: 2-8 CPU cores, 4-32GB RAM
- Redis: 0.5-1 CPU core, 1-2GB RAM

## Security Considerations

### Network Security

**Azure Network Security Groups:**
- Restrict inbound traffic to necessary ports
- Implement private endpoints for database access
- Use Azure Firewall for outbound filtering

**Container Security:**
- Use non-root users in containers
- Implement image scanning with Azure Defender
- Regular base image updates

### Authentication and Authorization

**Identity Framework Configuration:**
- JWT token-based authentication
- Role-based authorization
- External provider integration (Google, Facebook)

**HTTPS/TLS:**
- Azure Application Gateway for SSL termination
- Certificate management with Azure Key Vault
- Enforce HTTPS redirects

## CI/CD Pipeline

### Azure DevOps Pipeline

**azure-pipelines.yml:**
```yaml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

variables:
  dockerRegistryServiceConnection: '<acr-service-connection>'
  imageRepository: 'webshop-api'
  containerRegistry: '<acr-name>.azurecr.io'
  dockerfilePath: '$(Build.SourcesDirectory)/dockerfile.api'
  tag: '$(Build.BuildId)'

stages:
- stage: Build
  displayName: Build and push stage
  jobs:
  - job: Build
    displayName: Build job
    steps:
    - task: Docker@2
      displayName: Build and push API image
      inputs:
        containerRegistry: $(dockerRegistryServiceConnection)
        repository: $(imageRepository)
        command: buildAndPush
        Dockerfile: $(dockerfilePath)
        tags: |
          $(tag)
          latest
```

### GitHub Actions

**.github/workflows/azure-deploy.yml:**
```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
        
    - name: Build and push API image
      run: |
        docker build -f dockerfile.api -t ${{ secrets.ACR_NAME }}.azurecr.io/webshop-api:${{ github.sha }} .
        docker push ${{ secrets.ACR_NAME }}.azurecr.io/webshop-api:${{ github.sha }}
```

## Troubleshooting

### Common Issues

**Container Startup Failures:**
- Check environment variables
- Verify database connectivity
- Review container logs: `docker logs <container-name>`

**Database Connection Issues:**
- Validate connection string format
- Check firewall rules
- Verify SQL Server authentication

**Performance Issues:**
- Monitor resource utilization
- Check Redis connectivity
- Review SQL query performance

### Debug Commands

```bash
# View container logs
docker logs -f <container-name>

# Execute commands in container
docker exec -it <container-name> /bin/bash

# Check resource usage
docker stats

# Kubernetes pod logs
kubectl logs -f <pod-name>

# Describe pod for issues
kubectl describe pod <pod-name>
```

## Backup and Disaster Recovery

### Database Backup

**Azure SQL Automated Backups:**
- Point-in-time restore (35 days)
- Long-term retention configuration
- Geo-redundant backup storage

### Container Backup Strategy

**Application State Backup:**
- Regular database exports
- Redis data persistence
- Configuration version control

## Cost Optimization

### Azure Cost Management

**Rightsizing Recommendations:**
- Monitor actual resource usage
- Implement auto-shutdown policies
- Use reserved instances for predictable workloads

**Container Optimization:**
- Multi-stage builds to reduce image size
- Shared base images across services
- Efficient layer caching

## Support and Maintenance

### Monitoring Alerts

**Recommended Alerts:**
- High CPU/memory utilization
- Database connection failures
- Application error rates
- SSL certificate expiration

### Maintenance Tasks

**Regular Updates:**
- Base image security patches
- .NET framework updates
- Node.js dependency updates
- Database performance tuning

## Contact and Support

For technical support and questions regarding Azure deployment:
- Azure Documentation: https://docs.microsoft.com/azure/
- Container Registry: https://docs.microsoft.com/azure/container-registry/
- Azure Kubernetes Service: https://docs.microsoft.com/azure/aks/
- Azure Container Instances: https://docs.microsoft.com/azure/container-instances/

---

*This README v3 provides comprehensive guidance for deploying WebShop on Azure Container Services. For local development setup, refer to the existing README files.*

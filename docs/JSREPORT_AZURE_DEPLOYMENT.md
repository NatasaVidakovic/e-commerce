# jsReport Azure Deployment Guide

## Overview
This guide explains how jsReport has been integrated and configured for Azure deployment in the WebShop application.

## Architecture
```
Angular Frontend → .NET API → jsReport Service → PDF Generation
```

## Azure Services
- **Frontend**: Azure Container Apps (webshop-frontend)
- **API**: Azure Container Apps (webshop-api)  
- **jsReport**: Azure Container Apps (jsreport)
- **Registry**: Azure Container Registry (webshopacr)

## Deployment Files

### 1. jsReport Dockerfile
- **File**: `dockerfile.jsreport`
- **Purpose**: Custom jsReport container with authentication disabled
- **Key Settings**:
  - Authentication disabled for easier integration
  - Asset permissions configured for CSS, JS, images
  - Data volume persistence

### 2. Azure Workflow
- **File**: `.github/workflows/jsreport-deploy.yml`
- **Purpose**: Automated deployment to Azure Container Apps
- **Trigger**: Push to main branch or manual dispatch
- **Registry**: webshopacr.azurecr.io
- **Container Name**: jsreport

## Configuration Updates

### 1. API Production Settings
- **File**: `API/appsettings.Production.json`
- **JsReport URL**: `https://jsreport.ambitiousbeach-cb1f5a83.westeurope.azurecontainerapps.io`

### 2. Angular Component
- **File**: `client/src/app/features/admin/analytics-reports/reports-tab/reports-tab.component.ts`
- **Feature**: Fallback URL support for both development and production
- **Development**: `http://localhost:5488/studio`
- **Production**: `https://jsreport.ambitiousbeach-cb1f5a83.westeurope.azurecontainerapps.io/studio`

## Features Implemented

### 1. Backend Services
- `IJsReportService` interface
- `JsReportService` implementation with Handlebars template
- `ReportsController` with PDF generation endpoint
- Designer URL endpoint for frontend integration

### 2. Frontend Integration
- Designer button in admin reports toolbar
- API integration for PDF generation
- Fallback URL handling
- Production/development environment detection

### 3. Template System
- Embedded Handlebars template for PDF generation
- Support for custom templates in jsReport designer
- Dynamic data binding with report metrics
- Professional styling and layout

## Deployment Steps

### 1. Push to GitHub
The deployment is automatically triggered when pushing to the main branch.

### 2. Manual Deployment
You can also trigger deployment manually via GitHub Actions.

### 3. Service URLs
- **Frontend**: https://webshop-frontend.ambitiousbeach-cb1f5a83.westeurope.azurecontainerapps.io
- **API**: https://webshop-api.ambitiousbeach-cb1f5a83.westeurope.azurecontainerapps.io
- **jsReport**: https://jsreport.ambitiousbeach-cb1f5a83.westeurope.azurecontainerapps.io

## Usage

### 1. Access Designer
- In admin reports section, click the design_services icon
- Or directly access: https://jsreport.ambitiousbeach-cb1f5a83.westeurope.azurecontainerapps.io/studio

### 2. Generate Reports
- Select report type and filters in admin interface
- Click download button for PDF export
- Reports are generated server-side by jsReport

### 3. Custom Templates
- Create templates in jsReport designer
- Save with meaningful names
- Reference by name in `JsReportService` if needed

## Security Considerations
- jsReport authentication is disabled for internal service communication
- Access controlled by Azure Container Apps networking
- API endpoints require Admin role authorization
- CORS configured for allowed origins only

## Monitoring
- Azure Container Apps provides built-in monitoring
- Check logs in Azure Portal for troubleshooting
- Health endpoints can be added if needed

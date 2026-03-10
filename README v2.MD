## Run commands

### stripe setup
``` bash
stripe listen --forward-to https://localhost:5001/api/payments/webhook -e payment_intent.succeeded --api-key sk_test_51SDgJ4IrOvm46oJjvQIgiRuhKY2zSzOIMRThdAZh64c36Sb8n6EAJbwuFgztLWTDphE7fb7qrCBC57sfgI4dRrkv001flQJTRM
```

## Users

### admin

### basic user
```
mmijob80838@etenx.com
```


## Uputstvo za migraciju

``` bash

dotnet ef migrations add FixCoupon -p Infrastructure -s API --context StoreContext --output-dir Migrations

```
``` bash
dotnet ef database update -p Infrastructure -s API
```
dotnet ef database update ChangeReviewRelationWithAppUser -p Infrastructure -s API --context StoreContext

### rolback

1. Dohvatiti sve liste da se dobije naziv pretposljednje migracije:
```bash
dotnet ef migrations list -p Infrastructure -s API --context StoreContext
```

2. Pozvati komantu update sa nazivom pretposljednje migracije. Posljedna migracija ide u stanje Pending, brise se izmjena iz baze
```bash
# dotnet ef database update NazivPretposljednjeMigracije -p Infrastructure -s API
dotnet ef database update 0 -p Infrastructure -s API

dotnet ef database update 20260110184200_AddIsActiveToDiscount -p Infrastructure -s API
```
3. Brisanje migracije iz koda (vjerovatno svih sa stanjem pending)
```bash
dotnet ef migrations remove -p Infrastructure -s API --context StoreContext
```


dotnet ef database update ColumnNames -p Infrastructure -s API

```
az login
az acr login --name webshopacr


```

## CICD

### docker image deploy
t
``` bash

docker build -f dockerfile.frontend -t webshopacr.azurecr.io/webshop-frontend:latest . --no-cache
docker push webshopacr.azurecr.io/webshop-frontend:latest
az containerapp update --name webshop-frontend --resource-group WebShopRG --image webshopacr.azurecr.io/webshop-frontend:latest --min-replicas 1

docker build -f dockerfile.api -t webshopacr.azurecr.io/webshop-api:latest . --no-cache
docker push webshopacr.azurecr.io/webshop-api:latest
az containerapp update --name webshop-api --resource-group WebShopRG --image webshopacr.azurecr.io/webshop-api:latest --min-replicas 1

docker build -f dockerfile.redis -t webshopacr.azurecr.io/webshop-redis:latest . --no-cache
docker push webshopacr.azurecr.io/webshop-redis:latest
az containerapp update --name webshop-redis --resource-group WebShopRG --min-replicas 0


```

```bash
az containerapp update --name webshop-frontend --resource-group WebShopRG --min-replicas 0
az containerapp update --name webshop-frontend --resource-group WebShopRG --min-replicas 1

az containerapp update --name webshop-api --resource-group WebShopRG --min-replicas 0
az containerapp update --name webshop-api --resource-group WebShopRG --min-replicas 1


docker build -f dockerfile.frontend -t webshopacr.azurecr.io/webshop-frontend:latest . --no-cache


```

## Kartica
``` txt
5555 5555 5555 4444
12/25 123
```
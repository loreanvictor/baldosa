# Contribution

## Server

To run the server, use docker-compose

```bash
docker-compose up --build
```

You may also modify the development config file to run the server without a container


`config.yaml`:
```yaml
database:
  conn_string: postgres://baldosa:complex_password@localhost:5432/baldosa?sslmode=disable
http_server:
  addr: :8000
s3_client:
  endpoint: http://localhost:9000
  region: us-east-1
  access_key: minioadmin
  secret_key: minioadmin
  bucket: baldosa
```

However, you need to have running instance of Postgres and MinIO, which can be got hold of using the very same
docker-compose file without running the `web` service.

## Client

TODO

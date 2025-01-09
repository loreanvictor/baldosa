FROM golang:1.23.4-bookworm AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/bin/baldosa ./cmd/

FROM ubuntu:25.04

WORKDIR /app

COPY --from=builder /app/bin/baldosa .

CMD ["./baldosa"]

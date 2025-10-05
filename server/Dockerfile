FROM golang:1.25.0-alpine AS builder

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./src

FROM scratch AS application

WORKDIR /app
COPY --from=builder /server ./server

CMD ["./server"]

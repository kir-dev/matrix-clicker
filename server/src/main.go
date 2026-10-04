package main

import (
	"flag"
	"log"
	"os"

	"kir-dev.hu/matrix-clicker/src/game"
	"kir-dev.hu/matrix-clicker/src/server"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	// Defaults
	defaultOrigin := "http://localhost:3000"
	defaultAddr := ":8080"
	defaultSecret := "secret"
	defaultMetricsAddr := ":9090"

	// Read from env with fallback
	if val, ok := os.LookupEnv("FRONTEND_ORIGIN"); ok {
		defaultOrigin = val
	}
	if val, ok := os.LookupEnv("ADDR"); ok {
		defaultAddr = val
	}
	if val, ok := os.LookupEnv("METRICS_ADDR"); ok {
		defaultMetricsAddr = val
	}
	if val, ok := os.LookupEnv("SECRET"); ok {
		defaultSecret = val
	}

	// Flags still override env if provided
	frontendOrigin := flag.String("origin", defaultOrigin, "frontend origin")
	addr := flag.String("addr", defaultAddr, "http service address")
	metricsAddr := flag.String("metrics-addr", defaultMetricsAddr, "prometheus metrics address, empty disables")
	secret := flag.String("secret", defaultSecret, "management secret")

	flag.Parse()

	log.Println("Origin:", *frontendOrigin)
	log.Println("Addr:", *addr)
	log.Println("Metrics addr:", *metricsAddr)

	g := game.NewGame()
	server.StartServer(frontendOrigin, *secret, addr, *metricsAddr, g)
}

package server

import (
	"crypto/subtle"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"kir-dev.hu/matrix-clicker/src/game"
	"kir-dev.hu/matrix-clicker/src/metrics"
	"kir-dev.hu/matrix-clicker/src/server/ws"
)

func listenForGracefulShutdownRequest(servers ...*http.Server) {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	for _, server := range servers {
		// Not fatal: every server must get its Close call.
		if err := server.Close(); err != nil {
			log.Printf("HTTP close error: %v", err)
		}
	}
}

func enableCors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// managementHandler gates a management endpoint: CORS (including the preflight), POST only, and a
// {"secret": …} body that must match secret. handle runs only once all of that passed.
func managementHandler(secret string, handle func(w http.ResponseWriter)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		enableCors(w)
		switch r.Method {
		case http.MethodOptions:
			w.WriteHeader(http.StatusNoContent)
			return
		case http.MethodPost:
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var command ws.GameManagementDto
		if err := json.NewDecoder(r.Body).Decode(&command); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if subtle.ConstantTimeCompare([]byte(command.Secret), []byte(secret)) != 1 {
			w.WriteHeader(http.StatusForbidden)
			return
		}

		handle(w)
	}
}

func writeOk(w http.ResponseWriter) {
	_, _ = w.Write([]byte("ok"))
}

func writeTeamSizes(w http.ResponseWriter, game game.Game) {
	response, err := json.Marshal(game.GetTeamSizes())
	if err != nil {
		log.Printf("failed to marshal team sizes: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(response)
}

// StartServer serves the game API on addr and, unless metricsAddr is empty, Prometheus metrics on
// a separate listener at metricsAddr. The separate port keeps /metrics off the public Ingress,
// which forwards the whole / prefix of the main port.
func StartServer(frontendOrigin *string, secret string, addr *string, metricsAddr string, game game.Game) {
	server := &http.Server{Addr: *addr}

	hub := ws.NewHub(game)
	go hub.StartBroadcast()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) { ws.ServeWs(hub, w, r, *frontendOrigin) })

	http.Handle("/start-game", managementHandler(secret, func(w http.ResponseWriter) { game.Start(); writeOk(w) }))
	http.Handle("/stop-game", managementHandler(secret, func(w http.ResponseWriter) { game.Stop(); writeOk(w) }))
	http.Handle("/manage", managementHandler(secret, writeOk))
	http.Handle("/team-sizes", managementHandler(secret, func(w http.ResponseWriter) { writeTeamSizes(w, game) }))

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte("Hi :)")) })

	servers := []*http.Server{server}
	if metricsAddr != "" {
		// Own mux: /metrics must never end up on the DefaultServeMux that the main listener uses.
		mux := http.NewServeMux()
		mux.Handle("/metrics", metrics.Handler(metrics.NewRegistry(game, hub)))
		metricsServer := &http.Server{Addr: metricsAddr, Handler: mux}
		servers = append(servers, metricsServer)
		go func() {
			if err := metricsServer.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
				log.Fatalf("metrics server error: %v", err)
			}
		}()
	}

	go listenForGracefulShutdownRequest(servers...)
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("HTTP server error: %v", err)
	}
}

package server

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"kir-dev.hu/matrix-clicker/src/game"
	"kir-dev.hu/matrix-clicker/src/server/ws"
)

func listenForGracefulShutdownRequest(server *http.Server) {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	if err := server.Close(); err != nil {
		log.Fatalf("HTTP close error: %v", err)
	}
}

func enableCors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func startGame(w http.ResponseWriter, r *http.Request, secret string, game game.Game) {
	enableCors(w)
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var command ws.StartGameDto
	err := decoder.Decode(&command)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if command.Secret != secret {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	game.Start()
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func stopGame(w http.ResponseWriter, r *http.Request, secret string, game game.Game) {
	enableCors(w)
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var command ws.GameManagementDto
	err := decoder.Decode(&command)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if command.Secret != secret {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	game.Stop()
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func manage(w http.ResponseWriter, r *http.Request, secret string) {
	enableCors(w)
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var command ws.GameManagementDto
	err := decoder.Decode(&command)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if command.Secret != secret {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func teams(w http.ResponseWriter, r *http.Request, secret string, game game.Game) {
	enableCors(w)
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var command ws.GameManagementDto
	err := decoder.Decode(&command)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if command.Secret != secret {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)

	response, err := json.Marshal(game.GetTeamSizes())
	if err != nil {
		log.Println("Error marshalling response: ", err)
	}
	_, _ = w.Write(response)
}

func StartServer(frontendOrigin *string, secret string, addr *string, game game.Game) {
	server := &http.Server{Addr: *addr}

	hub := ws.NewHub(game)
	go hub.StartBroadcast()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) { ws.ServeWs(hub, w, r, *frontendOrigin) })

	http.HandleFunc("/start-game", func(w http.ResponseWriter, r *http.Request) { startGame(w, r, secret, game) })
	http.HandleFunc("/stop-game", func(w http.ResponseWriter, r *http.Request) { stopGame(w, r, secret, game) })
	http.HandleFunc("/manage", func(w http.ResponseWriter, r *http.Request) { manage(w, r, secret) })
	http.HandleFunc("/team-sizes", func(w http.ResponseWriter, r *http.Request) { teams(w, r, secret, game) })

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte("Hi :)")) })

	go listenForGracefulShutdownRequest(server)
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("HTTP server error: %v", err)
	}
}

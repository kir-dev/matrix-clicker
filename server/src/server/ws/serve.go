package ws

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request, frontendOrigin string) {
	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			return len(origin) == 0 || origin == frontendOrigin
		},
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("failed to upgrade connection %v", err)
		return
	}
	playerId := r.URL.Query().Get("playerId")
	upgradedConnection := newClient(conn, hub, playerId)

	hub.game.RegisterPlayer(&upgradedConnection.player)
	hub.register <- upgradedConnection

	go upgradedConnection.writePump()
	go upgradedConnection.readPump()

}

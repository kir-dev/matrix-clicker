package ws

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
	"kir-dev.hu/matrix-clicker/src/game"
)

const (
	writeWait      = 5 * time.Second
	pongWait       = 20 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 1024
)

type client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan GameDto
	syncSend chan ServerSyncMessage
	player   game.Player
}

func newClient(conn *websocket.Conn, hub *Hub, playerId string) *client {
	return &client{
		hub:      hub,
		conn:     conn,
		send:     make(chan GameDto, 256),
		syncSend: make(chan ServerSyncMessage, 1),
		player:   game.NewPlayer(playerId),
	}
}

func (c *client) readPump() {
	defer func() {
		c.hub.unregister <- c
		close(c.syncSend)
		_ = c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { _ = c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		var message GameClientMessage
		err := c.conn.ReadJSON(&message)
		if err != nil {
			log.Printf("error: %v", err)
			break
		}

		if message.Type == "sync" {
			c.syncSend <- ServerSyncMessage{
				Type:       "sync",
				ServerTime: time.Now(),
			}
		} else {
			c.hub.game.RegisterScore(message.Cps, c.player)
		}
	}
}

func (c *client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			err := c.conn.WriteJSON(message)
			if err != nil {
				log.Printf("failed to send json message: %v", err)
			}
		case syncMsg, ok := <-c.syncSend:
			if !ok {
				return
			}
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			err := c.conn.WriteJSON(syncMsg)
			if err != nil {
				log.Printf("failed to send sync message: %v", err)
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

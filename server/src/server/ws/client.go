package ws

import (
	"encoding/json"
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
	hub    *Hub
	conn   *websocket.Conn
	send   chan GameDto
	pong   chan float64
	player game.Player
}

func newClient(conn *websocket.Conn, hub *Hub, playerId string) *client {
	return &client{
		hub:    hub,
		conn:   conn,
		send:   make(chan GameDto, 256),
		pong:   make(chan float64, 8),
		player: game.NewPlayer(playerId),
	}
}

func (c *client) readPump() {
	defer func() {
		c.hub.unregister <- c
		_ = c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { _ = c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			log.Printf("error: %v", err)
			break
		}
		// A message that does not decode is dropped like an unknown type; only a failed read ends
		// the connection.
		var message GameClientMessage
		if err := json.Unmarshal(data, &message); err != nil {
			c.hub.stats.MalformedMessages.Add(1)
			log.Printf("malformed message from player %q: %v", c.player.Id, err)
			continue
		}

		switch message.Type {
		case CpsMessageType:
			c.hub.stats.CpsMessages.Add(1)
			c.hub.game.RegisterScore(message.Cps, c.player)
		case PingMessageType:
			c.hub.stats.PingMessages.Add(1)
			// Never block the read loop: a client that cannot drain its pongs simply gets fewer.
			select {
			case c.pong <- message.ClientTime:
			default:
			}
		default:
			c.hub.stats.UnknownMessages.Add(1)
			log.Printf("unknown message type %q from player %q", message.Type, c.player.Id)
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

			// A failed write leaves the connection unusable: return, and the deferred Close makes
			// readPump unregister the client.
			if err := c.conn.WriteJSON(message); err != nil {
				c.hub.stats.WriteErrors.Add(1)
				log.Printf("failed to send json message: %v", err)
				return
			}
			c.hub.stats.GameMessagesSent.Add(1)
		case clientTime := <-c.pong:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			// Stamp as late as possible so time spent queued behind other writes is not reported
			// to the client as server time.
			pong := PongDto{Type: PongMessageType, ClientTime: clientTime, ServerTime: time.Now()}
			if err := c.conn.WriteJSON(pong); err != nil {
				c.hub.stats.WriteErrors.Add(1)
				log.Printf("failed to send pong: %v", err)
				return
			}
			c.hub.stats.PongMessagesSent.Add(1)
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				c.hub.stats.WriteErrors.Add(1)
				return
			}
		}
	}
}

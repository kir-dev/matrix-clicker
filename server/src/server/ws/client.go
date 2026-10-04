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
	hub  *Hub
	conn *websocket.Conn
	// send carries game snapshots; it is owned (written and closed) by the hub goroutine.
	send chan GameDto
	// pong carries the client timestamps of pings awaiting an answer. readPump fills it, writePump
	// drains it. It is separate from send so that readPump never writes to a channel the hub may
	// close underneath it.
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
		var message GameClientMessage
		err := c.conn.ReadJSON(&message)
		if err != nil {
			log.Printf("error: %v", err)
			break
		}

		switch message.Type {
		case CpsMessageType:
			c.hub.game.RegisterScore(message.Cps, c.player)
		case PingMessageType:
			// Never block the read loop: a client that cannot drain its pongs simply gets fewer.
			select {
			case c.pong <- message.ClientTime:
			default:
			}
		default:
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

			err := c.conn.WriteJSON(message)
			if err != nil {
				log.Printf("failed to send json message: %v", err)
			}
		case clientTime := <-c.pong:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			// Stamp as late as possible so time spent queued behind other writes is not reported
			// to the client as server time.
			pong := PongDto{Type: PongMessageType, ClientTime: clientTime, ServerTime: time.Now()}
			if err := c.conn.WriteJSON(pong); err != nil {
				log.Printf("failed to send pong: %v", err)
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

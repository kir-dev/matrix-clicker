package ws

import (
	"time"

	"kir-dev.hu/matrix-clicker/src/game"
)

type Hub struct {
	game       game.Game
	clients    map[*client]bool
	register   chan *client
	unregister chan *client
	stats      Stats
}

func NewHub(game game.Game) *Hub {
	return &Hub{
		game:       game,
		register:   make(chan *client),
		unregister: make(chan *client),
		clients:    make(map[*client]bool),
	}
}

func (h *Hub) StartBroadcast() {
	for {
		select {
		case client := <-h.register:
			h.addClient(client)
			dto := h.gameDto()
			dto.Player = client.player
			client.send <- dto
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				h.removeClient(client)
			}
		case <-h.game.UpdateChannel():
			if h.game.ShouldSendScheduledUpdate() {
				sendGameStateToClients(h)
			}
		case <-h.game.PhaseTransitionChannel():
			sendGameStateToClients(h)
		}
	}
}

func (h *Hub) Stats() *Stats {
	return &h.stats
}

func (h *Hub) addClient(c *client) {
	h.clients[c] = true
	h.stats.active(c).Add(1)
	if c.player.Id != "" {
		h.stats.PlayerConnections.Add(1)
	} else {
		h.stats.AnonymousConnections.Add(1)
	}
}

func (h *Hub) removeClient(c *client) {
	delete(h.clients, c)
	close(c.send)
	h.stats.active(c).Add(-1)
}

func sendGameStateToClients(h *Hub) {
	h.stats.Broadcasts.Add(1)
	dto := h.gameDto()
	for client := range h.clients {
		dto.Player = client.player
		select {
		case client.send <- dto:
		default:
			h.stats.SlowClientDrops.Add(1)
			h.removeClient(client)
		}
	}
}

func (h *Hub) gameDto() GameDto {
	s := h.game.Snapshot()
	return GameDto{
		Type:       GameStateMessageType,
		ServerTime: time.Now(),
		Phase:      s.Phase.String(),
		Teams:      s.Teams,
		StartTime:  s.StartTime,
		EndTime:    s.EndTime,
	}
}

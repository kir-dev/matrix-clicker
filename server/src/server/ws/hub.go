package ws

import "kir-dev.hu/matrix-clicker/src/game"

type Hub struct {
	game       game.Game
	clients    map[*client]bool
	register   chan *client
	unregister chan *client
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
			h.clients[client] = true
			client.send <- getGameStateDtoForClient(client, h.game)
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
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

func sendGameStateToClients(h *Hub) {
	for client := range h.clients {
		select {
		case client.send <- getGameStateDtoForClient(client, h.game):
		default:
			close(client.send)
			delete(h.clients, client)
		}
	}
}

func getGameStateDtoForClient(client *client, game game.Game) GameDto {
	return GameDto{
		Phase:     game.GetPhase().String(),
		Player:    client.player,
		Teams:     game.GetTeamScores(),
		StartTime: game.StartTime(),
		EndTime:   game.EndTime(),
	}
}

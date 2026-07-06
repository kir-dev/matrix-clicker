package ws

import (
	"time"

	"kir-dev.hu/matrix-clicker/src/game"
)

type GameDto struct {
	Phase     string           `json:"phase"`
	Player    game.Player      `json:"player"`
	Teams     []game.TeamScore `json:"teamScore"`
	StartTime time.Time        `json:"startTime"`
	EndTime   time.Time        `json:"endTime"`
}

type GameClientMessage struct {
	Type string `json:"type"`
	Cps  uint64 `json:"cps,omitempty"`
}

type ServerSyncMessage struct {
	Type       string    `json:"type"`
	ServerTime time.Time `json:"serverTime"`
}

type GameManagementDto struct {
	Secret string `json:"secret"`
}

type StartGameDto struct {
	GameManagementDto
}

package ws

import (
	"time"

	"kir-dev.hu/matrix-clicker/src/game"
)

const (
	GameStateMessageType = "game"
	PongMessageType      = "pong"
	CpsMessageType       = "cps"
	PingMessageType      = "ping"
)

type GameDto struct {
	Type       string           `json:"type"`
	ServerTime time.Time        `json:"serverTime"`
	Phase      string           `json:"phase"`
	Player     game.Player      `json:"player"`
	Teams      []game.TeamScore `json:"teamScore"`
	StartTime  time.Time        `json:"startTime"`
	EndTime    time.Time        `json:"endTime"`
}

type PongDto struct {
	Type       string    `json:"type"`
	ClientTime float64   `json:"clientTime"`
	ServerTime time.Time `json:"serverTime"`
}

type GameClientMessage struct {
	Type       string  `json:"type"`
	Cps        uint64  `json:"cps,omitempty"`
	ClientTime float64 `json:"clientTime,omitempty"`
}

type GameManagementDto struct {
	Secret string `json:"secret"`
}

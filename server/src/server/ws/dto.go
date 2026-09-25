package ws

import (
	"time"

	"kir-dev.hu/matrix-clicker/src/game"
)

type GameDto struct {
	ServerTime time.Time        `json:"serverTime"`
	Phase      string           `json:"phase"`
	Player     game.Player      `json:"player"`
	Teams      []game.TeamScore `json:"teamScore"`
	StartTime  time.Time        `json:"startTime"`
	EndTime    time.Time        `json:"endTime"`
}

type GameClientMessage struct {
	Cps uint64 `json:"cps"`
}

type GameManagementDto struct {
	Secret string `json:"secret"`
}

type StartGameDto struct {
	GameManagementDto
}

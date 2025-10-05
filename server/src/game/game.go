package game

import (
	"context"
	"log"
	"sync"
	"time"
)

type game struct {
	teamScores             []TeamScore
	stateMutex             sync.Mutex
	ticker                 *time.Ticker
	startTime              time.Time
	phaseTransitionChannel chan Phase
	playersAssignedToTeams map[string]byte
	playerAssignMutex      sync.Mutex
	gameContext            context.Context
	cancelGameContext      context.CancelFunc
}

type Game interface {
	Start()
	Stop()
	GetPhase() Phase
	UpdateChannel() <-chan time.Time
	ShouldSendScheduledUpdate() bool
	PhaseTransitionChannel() <-chan Phase
	GetTeamSizes() []uint32
	GetTeamScores() []TeamScore
	RegisterScore(clicksPerSecond uint64, player Player)
	RegisterPlayer(player *Player)
	StartTime() time.Time
	EndTime() time.Time
}

type TeamScore struct {
	Score uint64 `json:"score"`
}

func NewGame() Game {
	return &game{
		teamScores:             make([]TeamScore, NumberOfTeams),
		ticker:                 time.NewTicker(TickRate),
		phaseTransitionChannel: make(chan Phase, 1),
		playersAssignedToTeams: make(map[string]byte),
	}
}

func (g *game) Start() {
	g.stateMutex.Lock()
	defer g.stateMutex.Unlock()

	ctx, cancel := context.WithCancel(context.Background())
	if g.gameContext != nil {
		g.cancelGameContext()
	}
	g.gameContext = ctx
	g.cancelGameContext = cancel
	g.startTime = time.Now().Add(StartingTimeout)
	g.teamScores = make([]TeamScore, NumberOfTeams)

	go g.setUpPhaseTransitions(ctx)
}

func (g *game) setUpPhaseTransitions(ctx context.Context) {
	// Notify setup stage
	g.phaseTransitionChannel <- g.GetPhase()

	// Notify starting the game
	select {
	case <-time.After(StartingTimeout):
		g.phaseTransitionChannel <- g.GetPhase()
	case <-ctx.Done():
		return
	}

	// Notify ending the game
	select {
	case <-time.After(RoundDuration):
		g.phaseTransitionChannel <- g.GetPhase()
	case <-ctx.Done():
		return
	}
}

func (g *game) Stop() {
	func() {
		g.stateMutex.Lock()
		defer g.stateMutex.Unlock()

		g.startTime = time.Time{}
		if g.cancelGameContext != nil {
			g.cancelGameContext()
			g.gameContext = nil
			g.cancelGameContext = nil
		}
	}()

	g.phaseTransitionChannel <- g.GetPhase()
}

func (g *game) GetPhase() Phase {
	g.stateMutex.Lock()
	defer g.stateMutex.Unlock()

	if g.startTime.IsZero() {
		return WaitingForPlayers
	}

	now := time.Now()
	if now.Before(g.startTime) {
		return Starting
	}

	if now.Before(g.startTime.Add(RoundDuration)) {
		return Playing
	}

	return Finished
}

func (g *game) UpdateChannel() <-chan time.Time {
	return g.ticker.C
}

func (g *game) ShouldSendScheduledUpdate() bool {
	return g.GetPhase() == Playing
}

func (g *game) PhaseTransitionChannel() <-chan Phase {
	return g.phaseTransitionChannel
}

func (g *game) GetTeamSizes() []uint32 {
	g.stateMutex.Lock()
	defer g.stateMutex.Unlock()

	sizes := make([]uint32, NumberOfTeams)
	for _, team := range g.playersAssignedToTeams {
		sizes[team] += 1
	}
	return sizes
}
func (g *game) GetTeamScores() []TeamScore {
	g.stateMutex.Lock()
	defer g.stateMutex.Unlock()

	return g.teamScores
}

func (g *game) StartTime() time.Time {
	g.stateMutex.Lock()
	defer g.stateMutex.Unlock()

	return g.startTime
}

func (g *game) EndTime() time.Time {
	g.stateMutex.Lock()
	defer g.stateMutex.Unlock()

	return g.startTime.Add(RoundDuration)
}

func (g *game) RegisterScore(clicksPerSecond uint64, player Player) {
	if len(player.Id) == 0 || clicksPerSecond == 0 || g.GetPhase() != Playing {
		return
	}
	if clicksPerSecond > CpsHardLimit {
		log.Printf("player reached clicksPerSecond hard limit %v: %d cps\n", player, clicksPerSecond)
		return
	}

	g.stateMutex.Lock()
	defer g.stateMutex.Unlock()
	g.teamScores[player.Team].Score += clicksPerSecond
}

func (g *game) RegisterPlayer(player *Player) {
	if len(player.Id) == 0 {
		return
	}

	g.playerAssignMutex.Lock()
	defer g.playerAssignMutex.Unlock()

	// Using cached team for the player who is reconnecting
	if team, ok := g.playersAssignedToTeams[player.Id]; ok {
		player.Team = team
		return
	}
	team := byte(len(g.playersAssignedToTeams) % NumberOfTeams)
	g.playersAssignedToTeams[player.Id] = team
	player.Team = team
}

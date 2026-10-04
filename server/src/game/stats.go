package game

import "sync/atomic"

type ScoreResult int

const (
	ScoreAccepted ScoreResult = iota
	ScoreZero
	ScoreAnonymous
	ScoreNotPlaying
	ScoreOverLimit
	ScoreResultCount
)

func (r ScoreResult) String() string {
	switch r {
	case ScoreAccepted:
		return "accepted"
	case ScoreZero:
		return "zero"
	case ScoreAnonymous:
		return "anonymous"
	case ScoreNotPlaying:
		return "not_playing"
	case ScoreOverLimit:
		return "over_limit"
	}
	panic("unreachable")
}

type Stats struct {
	TeamClicks     [NumberOfTeams]atomic.Uint64
	ScoreReports   [ScoreResultCount]atomic.Uint64
	RoundsStarted  atomic.Uint64
	RoundsStopped  atomic.Uint64
	RoundsFinished atomic.Uint64
}

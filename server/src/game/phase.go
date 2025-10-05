package game

type Phase int

const (
	WaitingForPlayers Phase = iota
	// Starting Phase lets the clients prepare for Playing
	Starting
	Playing
	Finished
)

func (p Phase) String() string {
	switch p {
	case WaitingForPlayers:
		return "WaitingForPlayers"
	case Starting:
		return "Starting"
	case Playing:
		return "Playing"
	case Finished:
		return "Finished"
	}
	panic("unreachable")
}

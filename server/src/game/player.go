package game

type Player struct {
	Id   string `json:"id"`
	Team byte   `json:"team"`
}

func NewPlayer(id string) Player {
	return Player{Id: id}
}

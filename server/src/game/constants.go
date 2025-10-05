package game

import "time"

const NumberOfTeams = 4

// CpsHardLimit is the theoretical limit for how fast can someone click
const CpsHardLimit = 20

const TickRate = time.Millisecond * 200

const StartingTimeout = time.Second * 10

const RoundDuration = time.Minute * 1

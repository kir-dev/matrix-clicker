package ws

import "sync/atomic"

// Stats are process-lifetime counters and gauges about the websocket layer. They are written with
// atomics at the event sites and read by the metrics package at scrape time.
//
// The Active* gauges are the only way to observe the client set from outside the hub goroutine:
// Hub.clients has no mutex and must never be read by a scrape.
type Stats struct {
	// ActivePlayerConnections is the number of open connections that carry a playerId.
	ActivePlayerConnections atomic.Int64
	// ActiveAnonymousConnections is the number of open connections without a playerId (display,
	// management).
	ActiveAnonymousConnections atomic.Int64
	// PlayerConnections and AnonymousConnections count every connection ever registered.
	PlayerConnections    atomic.Uint64
	AnonymousConnections atomic.Uint64
	// UpgradeFailures counts HTTP requests that failed the websocket upgrade (bad origin etc).
	UpgradeFailures atomic.Uint64
	// SlowClientDrops counts clients evicted because their send buffer was full.
	SlowClientDrops atomic.Uint64
	// Broadcasts counts game snapshot fan-outs to all clients.
	Broadcasts atomic.Uint64
	// Messages received from clients, by type.
	CpsMessages     atomic.Uint64
	PingMessages    atomic.Uint64
	UnknownMessages atomic.Uint64
	// MalformedMessages counts messages that were not valid GameClientMessage JSON.
	MalformedMessages atomic.Uint64
	// Messages successfully written to clients, by type.
	GameMessagesSent atomic.Uint64
	PongMessagesSent atomic.Uint64
	// WriteErrors counts failed writes of any kind, including websocket ping frames.
	WriteErrors atomic.Uint64
}

// active returns the gauge that tracks connections of the given client's kind.
func (s *Stats) active(c *client) *atomic.Int64 {
	if c.player.Id != "" {
		return &s.ActivePlayerConnections
	}
	return &s.ActiveAnonymousConnections
}

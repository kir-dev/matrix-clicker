package metrics

import (
	"time"

	"github.com/prometheus/client_golang/prometheus"

	"kir-dev.hu/matrix-clicker/src/server/ws"
)

const (
	kindPlayer    = "player"
	kindAnonymous = "anonymous"
	typeUnknown   = "unknown"
	typeMalformed = "malformed"
)

type wsCollector struct {
	stats *ws.Stats

	connectionsActive *prometheus.Desc
	connectionsTotal  *prometheus.Desc
	upgradeFailures   *prometheus.Desc
	slowClientDrops   *prometheus.Desc
	broadcasts        *prometheus.Desc
	messagesReceived  *prometheus.Desc
	messagesSent      *prometheus.Desc
	writeErrors       *prometheus.Desc
}

func newWsCollector(stats *ws.Stats) *wsCollector {
	name := func(s string) string { return prometheus.BuildFQName(namespace, "ws", s) }
	return &wsCollector{
		stats: stats,
		connectionsActive: prometheus.NewDesc(name("connections_active"),
			"Open websocket connections. kind=player carries a playerId; kind=anonymous is the display or management view.",
			[]string{"kind"}, nil),
		connectionsTotal: prometheus.NewDesc(name("connections_total"),
			"Websocket connections registered since process start.",
			[]string{"kind"}, nil),
		upgradeFailures: prometheus.NewDesc(name("upgrade_failures_total"),
			"HTTP requests to /ws that failed the websocket upgrade, e.g. because of a bad Origin.",
			nil, nil),
		slowClientDrops: prometheus.NewDesc(name("slow_client_drops_total"),
			"Clients evicted because their send buffer was full.",
			nil, nil),
		broadcasts: prometheus.NewDesc(name("broadcasts_total"),
			"Game snapshot fan-outs to all clients (200 ms ticks while Playing plus phase transitions).",
			nil, nil),
		messagesReceived: prometheus.NewDesc(name("messages_received_total"),
			"Messages received from clients, by type.",
			[]string{"type"}, nil),
		messagesSent: prometheus.NewDesc(name("messages_sent_total"),
			"Messages successfully written to clients, by type.",
			[]string{"type"}, nil),
		writeErrors: prometheus.NewDesc(name("write_errors_total"),
			"Failed websocket writes of any kind, including ping frames.",
			nil, nil),
	}
}

func (c *wsCollector) Describe(ch chan<- *prometheus.Desc) {
	for _, d := range []*prometheus.Desc{
		c.connectionsActive, c.connectionsTotal, c.upgradeFailures, c.slowClientDrops,
		c.broadcasts, c.messagesReceived, c.messagesSent, c.writeErrors,
	} {
		ch <- d
	}
}

func (c *wsCollector) Collect(ch chan<- prometheus.Metric) {
	s := c.stats
	gauge := func(d *prometheus.Desc, v int64, labels ...string) {
		ch <- prometheus.MustNewConstMetric(d, prometheus.GaugeValue, float64(v), labels...)
	}
	counter := func(d *prometheus.Desc, v uint64, labels ...string) {
		ch <- prometheus.MustNewConstMetric(d, prometheus.CounterValue, float64(v), labels...)
	}

	gauge(c.connectionsActive, s.ActivePlayerConnections.Load(), kindPlayer)
	gauge(c.connectionsActive, s.ActiveAnonymousConnections.Load(), kindAnonymous)
	counter(c.connectionsTotal, s.PlayerConnections.Load(), kindPlayer)
	counter(c.connectionsTotal, s.AnonymousConnections.Load(), kindAnonymous)
	counter(c.upgradeFailures, s.UpgradeFailures.Load())
	counter(c.slowClientDrops, s.SlowClientDrops.Load())
	counter(c.broadcasts, s.Broadcasts.Load())
	counter(c.messagesReceived, s.CpsMessages.Load(), ws.CpsMessageType)
	counter(c.messagesReceived, s.PingMessages.Load(), ws.PingMessageType)
	counter(c.messagesReceived, s.UnknownMessages.Load(), typeUnknown)
	counter(c.messagesReceived, s.MalformedMessages.Load(), typeMalformed)
	counter(c.messagesSent, s.GameMessagesSent.Load(), ws.GameStateMessageType)
	counter(c.messagesSent, s.PongMessagesSent.Load(), ws.PongMessageType)
	counter(c.writeErrors, s.WriteErrors.Load())
}

func unixSeconds(t time.Time) float64 {
	return float64(t.UnixNano()) / float64(time.Second)
}

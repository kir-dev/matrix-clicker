package metrics

import (
	"log"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"kir-dev.hu/matrix-clicker/src/game"
	"kir-dev.hu/matrix-clicker/src/server/ws"
)

const namespace = "matrix_clicker"

func NewRegistry(g game.Game, hub *ws.Hub) *prometheus.Registry {
	reg := prometheus.NewRegistry()
	reg.MustRegister(
		collectors.NewGoCollector(collectors.WithGoCollectorRuntimeMetrics(collectors.MetricsScheduler)),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
		newGameCollector(g),
		newWsCollector(hub.Stats()),
	)
	return reg
}

func Handler(reg *prometheus.Registry) http.Handler {
	return promhttp.HandlerFor(reg, promhttp.HandlerOpts{
		Registry: reg,
		ErrorLog: log.Default(),
	})
}

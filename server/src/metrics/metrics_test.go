package metrics

import (
	"testing"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/testutil"

	"kir-dev.hu/matrix-clicker/src/game"
	"kir-dev.hu/matrix-clicker/src/server/ws"
)

func TestCollectorsAreConsistent(t *testing.T) {
	g := game.NewGame()
	hub := ws.NewHub(g)

	for name, c := range map[string]prometheus.Collector{
		"game": newGameCollector(g),
		"ws":   newWsCollector(hub.Stats()),
	} {
		problems, err := testutil.CollectAndLint(c)
		if err != nil {
			t.Fatalf("%s: collect: %v", name, err)
		}
		for _, p := range problems {
			t.Errorf("%s: lint %s: %s", name, p.Metric, p.Text)
		}
	}

	reg := prometheus.NewPedanticRegistry()
	reg.MustRegister(newGameCollector(g), newWsCollector(hub.Stats()))
	if _, err := reg.Gather(); err != nil {
		t.Fatalf("gather: %v", err)
	}

	// A round in progress changes the phase one-hot and the timestamps; make sure that still
	// gathers cleanly. Stand in for the hub: Start and Stop block until their phase transitions
	// are received.
	go func() {
		for range g.PhaseTransitionChannel() {
		}
	}()
	g.Start()
	defer g.Stop()
	if _, err := reg.Gather(); err != nil {
		t.Fatalf("gather after start: %v", err)
	}
}

package metrics

import (
	"strconv"

	"github.com/prometheus/client_golang/prometheus"

	"kir-dev.hu/matrix-clicker/src/game"
)

var allPhases = []game.Phase{game.WaitingForPlayers, game.Starting, game.Playing, game.Finished}

type gameCollector struct {
	game game.Game

	phase          *prometheus.Desc
	startTime      *prometheus.Desc
	endTime        *prometheus.Desc
	teamScore      *prometheus.Desc
	teamPlayers    *prometheus.Desc
	teamClicks     *prometheus.Desc
	scoreReports   *prometheus.Desc
	roundsStarted  *prometheus.Desc
	roundsStopped  *prometheus.Desc
	roundsFinished *prometheus.Desc
}

func newGameCollector(g game.Game) *gameCollector {
	name := func(s string) string { return prometheus.BuildFQName(namespace, "game", s) }
	return &gameCollector{
		game: g,
		phase: prometheus.NewDesc(name("phase"),
			"Current game phase, one-hot: 1 for the active phase, 0 for the others.",
			[]string{"phase"}, nil),
		startTime: prometheus.NewDesc(name("start_timestamp_seconds"),
			"Unix time at which the current round enters Playing; 0 when no round is scheduled or running.",
			nil, nil),
		endTime: prometheus.NewDesc(name("end_timestamp_seconds"),
			"Unix time at which the current round finishes; 0 when no round is scheduled or running.",
			nil, nil),
		teamScore: prometheus.NewDesc(name("team_score"),
			"Score of the team in the current round; reset to 0 by /start-game.",
			[]string{"team"}, nil),
		teamPlayers: prometheus.NewDesc(name("team_players"),
			"Distinct player ids assigned to the team since process start; assignments are never removed.",
			[]string{"team"}, nil),
		teamClicks: prometheus.NewDesc(name("team_clicks_total"),
			"Accepted clicks credited to the team since process start; not reset per round.",
			[]string{"team"}, nil),
		scoreReports: prometheus.NewDesc(name("score_reports_total"),
			"cps messages processed, by outcome.",
			[]string{"result"}, nil),
		roundsStarted: prometheus.NewDesc(name("rounds_started_total"),
			"Rounds started via /start-game.",
			nil, nil),
		roundsStopped: prometheus.NewDesc(name("rounds_stopped_total"),
			"Rounds stopped via /stop-game; counts the call even if no round was running.",
			nil, nil),
		roundsFinished: prometheus.NewDesc(name("rounds_finished_total"),
			"Rounds that ran to the end of their duration.",
			nil, nil),
	}
}

func (c *gameCollector) Describe(ch chan<- *prometheus.Desc) {
	for _, d := range []*prometheus.Desc{
		c.phase, c.startTime, c.endTime, c.teamScore, c.teamPlayers, c.teamClicks,
		c.scoreReports, c.roundsStarted, c.roundsStopped, c.roundsFinished,
	} {
		ch <- d
	}
}

func (c *gameCollector) Collect(ch chan<- prometheus.Metric) {
	current := c.game.GetPhase()
	for _, p := range allPhases {
		v := 0.0
		if p == current {
			v = 1
		}
		ch <- prometheus.MustNewConstMetric(c.phase, prometheus.GaugeValue, v, p.String())
	}

	var start, end float64
	if t := c.game.StartTime(); !t.IsZero() {
		start = unixSeconds(t)
		end = unixSeconds(c.game.EndTime())
	}
	ch <- prometheus.MustNewConstMetric(c.startTime, prometheus.GaugeValue, start)
	ch <- prometheus.MustNewConstMetric(c.endTime, prometheus.GaugeValue, end)

	scores := c.game.GetTeamScores()
	sizes := c.game.GetTeamSizes()
	stats := c.game.Stats()
	for team := 0; team < game.NumberOfTeams; team++ {
		label := strconv.Itoa(team)
		ch <- prometheus.MustNewConstMetric(c.teamScore, prometheus.GaugeValue, float64(scores[team].Score), label)
		ch <- prometheus.MustNewConstMetric(c.teamPlayers, prometheus.GaugeValue, float64(sizes[team]), label)
		ch <- prometheus.MustNewConstMetric(c.teamClicks, prometheus.CounterValue, float64(stats.TeamClicks[team].Load()), label)
	}
	for r := game.ScoreResult(0); r < game.ScoreResultCount; r++ {
		ch <- prometheus.MustNewConstMetric(c.scoreReports, prometheus.CounterValue, float64(stats.ScoreReports[r].Load()), r.String())
	}
	ch <- prometheus.MustNewConstMetric(c.roundsStarted, prometheus.CounterValue, float64(stats.RoundsStarted.Load()))
	ch <- prometheus.MustNewConstMetric(c.roundsStopped, prometheus.CounterValue, float64(stats.RoundsStopped.Load()))
	ch <- prometheus.MustNewConstMetric(c.roundsFinished, prometheus.CounterValue, float64(stats.RoundsFinished.Load()))
}

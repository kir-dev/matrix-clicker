package main

import (
	"context"
	"flag"
	"log"
	"math/rand"
	"os"
	"os/signal"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"kir-dev.hu/matrix-clicker/src/server/ws"
)

var addr = flag.String("addr", "wss://api.arnyjatek.kir-dev.hu", "http service address")
var numWorkers = flag.Int("num_workers", 600, "number of workers")

func startWorker(ctx context.Context, increment int) {
	u := *addr + "/ws?playerId=" + uuid.New().String()
	c, _, err := websocket.DefaultDialer.Dial(u, nil)

	if err != nil {
		log.Fatal("dial: ", err)
	}
	defer c.Close()

	go func() {
		for {
			_, message, err := c.ReadMessage()
			if err != nil {
				log.Println("read:", err)
				return
			}
			log.Printf("recv: %s", message)
		}
	}()

	ticker := time.NewTicker(time.Millisecond * 30)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			message := ws.GameClientMessage{
				Cps: uint64(increment),
			}
			err := c.WriteJSON(message)
			if err != nil {
				log.Println("write:", err)
				return
			}
		case <-ctx.Done():
			err := c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			if err != nil {
				log.Println("write close:", err)
				return
			}
			return
		}
	}
}

func main() {
	flag.Parse()
	log.SetFlags(0)

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)
	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		<-interrupt
		cancel()
	}()

	var wg sync.WaitGroup

	for i := 0; i < *numWorkers; i++ {
		increment := rand.Intn(4) + 3
		wg.Go(func() { startWorker(ctx, increment) })
	}

	wg.Wait()
}

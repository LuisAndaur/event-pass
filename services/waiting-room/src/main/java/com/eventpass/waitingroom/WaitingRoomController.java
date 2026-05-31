package com.eventpass.waitingroom;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/waiting-room")
public class WaitingRoomController {

    private final QueueService queueService;
    private final ConcurrentHashMap<String, Sinks.Many<String>> sseSinks = new ConcurrentHashMap<>();

    public WaitingRoomController(QueueService queueService) {
        this.queueService = queueService;
    }

    @PostMapping("/join")
    public ResponseEntity<Map<String, Object>> joinQueue(@RequestBody Map<String, String> body) {
        String eventId = body.get("eventId");
        String userId = body.get("userId");

        if (eventId == null || userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "eventId and userId are required"));
        }

        long position = queueService.joinQueue(eventId, userId);
        return ResponseEntity.ok(Map.of(
                "position", position,
                "eventId", eventId,
                "status", "in_queue"
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(
            @RequestParam String eventId,
            @RequestParam String userId) {

        long position = queueService.getPosition(eventId, userId);
        long queueSize = queueService.getQueueSize(eventId);

        Map<String, Object> response = Map.of(
                "eventId", eventId,
                "userId", userId,
                "position", position,
                "queueSize", queueSize,
                "status", position >= 0 ? "in_queue" : "not_found"
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping(path = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamQueueStatus(
            @RequestParam String eventId,
            @RequestParam String userId) {

        return Flux.interval(Duration.ofSeconds(3))
                .map(tick -> {
                    long position = queueService.getPosition(eventId, userId);
                    long queueSize = queueService.getQueueSize(eventId);
                    boolean hasPass = queueService.getPosition(eventId, userId) < 0;
                    return "data: " + String.format(
                            "{\"position\":%d,\"queueSize\":%d,\"hasPass\":%b,\"eventId\":\"%s\"}",
                            position, queueSize, hasPass, eventId
                    ) + "\n\n";
                })
                .doOnCancel(() -> {});
    }
}

package com.eventpass.waitingroom;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WaitingRoomApplication {
    public static void main(String[] args) {
        SpringApplication.run(WaitingRoomApplication.class, args);
    }

    @Bean
    public OpenAPI waitingRoomOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("EventPass — Waiting Room API")
                .description("Sala de espera virtual: unirse a la fila, estado y stream SSE.")
                .version("1.0.0"));
    }
}

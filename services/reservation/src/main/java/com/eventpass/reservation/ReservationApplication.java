package com.eventpass.reservation;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ReservationApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReservationApplication.class, args);
    }

    @Bean
    public OpenAPI reservationOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("EventPass — Reservation API")
                .description("Reservas y pagos: crear reserva, consultar, cancelar y listar.")
                .version("1.0.0"));
    }
}

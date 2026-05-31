package com.eventpass.catalog;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class CatalogApplication {
    public static void main(String[] args) {
        SpringApplication.run(CatalogApplication.class, args);
    }

    @Bean
    public OpenAPI catalogOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("EventPass — Catalog API")
                .description("Catálogo de eventos: listado, detalle, creación y edición.")
                .version("1.0.0"));
    }
}

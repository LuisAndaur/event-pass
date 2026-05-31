package com.eventpass.catalog.infrastructure.persistence;

import com.eventpass.catalog.domain.Event;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    private final EventRepository repository;

    public DataSeeder(EventRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) return;

        repository.save(new Event(
                "Rock en el Estadio 2026",
                "Las mejores bandas de rock nacional e internacional en un solo lugar. Una noche inolvidable con artistas de primer nivel.",
                LocalDateTime.of(2026, 8, 15, 20, 0),
                "Estadio Monumental, Buenos Aires",
                "Conciertos",
                new BigDecimal("45000"),
                65000,
                "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800"
        ));

        repository.save(new Event(
                "Feria Gastronómica Internacional",
                "Los mejores chefs del mundo reunidos para una experiencia culinaria única. Degustaciones, talleres y shows en vivo.",
                LocalDateTime.of(2026, 7, 10, 11, 0),
                "La Rural, Palermo",
                "Gastronomía",
                new BigDecimal("15000"),
                30000,
                "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800"
        ));

        repository.save(new Event(
                "Festival de Cine Independiente",
                "Semana de cine independiente con proyecciones, charlas con directores y talleres de cinematografía.",
                LocalDateTime.of(2026, 9, 5, 14, 0),
                "Cine Teatro Ópera, CABA",
                "Cine",
                new BigDecimal("8000"),
                5000,
                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800"
        ));

        repository.save(new Event(
                "Maratón Internacional de Buenos Aires",
                "La maratón más importante de Sudamérica. Recorrido por los puntos más emblemáticos de la ciudad.",
                LocalDateTime.of(2026, 10, 20, 6, 0),
                "Obelisco, Buenos Aires",
                "Deportes",
                new BigDecimal("25000"),
                40000,
                "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800"
        ));

        repository.save(new Event(
                "Expo Tecnología 2026",
                "Innovación, startups, inteligencia artificial y robótica. El evento tech más importante del año.",
                LocalDateTime.of(2026, 11, 12, 10, 0),
                "Centro Costa Salguero",
                "Tecnología",
                new BigDecimal("20000"),
                25000,
                "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800"
        ));

        repository.save(new Event(
                "Teatro: Hamlet Remastered",
                "Versión contemporánea del clásico de Shakespeare. Actuación en vivo con efectos multimedia de última generación.",
                LocalDateTime.of(2026, 6, 20, 21, 0),
                "Teatro Colón, CABA",
                "Teatro",
                new BigDecimal("35000"),
                2500,
                "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800"
        ));

        System.out.println("✓ Catalog seeded with sample events");
    }
}
